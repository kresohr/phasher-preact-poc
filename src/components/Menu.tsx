import type { GameMode } from '../App';

interface MenuProps {
    onModeSelect: (mode: GameMode) => void;
}

export function Menu({ onModeSelect }: MenuProps) {
    return (
        <div class="menu">
            <h1 class="menu-title">Tic-Tac-Toe</h1>
            <p class="menu-subtitle">Choose your mode</p>
            <div class="menu-buttons">
                <button class="menu-btn" onClick={() => onModeSelect('pvp')}>
                    2 Players
                </button>
                <button class="menu-btn" onClick={() => onModeSelect('ai')}>
                    vs AI
                </button>
            </div>
        </div>
    );
}
