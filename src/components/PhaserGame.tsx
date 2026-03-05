import { useEffect, useRef } from 'preact/hooks';
import type { MutableRef } from 'preact/hooks';
import Phaser from 'phaser';
import { createGameConfig } from '../game/main';
import type { GameMode } from '../App';

interface PhaserGameProps {
    mode: GameMode;
    gameRef: MutableRef<Phaser.Game | null>;
}

export function PhaserGame({ mode, gameRef }: PhaserGameProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || gameRef.current) return;

        gameRef.current = new Phaser.Game(
            createGameConfig(containerRef.current, mode)
        );

        return () => {
            gameRef.current?.destroy(true);
            gameRef.current = null;
        };
    }, []); // run once on mount

    return <div class="phaser-container" ref={containerRef} />;
}
