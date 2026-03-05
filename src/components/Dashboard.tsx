export type GameChoice = "tictactoe" | "racesim";

interface DashboardProps {
  onSelectGame: (game: GameChoice) => void;
}

export function Dashboard({ onSelectGame }: DashboardProps) {
  return (
    <div class="dashboard">
      <h1 class="dashboard-title">Game Arcade</h1>
      <p class="dashboard-subtitle">Choose a game to play</p>
      <div class="dashboard-cards">
        <button class="game-card" onClick={() => onSelectGame("tictactoe")}>
          <div class="game-card-icon">✕○</div>
          <div class="game-card-name">Tic-Tac-Toe</div>
          <div class="game-card-desc">Classic 3×3 strategy — PvP or vs AI</div>
        </button>
        <button class="game-card" onClick={() => onSelectGame("racesim")}>
          <div class="game-card-icon">🏎</div>
          <div class="game-card-name">Racesim</div>
          <div class="game-card-desc">Lotus Turbo–style FPV racing</div>
        </button>
      </div>
    </div>
  );
}
