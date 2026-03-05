# Game Arcade — Phaser + Preact

A multi-game arcade built with [Phaser 3](https://phaser.io/) for game logic and [Preact](https://preactjs.com/) for UI overlays. Includes a dashboard to choose between games, with two titles available:

- **Tic-Tac-Toe** — Classic 3×3 strategy game with 2-player and vs AI modes
- **Racesim** — A Lotus Turbo–inspired pseudo-3D FPV racing game

---

## 🚀 Tech Stack

- **Phaser 3.90** — Canvas-based game engine for rendering, input, and game logic
- **Preact 10.28** — Lightweight React alternative for UI overlays (dashboard, HUD, menus)
- **Vite 6** — Lightning-fast dev server and build tool
- **TypeScript 5** — Type-safe codebase

---

## 🕹️ Games

### Tic-Tac-Toe

- **2 Modes:** 2 Players (local pass & play) or vs AI (random-move opponent)
- Animated win line for victory
- Scoreboard (X, O, Draw)
- Restart & Menu buttons

### Racesim

- Pseudo-3D perspective road with curves, rumble strips, and lane markings
- Scenery (trees, bushes) alongside the road
- Player car with acceleration, braking, and steering
- Off-road speed penalty and centrifugal curve pull
- In-game retro dashboard with speed bar, RPM gauge, and lap timer
- Lap tracking with best-lap recording
- **Controls:** ↑ accelerate, ↓ brake, ← → steer

### Dashboard

- Game selection screen with cards for each available game
- Back navigation from any game to the dashboard

---

## 📦 Project Structure

```
phasher-preact-poc/
├── src/
│   ├── App.tsx              # Root Preact state machine & routing
│   ├── main.tsx             # Preact bootstrap
│   ├── components/
│   │   ├── Dashboard.tsx    # Game selection dashboard
│   │   ├── Menu.tsx         # Tic-Tac-Toe mode selection
│   │   ├── HUD.tsx          # Tic-Tac-Toe scoreboard & controls
│   │   ├── RacesimHUD.tsx   # Racesim lap info overlay
│   │   └── PhaserGame.tsx   # Phaser canvas wrapper (multi-game)
│   ├── game/
│   │   ├── main.ts          # Legacy Phaser config (unused)
│   │   ├── events.ts        # EventEmitter bridge (shared)
│   │   ├── tictactoe/
│   │   │   └── config.ts    # Tic-Tac-Toe Phaser config
│   │   ├── racesim/
│   │   │   ├── config.ts    # Racesim Phaser config
│   │   │   └── RacesimScene.ts  # Pseudo-3D racing scene
│   │   └── scenes/
│   │       ├── PreloadScene.ts
│   │       └── GameScene.ts # Tic-Tac-Toe game scene
│   └── styles/app.css       # Custom styles
├── public/
│   └── style.css            # Base styles
├── index.html
├── package.json
└── README.md
```

---

## 🏃 Getting Started

### 1. **Install dependencies**

```bash
npm install
```

### 2. **Start the dev server**

```bash
npm run dev
```

Visit [http://localhost:8080](http://localhost:8080) in your browser.

### 3. **Build for production**

```bash
npm run build
```

---

## 🧩 How It Works

- **Dashboard** (`App.tsx`) manages top-level navigation between the game selection screen and individual games.
- **PhaserGame** component accepts a `gameChoice` prop to instantiate either the Tic-Tac-Toe or Racesim Phaser config.
- **Phaser** owns each game canvas, handles rendering and input.
- **Preact** overlays the UI (scores, lap times, menus) and listens to game events via a shared EventEmitter.
- **Racesim** uses a classic pseudo-3D rendering technique: segments are projected near→far with perspective scaling and curve accumulation, then drawn far→near via painter's algorithm.

---

## 📚 Customization & Extending

- **Add a new game:** Create a new scene under `src/game/<name>/`, add a config factory, and register it in `Dashboard.tsx` and `PhaserGame.tsx`.
- **Tic-Tac-Toe:** Tweak colors, grid size, or AI in `src/game/scenes/GameScene.ts`.
- **Racesim:** Adjust track layout, speed, road width, or curvature in `src/game/racesim/RacesimScene.ts`.
- **UI:** Modify styles in `src/styles/app.css` or add new Preact components.

---

## 📝 License

MIT — see [LICENSE](LICENSE)

---

**Made with Phaser, Preact, and ❤️.**
