export enum Player {
  None = 0,
  Black = 1, // User typically plays Black (moves first) or White
  White = 2,
}

export enum GameStatus {
  Playing = 'PLAYING',
  Won = 'WON',
  Draw = 'DRAW',
}

export interface Move {
  row: number;
  col: number;
}

export interface GameState {
  board: Player[][];
  currentPlayer: Player;
  status: GameStatus;
  winner: Player | null;
  history: Move[]; // For undo functionality or highlighting last move
}

export interface Difficulty {
  name: string;
  model: string;
  thinkingBudget?: number;
}