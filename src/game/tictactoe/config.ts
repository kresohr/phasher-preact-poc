import Phaser from "phaser";
import { PreloadScene } from "../scenes/PreloadScene";
import { GameScene } from "../scenes/GameScene";
import type { GameMode } from "../../App";

export function createTicTacToeConfig(
  parent: HTMLElement,
  mode: GameMode
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: 540,
    height: 540,
    parent,
    backgroundColor: "#16213e",
    scene: [PreloadScene, GameScene],
    callbacks: {
      preBoot: (game: Phaser.Game) => {
        game.registry.set("mode", mode);
      },
    },
  };
}
