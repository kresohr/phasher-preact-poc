import Phaser from "phaser";

export const EVENTS = {
  // tic-tac-toe
  TURN_CHANGED: "turn_changed",
  GAME_OVER: "game_over",
  // racesim
  RACE_STARTED: "race_started",
  RACE_LAP: "race_lap",
} as const;

export interface TurnChangedPayload {
  turn: "X" | "O";
}

export interface GameOverPayload {
  winner: "X" | "O" | null;
}

export interface RaceLapPayload {
  lap: number;
  time: number;
  best: number;
}

export const gameEvents = new Phaser.Events.EventEmitter();
