import { useEffect, useRef } from "preact/hooks";
import type { MutableRef } from "preact/hooks";
import Phaser from "phaser";
import { createTicTacToeConfig } from "../game/tictactoe/config";
import { createRacesimConfig } from "../game/racesim/config";
import type { GameMode } from "../App";
import type { GameChoice } from "./Dashboard";

interface PhaserGameProps {
  gameChoice: GameChoice;
  /** only used by tictactoe */
  mode?: GameMode;
  gameRef: MutableRef<Phaser.Game | null>;
}

export function PhaserGame({ gameChoice, mode, gameRef }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config =
      gameChoice === "racesim"
        ? createRacesimConfig(containerRef.current)
        : createTicTacToeConfig(containerRef.current, mode ?? "pvp");

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []); // run once on mount

  return <div class="phaser-container" ref={containerRef} />;
}
