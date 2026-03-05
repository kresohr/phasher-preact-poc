import { useState, useRef } from "preact/hooks";
import type { MutableRef } from "preact/hooks";
import { Dashboard } from "./components/Dashboard";
import type { GameChoice } from "./components/Dashboard";
import { Menu } from "./components/Menu";
import { PhaserGame } from "./components/PhaserGame";
import { HUD } from "./components/HUD";
import { RacesimHUD } from "./components/RacesimHUD";
import "./styles/app.css";

export type GameMode = "pvp" | "ai";

type AppState =
  | { screen: "dashboard" }
  | { screen: "ttt-menu" }
  | { screen: "ttt-game"; mode: GameMode }
  | { screen: "racesim" };

export function App() {
  const [state, setState] = useState<AppState>({ screen: "dashboard" });
  const gameRef = useRef<Phaser.Game | null>(
    null
  ) as MutableRef<Phaser.Game | null>;

  const destroyGame = () => {
    gameRef.current?.destroy(true);
    gameRef.current = null;
  };

  const goToDashboard = () => {
    destroyGame();
    setState({ screen: "dashboard" });
  };

  const handleSelectGame = (game: GameChoice) => {
    if (game === "tictactoe") {
      setState({ screen: "ttt-menu" });
    } else {
      setState({ screen: "racesim" });
    }
  };

  const handleModeSelect = (mode: GameMode) => {
    setState({ screen: "ttt-game", mode });
  };

  if (state.screen === "dashboard") {
    return <Dashboard onSelectGame={handleSelectGame} />;
  }

  if (state.screen === "ttt-menu") {
    return (
      <div>
        <Menu onModeSelect={handleModeSelect} />
        <div class="back-row">
          <button class="menu-btn back-btn" onClick={goToDashboard}>
            ← Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (state.screen === "ttt-game") {
    return (
      <div class="game-wrapper">
        <PhaserGame
          gameChoice="tictactoe"
          mode={state.mode}
          gameRef={gameRef}
        />
        <HUD gameRef={gameRef} onChangeMode={goToDashboard} />
      </div>
    );
  }

  // racesim
  return (
    <div class="game-wrapper">
      <PhaserGame gameChoice="racesim" gameRef={gameRef} />
      <RacesimHUD gameRef={gameRef} onBack={goToDashboard} />
    </div>
  );
}
