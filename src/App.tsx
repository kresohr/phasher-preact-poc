import { useState, useRef } from 'preact/hooks';
import type { MutableRef } from 'preact/hooks';
import { Menu } from './components/Menu';
import { PhaserGame } from './components/PhaserGame';
import { HUD } from './components/HUD';
import './styles/app.css';

export type GameMode = 'pvp' | 'ai';

export function App() {
    const [mode, setMode] = useState<GameMode | null>(null);
    const gameRef = useRef<Phaser.Game | null>(null) as MutableRef<Phaser.Game | null>;

    const handleModeSelect = (selectedMode: GameMode) => {
        setMode(selectedMode);
    };

    const handleChangeMode = () => {
        setMode(null);
    };

    if (mode === null) {
        return <Menu onModeSelect={handleModeSelect} />;
    }

    return (
        <div class="game-wrapper">
            <PhaserGame mode={mode} gameRef={gameRef} />
            <HUD gameRef={gameRef} onChangeMode={handleChangeMode} />
        </div>
    );
}
