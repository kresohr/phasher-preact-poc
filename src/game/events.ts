import Phaser from 'phaser';

export const EVENTS = {
    TURN_CHANGED: 'turn_changed',
    GAME_OVER: 'game_over',
} as const;

export interface TurnChangedPayload {
    turn: 'X' | 'O';
}

export interface GameOverPayload {
    winner: 'X' | 'O' | null;
}

export const gameEvents = new Phaser.Events.EventEmitter();
