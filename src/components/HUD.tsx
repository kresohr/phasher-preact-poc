import { useState, useEffect } from 'preact/hooks';
import type { MutableRef } from 'preact/hooks';
import { gameEvents, EVENTS } from '../game/events';
import type { GameOverPayload, TurnChangedPayload } from '../game/events';
import type { GameScene } from '../game/scenes/GameScene';

interface HUDProps {
    gameRef: MutableRef<Phaser.Game | null>;
    onChangeMode: () => void;
}

interface Scores {
    X: number;
    O: number;
    draw: number;
}

export function HUD({ gameRef, onChangeMode }: HUDProps) {
    const [status, setStatus] = useState<string>("X's turn");
    const [scores, setScores] = useState<Scores>({ X: 0, O: 0, draw: 0 });
    const [gameOver, setGameOver] = useState(false);

    useEffect(() => {
        const onTurnChanged = (payload: TurnChangedPayload) => {
            setStatus(`${payload.turn}'s turn`);
            setGameOver(false);
        };

        const onGameOver = (payload: GameOverPayload) => {
            if (payload.winner) {
                setStatus(`${payload.winner} wins! 🎉`);
                setScores(prev => ({
                    ...prev,
                    [payload.winner!]: prev[payload.winner as keyof Scores] + 1,
                }));
            } else {
                setStatus("It's a draw!");
                setScores(prev => ({ ...prev, draw: prev.draw + 1 }));
            }
            setGameOver(true);
        };

        gameEvents.on(EVENTS.TURN_CHANGED, onTurnChanged);
        gameEvents.on(EVENTS.GAME_OVER, onGameOver);

        return () => {
            gameEvents.off(EVENTS.TURN_CHANGED, onTurnChanged);
            gameEvents.off(EVENTS.GAME_OVER, onGameOver);
        };
    }, []);

    const handleRestart = () => {
        if (!gameRef.current) return;
        const scene = gameRef.current.scene.getScene('GameScene') as GameScene;
        scene?.restartGame();
    };

    return (
        <div class="hud">
            <div class="hud-scores">
                <div class="score score-x">
                    <span class="score-label">X</span>
                    <span class="score-value">{scores.X}</span>
                </div>
                <div class="score score-draw">
                    <span class="score-label">Draw</span>
                    <span class="score-value">{scores.draw}</span>
                </div>
                <div class="score score-o">
                    <span class="score-label">O</span>
                    <span class="score-value">{scores.O}</span>
                </div>
            </div>

            <div class="hud-status">{status}</div>

            <div class="hud-actions">
                {gameOver && (
                    <button class="hud-btn" onClick={handleRestart}>
                        Restart
                    </button>
                )}
                <button class="hud-btn secondary" onClick={onChangeMode}>
                    Menu
                </button>
            </div>
        </div>
    );
}
