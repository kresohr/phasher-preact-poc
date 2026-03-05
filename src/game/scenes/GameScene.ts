import Phaser from 'phaser';
import { gameEvents, EVENTS } from '../events';
import type { GameMode } from '../../App';

type CellValue = null | 'X' | 'O';

const CELL_SIZE = 180;
const COLS = 3;
const SYMBOL_PAD = 28;
const LINE_THICKNESS = 8;
const SYMBOL_THICKNESS = 12;
const GRID_COLOR = 0xd0d0e8;
const X_COLOR = 0xe94560;
const O_COLOR = 0x4ecca3;
const WIN_COLOR = 0xffd700;

const WIN_LINES: [number, number, number][] = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6],             // diagonals
];

export class GameScene extends Phaser.Scene {
    private board: CellValue[] = [];
    private currentTurn: 'X' | 'O' = 'X';
    private isGameOver = false;
    private isAIThinking = false;
    private mode: GameMode = 'pvp';
    private symbolGraphics!: Phaser.GameObjects.Graphics;
    private gridGraphics!: Phaser.GameObjects.Graphics;
    private winLineGraphics!: Phaser.GameObjects.Graphics;

    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.mode = this.registry.get('mode') as GameMode;
        this.gridGraphics = this.add.graphics();
        this.drawGrid();
        this.initGame();
        this.input.on('pointerdown', this.handleClick, this);
    }

    private initGame() {
        this.board = new Array(9).fill(null);
        this.currentTurn = 'X';
        this.isGameOver = false;
        this.isAIThinking = false;

        if (this.symbolGraphics) this.symbolGraphics.destroy();
        if (this.winLineGraphics) this.winLineGraphics.destroy();

        this.symbolGraphics = this.add.graphics();
        this.winLineGraphics = this.add.graphics();

        gameEvents.emit(EVENTS.TURN_CHANGED, { turn: this.currentTurn });
    }

    private drawGrid() {
        this.gridGraphics.clear();
        this.gridGraphics.lineStyle(LINE_THICKNESS, GRID_COLOR, 1);

        // vertical lines
        this.gridGraphics.lineBetween(CELL_SIZE,     20,  CELL_SIZE,     520);
        this.gridGraphics.lineBetween(CELL_SIZE * 2, 20,  CELL_SIZE * 2, 520);

        // horizontal lines
        this.gridGraphics.lineBetween(20,  CELL_SIZE,     520, CELL_SIZE);
        this.gridGraphics.lineBetween(20,  CELL_SIZE * 2, 520, CELL_SIZE * 2);
    }

    private handleClick(pointer: Phaser.Input.Pointer) {
        if (this.isGameOver || this.isAIThinking) return;
        if (this.mode === 'ai' && this.currentTurn === 'O') return;

        const col = Math.floor(pointer.x / CELL_SIZE);
        const row = Math.floor(pointer.y / CELL_SIZE);
        if (col < 0 || col >= COLS || row < 0 || row >= COLS) return;

        this.playMove(row * COLS + col);
    }

    private playMove(idx: number) {
        if (this.board[idx] !== null) return;

        this.board[idx] = this.currentTurn;
        this.drawSymbol(idx, this.currentTurn);

        const winner = this.checkWin();
        if (winner) {
            this.handleGameOver(winner);
            return;
        }

        if (this.checkDraw()) {
            this.handleGameOver(null);
            return;
        }

        this.currentTurn = this.currentTurn === 'X' ? 'O' : 'X';
        gameEvents.emit(EVENTS.TURN_CHANGED, { turn: this.currentTurn });

        if (this.mode === 'ai' && this.currentTurn === 'O') {
            this.isAIThinking = true;
            this.time.delayedCall(450, this.doAIMove, [], this);
        }
    }

    private doAIMove() {
        const empty = this.board
            .map((v, i) => (v === null ? i : -1))
            .filter(i => i !== -1);

        if (empty.length === 0) return;

        const idx = empty[Math.floor(Math.random() * empty.length)];
        this.isAIThinking = false;
        this.playMove(idx);
    }

    private cellCenter(idx: number): { x: number; y: number } {
        const col = idx % COLS;
        const row = Math.floor(idx / COLS);
        return {
            x: col * CELL_SIZE + CELL_SIZE / 2,
            y: row * CELL_SIZE + CELL_SIZE / 2,
        };
    }

    private drawSymbol(idx: number, symbol: 'X' | 'O') {
        const { x, y } = this.cellCenter(idx);
        const half = CELL_SIZE / 2 - SYMBOL_PAD;

        if (symbol === 'X') {
            this.symbolGraphics.lineStyle(SYMBOL_THICKNESS, X_COLOR, 1);
            this.symbolGraphics.lineBetween(x - half, y - half, x + half, y + half);
            this.symbolGraphics.lineBetween(x + half, y - half, x - half, y + half);
        } else {
            this.symbolGraphics.lineStyle(SYMBOL_THICKNESS, O_COLOR, 1);
            this.symbolGraphics.strokeCircle(x, y, half);
        }
    }

    private checkWin(): 'X' | 'O' | null {
        for (const [a, b, c] of WIN_LINES) {
            if (
                this.board[a] !== null &&
                this.board[a] === this.board[b] &&
                this.board[b] === this.board[c]
            ) {
                this.animateWinLine(a, c);
                return this.board[a] as 'X' | 'O';
            }
        }
        return null;
    }

    private animateWinLine(fromIdx: number, toIdx: number) {
        const from = this.cellCenter(fromIdx);
        const to = this.cellCenter(toIdx);
        const progress = { t: 0 };

        this.tweens.add({
            targets: progress,
            t: 1,
            duration: 400,
            ease: 'Power2',
            onUpdate: () => {
                this.winLineGraphics.clear();
                this.winLineGraphics.lineStyle(LINE_THICKNESS + 4, WIN_COLOR, 1);
                this.winLineGraphics.lineBetween(
                    from.x,
                    from.y,
                    from.x + (to.x - from.x) * progress.t,
                    from.y + (to.y - from.y) * progress.t,
                );
            },
        });
    }

    private checkDraw(): boolean {
        return this.board.every(cell => cell !== null);
    }

    private handleGameOver(winner: 'X' | 'O' | null) {
        this.isGameOver = true;
        gameEvents.emit(EVENTS.GAME_OVER, { winner });
    }

    restartGame() {
        this.initGame();
    }
}
