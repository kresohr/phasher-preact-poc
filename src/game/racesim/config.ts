import Phaser from "phaser";
import { RacesimScene } from "./RacesimScene";

export function createRacesimConfig(
  parent: HTMLElement
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent,
    backgroundColor: "#1a1a2e",
    scene: [RacesimScene],
    input: {
      keyboard: true,
    },
  };
}
