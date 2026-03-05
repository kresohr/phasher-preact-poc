import Phaser from "phaser";
import { gameEvents, EVENTS } from "../events";

/**
 * Racesim – a Lotus Turbo–inspired pseudo-3D FPV racing game.
 *
 * The road is drawn as a series of projected horizontal scanlines that
 * simulate depth via perspective scaling. The player car sits at the
 * bottom of the screen and can steer left/right while the road curves
 * and scenery scrolls past.
 */

// ── tunables ──────────────────────────────────────────────────────────
const SEG_LENGTH = 200; // world-units per segment
const DRAW_DIST = 200; // how many segments ahead to draw
const LANES = 3;
const ROAD_HALF = 350; // road half-width in screen px at z = 1 segment

// The horizon sits at 35% from the top of the screen.
// DEPTH_K controls how the road maps to screen rows below the horizon:
//   screenY = horizonY + DEPTH_K / dz
// We pick DEPTH_K so that the nearest rendered segment (2 segments ahead)
// projects to exactly the bottom of the screen.
//   screenH = horizonY + DEPTH_K / (2 * SEG_LENGTH)
//   (screenH - horizonY) = DEPTH_K / (2 * SEG_LENGTH)
//   DEPTH_K = (screenH - horizonY) * 2 * SEG_LENGTH
// With screenH=600, horizonY=210: DEPTH_K = 390 * 400 = 156 000
// We compute it at runtime in drawRoad().

const CURVE_STRENGTH = 1.8; // visual curvature multiplier

const MAX_SPEED = SEG_LENGTH * 60;
const ACCEL = MAX_SPEED / 3;
const BRAKE_DECEL = MAX_SPEED;
const NATURAL_DECEL = MAX_SPEED / 5;
const OFF_ROAD_DECEL = MAX_SPEED * 0.8;
const STEER_SPEED = 3.0;

const COLORS = {
  sky: 0x2255aa,
  grass1: 0x10aa10,
  grass2: 0x009a00,
  road1: 0x6b6b6b,
  road2: 0x636363,
  rumble1: 0xff0000,
  rumble2: 0xffffff,
  lane: 0xcccccc,
  dash_bg: 0x111111,
  dash_border: 0x44ff44,
  speedo: 0x44ff44,
  tacho: 0xff4444,
  lapColor: 0xffff44,
};

interface Segment {
  index: number;
  p: { world: { z: number }; screen: { x: number; y: number; w: number } };
  curve: number;
  color: { road: number; grass: number; rumble: number };
}

export class RacesimScene extends Phaser.Scene {
  private segments: Segment[] = [];
  private totalSegments = 0;
  private trackLength = 0;

  private speed = 0;
  private position = 0; // camera Z in world coords
  private playerX = 0; // -1 (left) to +1 (right)
  private steer = 0;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private roadGfx!: Phaser.GameObjects.Graphics;
  private overlayGfx!: Phaser.GameObjects.Graphics;

  private screenW = 800;
  private screenH = 600;

  private lap = 0;
  private lapTime = 0;
  private bestLap = 0;

  constructor() {
    super({ key: "RacesimScene" });
  }

  create() {
    this.screenW = Number(this.game.config.width);
    this.screenH = Number(this.game.config.height);

    this.roadGfx = this.add.graphics();
    this.overlayGfx = this.add.graphics();

    this.cursors = this.input.keyboard!.createCursorKeys();

    this.buildTrack();
    this.speed = 0;
    this.position = 0;
    this.playerX = 0;
    this.lap = 0;
    this.bestLap = 0;
    this.lapTime = 0;

    gameEvents.emit(EVENTS.RACE_STARTED);
  }

  private buildTrack() {
    this.segments = [];

    // Create a circuit: straights + curves
    const layout: { length: number; curve: number }[] = [
      { length: 50, curve: 0 },
      { length: 40, curve: 2 },
      { length: 30, curve: 0 },
      { length: 60, curve: -3 },
      { length: 40, curve: 0 },
      { length: 50, curve: 4 },
      { length: 30, curve: 0 },
      { length: 40, curve: -2 },
      { length: 60, curve: 0 },
      { length: 30, curve: 3 },
      { length: 20, curve: 0 },
      { length: 50, curve: -4 },
    ];

    let idx = 0;
    for (const section of layout) {
      for (let i = 0; i < section.length; i++) {
        const dark = Math.floor(idx / 3) % 2 === 0;
        this.segments.push({
          index: idx,
          p: {
            world: { z: idx * SEG_LENGTH },
            screen: { x: 0, y: 0, w: 0 },
          },
          curve: section.curve,
          color: {
            road: dark ? COLORS.road1 : COLORS.road2,
            grass: dark ? COLORS.grass1 : COLORS.grass2,
            rumble: dark ? COLORS.rumble1 : COLORS.rumble2,
          },
        });
        idx++;
      }
    }

    this.totalSegments = this.segments.length;
    this.trackLength = this.totalSegments * SEG_LENGTH;
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000;

    this.handleInput(dt);
    this.updatePosition(dt);
    this.drawRoad();
    this.drawDashboard();
    this.updateLap(dt);
  }

  // ── input ─────────────────────────────────────────────────────────
  private handleInput(dt: number) {
    // acceleration / braking
    if (this.cursors.up.isDown) {
      this.speed += ACCEL * dt;
    } else if (this.cursors.down.isDown) {
      this.speed -= BRAKE_DECEL * dt;
    } else {
      this.speed -= NATURAL_DECEL * dt;
    }

    this.speed = Phaser.Math.Clamp(this.speed, 0, MAX_SPEED);

    // steering
    if (this.cursors.left.isDown) {
      this.steer = -STEER_SPEED;
    } else if (this.cursors.right.isDown) {
      this.steer = STEER_SPEED;
    } else {
      this.steer = 0;
    }

    // off-road slowdown
    if (Math.abs(this.playerX) > 1.0) {
      this.speed -= OFF_ROAD_DECEL * dt;
      this.speed = Math.max(this.speed, 0);
    }
  }

  private updatePosition(dt: number) {
    // centrifugal displacement from curves
    const segIdx = Math.floor(this.position / SEG_LENGTH) % this.totalSegments;
    const seg = this.segments[segIdx];
    const speedRatio = this.speed / MAX_SPEED;

    this.playerX += this.steer * speedRatio * dt;
    this.playerX += (seg.curve / 50) * speedRatio * speedRatio * dt * 30;
    this.playerX = Phaser.Math.Clamp(this.playerX, -2.5, 2.5);

    this.position += this.speed * dt;
    if (this.position >= this.trackLength) {
      this.position -= this.trackLength;
    }
  }

  // ── rendering ─────────────────────────────────────────────────────
  private drawRoad() {
    this.roadGfx.clear();

    const W = this.screenW;
    const H = this.screenH;
    const horizonY = Math.round(H * 0.35);

    // Compute depth constant so nearest rendered segment → bottom of screen
    const NEAR_SEG = 2; // skip first 2 segments (too close)
    const depthK = (H - horizonY) * NEAR_SEG * SEG_LENGTH;

    // ── sky ──
    this.roadGfx.fillStyle(COLORS.sky, 1);
    this.roadGfx.fillRect(0, 0, W, horizonY);

    // ── ground (default grass below horizon) ──
    this.roadGfx.fillStyle(COLORS.grass1, 1);
    this.roadGfx.fillRect(0, horizonY, W, H - horizonY);

    const baseIdx = Math.floor(this.position / SEG_LENGTH);
    const camZ = this.position;

    // ── Phase 1: project each segment (near → far) ──
    // Accumulate curve offset as we go from near to far.
    const projected: { x: number; y: number; w: number; seg: Segment }[] = [];
    let dx = 0; // curve offset rate (screen px per segment)
    let curveX = 0; // accumulated curve offset in screen px

    for (let n = NEAR_SEG; n <= DRAW_DIST; n++) {
      const segI = (baseIdx + n) % this.totalSegments;
      const seg = this.segments[segI];

      let wz = seg.p.world.z;
      if (wz < camZ) wz += this.trackLength;
      const dz = wz - camZ;
      if (dz <= 0) continue;

      // Perspective scale: large for near, tiny for far
      const scale = depthK / dz;

      // Screen Y: horizonY at infinity, moves toward H for close segments
      const sy = horizonY + scale;

      // Road half-width in screen px
      const sw = (ROAD_HALF * scale) / (H - horizonY);

      // Screen X: center shifted by curve + player lateral position
      const sx = W / 2 + curveX - this.playerX * sw * 2;

      projected.push({ x: sx, y: sy, w: sw, seg });

      // Curve accumulation (quadratic: dx grows, curveX accelerates)
      dx += seg.curve * CURVE_STRENGTH;
      curveX += (dx * scale) / (H - horizonY);
    }

    // ── Phase 2: draw far → near (painter's algorithm) ──
    let maxY = horizonY; // clip: don't draw above the horizon

    for (let i = projected.length - 1; i > 0; i--) {
      const far = projected[i]; // farther (toward horizon, smaller y)
      const near = projected[i - 1]; // nearer  (toward bottom, larger y)

      // Skip segments fully above horizon or fully below screen
      if (far.y < horizonY && near.y < horizonY) continue;
      if (far.y > H + 50) continue;

      // Clamp the far edge so we don't paint above the horizon
      const fy = Math.max(far.y, horizonY);
      const ny = Math.min(near.y, H + 200); // allow a little overflow
      if (ny <= fy) continue;

      // grass strip
      this.roadGfx.fillStyle(far.seg.color.grass, 1);
      this.roadGfx.fillRect(0, fy, W, ny - fy);

      // rumble strips (slightly wider than road)
      this.drawTrapezoid(
        this.roadGfx,
        far.x,
        fy,
        far.w * 1.15,
        near.x,
        ny,
        near.w * 1.15,
        far.seg.color.rumble
      );

      // road surface
      this.drawTrapezoid(
        this.roadGfx,
        far.x,
        fy,
        far.w,
        near.x,
        ny,
        near.w,
        far.seg.color.road
      );

      // lane markings (dashed: only on alternating color bands)
      if (far.seg.color.road === COLORS.road1) {
        for (let l = 1; l < LANES; l++) {
          const frac = ((l / LANES) * 2 - 1) * 0.5;
          this.drawTrapezoid(
            this.roadGfx,
            far.x + far.w * frac,
            fy,
            far.w * 0.02,
            near.x + near.w * frac,
            ny,
            near.w * 0.02,
            COLORS.lane
          );
        }
      }

      // scenery (trees + bushes on road sides)
      if (far.seg.index % 5 === 0 && i < projected.length - 2) {
        this.drawSceneryItem(far.x, fy, far.w, far.seg.index, "tree");
      } else if (far.seg.index % 9 === 0 && i < projected.length - 2) {
        this.drawSceneryItem(far.x, fy, far.w, far.seg.index, "bush");
      }

      maxY = Math.max(maxY, fy);
    }

    // player car at bottom center
    this.drawPlayerCar();
  }

  private drawTrapezoid(
    gfx: Phaser.GameObjects.Graphics,
    x1: number,
    y1: number,
    w1: number,
    x2: number,
    y2: number,
    w2: number,
    color: number
  ) {
    gfx.fillStyle(color, 1);
    gfx.beginPath();
    gfx.moveTo(x1 - w1, y1);
    gfx.lineTo(x1 + w1, y1);
    gfx.lineTo(x2 + w2, y2);
    gfx.lineTo(x2 - w2, y2);
    gfx.closePath();
    gfx.fillPath();
  }

  private drawSceneryItem(
    roadX: number,
    roadY: number,
    roadW: number,
    segIndex: number,
    kind: "tree" | "bush"
  ) {
    const side = segIndex % 2 === 0 ? -1 : 1;
    const offset = roadW * 1.5 * side;
    const cx = roadX + offset;
    const h = kind === "tree" ? roadW * 0.25 : roadW * 0.1;
    const w = kind === "tree" ? roadW * 0.06 : roadW * 0.12;

    if (kind === "tree") {
      // trunk
      this.roadGfx.fillStyle(0x8b4513, 1);
      this.roadGfx.fillRect(cx - w * 0.3, roadY - h * 0.5, w * 0.6, h * 0.5);
      // foliage
      this.roadGfx.fillStyle(0x006600, 1);
      this.roadGfx.fillTriangle(
        cx - w,
        roadY - h * 0.4,
        cx + w,
        roadY - h * 0.4,
        cx,
        roadY - h * 1.2
      );
    } else {
      this.roadGfx.fillStyle(0x228822, 1);
      this.roadGfx.fillEllipse(cx, roadY - h * 0.5, w * 2, h);
    }
  }

  private drawPlayerCar() {
    const cx = this.screenW / 2 + this.steer * 12;
    const cy = this.screenH - 60;
    const g = this.roadGfx;

    // shadow
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, cy + 14, 100, 18);

    // body
    g.fillStyle(0xdd1111, 1);
    g.beginPath();
    g.moveTo(cx - 40, cy + 12);
    g.lineTo(cx + 40, cy + 12);
    g.lineTo(cx + 30, cy - 24);
    g.lineTo(cx - 30, cy - 24);
    g.closePath();
    g.fillPath();

    // windshield
    g.fillStyle(0x44aaff, 0.6);
    g.beginPath();
    g.moveTo(cx - 22, cy - 22);
    g.lineTo(cx + 22, cy - 22);
    g.lineTo(cx + 14, cy - 38);
    g.lineTo(cx - 14, cy - 38);
    g.closePath();
    g.fillPath();

    // rear wing
    g.fillStyle(0xaa0000, 1);
    g.fillRect(cx - 44, cy + 8, 88, 5);

    // wheels
    g.fillStyle(0x222222, 1);
    g.fillRect(cx - 46, cy - 12, 9, 22);
    g.fillRect(cx + 37, cy - 12, 9, 22);
  }

  // ── dashboard ─────────────────────────────────────────────────────
  private drawDashboard() {
    const g = this.overlayGfx;
    g.clear();

    const dw = 280;
    const dh = 70;
    const dx = (this.screenW - dw) / 2;
    const dy = this.screenH - dh - 54;

    // background
    g.fillStyle(COLORS.dash_bg, 0.85);
    g.fillRect(dx, dy, dw, dh);
    g.lineStyle(2, COLORS.dash_border, 0.8);
    g.strokeRect(dx, dy, dw, dh);

    // speed bar
    const speedRatio = this.speed / MAX_SPEED;
    const barW = 100;
    const barH = 10;
    const barX = dx + 10;
    const barY = dy + 14;

    g.fillStyle(0x333333, 1);
    g.fillRect(barX, barY, barW, barH);
    g.fillStyle(COLORS.speedo, 1);
    g.fillRect(barX, barY, barW * speedRatio, barH);

    // speed text
    const speedKmh = Math.round(speedRatio * 320);
    this.drawText(
      g,
      `${speedKmh} km/h`,
      barX + barW + 8,
      barY - 1,
      COLORS.speedo,
      12
    );
    this.drawText(g, "SPD", barX, barY - 13, COLORS.speedo, 9);

    // rpm bar (faked from speed)
    const rpmRatio = ((speedRatio * 7) % 1.0) * 0.6 + speedRatio * 0.4;
    const rpmY = barY + 24;
    g.fillStyle(0x333333, 1);
    g.fillRect(barX, rpmY, barW, barH);
    g.fillStyle(rpmRatio > 0.85 ? 0xff2222 : COLORS.tacho, 1);
    g.fillRect(barX, rpmY, barW * Phaser.Math.Clamp(rpmRatio, 0, 1), barH);
    this.drawText(g, "RPM", barX, rpmY - 13, COLORS.tacho, 9);

    // lap info
    const lapX = dx + 140;
    const lapY = dy + 8;
    this.drawText(g, `LAP ${this.lap}`, lapX, lapY, COLORS.lapColor, 12);
    this.drawText(
      g,
      `TIME ${this.formatTime(this.lapTime)}`,
      lapX,
      lapY + 18,
      0xffffff,
      11
    );
    if (this.bestLap > 0) {
      this.drawText(
        g,
        `BEST ${this.formatTime(this.bestLap)}`,
        lapX,
        lapY + 34,
        0x44ff44,
        11
      );
    }
  }

  private drawText(
    _g: Phaser.GameObjects.Graphics,
    text: string,
    x: number,
    y: number,
    color: number,
    size: number
  ) {
    // Phaser Graphics has no text—use a simple bitmap approach via scene text
    // We'll create/update lightweight text objects cached by content position
    const key = `txt_${x}_${y}`;
    let txt = this.children.getByName(key) as Phaser.GameObjects.Text | null;
    if (!txt) {
      txt = this.add.text(x, y, text, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: `${size}px`,
        color: `#${color.toString(16).padStart(6, "0")}`,
      });
      txt.setName(key);
      txt.setDepth(100);
    } else {
      txt.setText(text);
      txt.setStyle({
        fontFamily: '"Press Start 2P", monospace',
        fontSize: `${size}px`,
        color: `#${color.toString(16).padStart(6, "0")}`,
      });
    }
  }

  private formatTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toFixed(1).padStart(4, "0")}`;
  }

  // ── lap tracking ──────────────────────────────────────────────────
  private prevPosition = 0;

  private updateLap(dt: number) {
    // detect crossing start line (position wraps around)
    if (this.speed > 0) {
      this.lapTime += dt;
    }

    if (this.position < this.prevPosition && this.speed > 0) {
      // crossed the start/finish
      if (this.lap > 0 && this.lapTime > 2) {
        if (this.bestLap === 0 || this.lapTime < this.bestLap) {
          this.bestLap = this.lapTime;
        }
        gameEvents.emit(EVENTS.RACE_LAP, {
          lap: this.lap,
          time: this.lapTime,
          best: this.bestLap,
        });
      }
      this.lap++;
      this.lapTime = 0;
    }
    this.prevPosition = this.position;
  }
}
