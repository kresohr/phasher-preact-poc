# Tic-Tac-Toe (X & O) — Phaser + Preact

A modern, fast, and interactive Tic-Tac-Toe game built with [Phaser 3](https://phaser.io/) for game logic and [Preact](https://preactjs.com/) for UI overlays. Supports both 2-player local and vs AI modes, with animated win lines and a clean, responsive interface.

---

## 🚀 Tech Stack

- **Phaser 3.90** — Canvas-based game engine for rendering, input, and game logic
- **Preact 10.28** — Lightweight React alternative for UI overlays (score, menu, restart)
- **Vite 6** — Lightning-fast dev server and build tool
- **TypeScript 5** — Type-safe codebase

---

## 🕹️ Features

- **2 Modes:**
  - 2 Players (local pass & play)
  - vs AI (random-move opponent)
- **Animated win line** for victory
- **Scoreboard** (X, O, Draw)
- **Restart & Menu** buttons
- **Responsive UI**
- **No external assets** — everything drawn with Phaser Graphics

---

## 📦 Project Structure

```
phasher-preact-poc/
├── src/
│   ├── App.tsx           # Root Preact state machine
│   ├── main.tsx          # Preact bootstrap
│   ├── components/
│   │   ├── Menu.tsx      # Mode selection menu
│   │   ├── HUD.tsx       # Scoreboard & controls
│   │   └── PhaserGame.tsx# Phaser canvas wrapper
│   ├── game/
│   │   ├── main.ts       # Phaser config factory
│   │   ├── events.ts     # EventEmitter bridge
│   │   └── scenes/
│   │       ├── PreloadScene.ts
│   │       └── GameScene.ts
│   └── styles/app.css    # Custom styles
├── public/
│   └── style.css         # Base styles
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

- **Phaser** owns the canvas, draws the grid, handles input, and animates win lines.
- **Preact** overlays the UI (score, restart, menu) and listens to game events via a shared EventEmitter.
- **AI** picks a random empty cell after X's move in "vs AI" mode.
- **Restart** resets the board and score persists for the session.

---

## 📚 Customization & Extending

- Change colors, grid size, or add new features in `src/game/scenes/GameScene.ts`.
- UI tweaks can be made in `src/components/HUD.tsx` and `src/styles/app.css`.
- Add new scenes or overlays as needed — the architecture is modular.

---

## 📝 License

MIT — see [LICENSE](LICENSE)

---

**Made with Phaser, Preact, and ❤️.**
