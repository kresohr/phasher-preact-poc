import { useState, useEffect } from "preact/hooks";
import type { MutableRef } from "preact/hooks";
import { gameEvents, EVENTS } from "../game/events";
import type { RaceLapPayload } from "../game/events";

interface RacesimHUDProps {
  gameRef: MutableRef<Phaser.Game | null>;
  onBack: () => void;
}

export function RacesimHUD({ onBack }: RacesimHUDProps) {
  const [lapInfo, setLapInfo] = useState<string>("Press ↑ to accelerate");
  const [bestLap, setBestLap] = useState<string>("");

  useEffect(() => {
    const onLap = (payload: RaceLapPayload) => {
      const m = Math.floor(payload.time / 60);
      const s = (payload.time % 60).toFixed(1);
      setLapInfo(`Lap ${payload.lap} — ${m}:${s.padStart(4, "0")}`);
      if (payload.best > 0) {
        const bm = Math.floor(payload.best / 60);
        const bs = (payload.best % 60).toFixed(1);
        setBestLap(`Best ${bm}:${bs.padStart(4, "0")}`);
      }
    };

    gameEvents.on(EVENTS.RACE_LAP, onLap);
    return () => {
      gameEvents.off(EVENTS.RACE_LAP, onLap);
    };
  }, []);

  return (
    <div class="hud racesim-hud">
      <div class="hud-status">{lapInfo}</div>
      {bestLap && <div class="hud-status best-lap">{bestLap}</div>}
      <div class="hud-actions">
        <button class="hud-btn secondary" onClick={onBack}>
          Dashboard
        </button>
      </div>
    </div>
  );
}
