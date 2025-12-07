import { Player, Move, GameStatus } from '../types';
import { BOARD_SIZE, WIN_STREAK } from '../constants';

export const createEmptyBoard = (): Player[][] => {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(Player.None));
};

export const checkWin = (board: Player[][], lastMove: Move, player: Player): boolean => {
  const { row, col } = lastMove;
  const directions = [
    [0, 1],   // Horizontal
    [1, 0],   // Vertical
    [1, 1],   // Diagonal \
    [1, -1]   // Diagonal /
  ];

  for (const [dr, dc] of directions) {
    let count = 1; // Count the placed stone itself

    // Check forward direction
    for (let i = 1; i < WIN_STREAK; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE || board[r][c] !== player) break;
      count++;
    }

    // Check backward direction
    for (let i = 1; i < WIN_STREAK; i++) {
      const r = row - dr * i;
      const c = col - dc * i;
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE || board[r][c] !== player) break;
      count++;
    }

    if (count >= WIN_STREAK) return true;
  }

  return false;
};

export const checkDraw = (board: Player[][]): boolean => {
  return board.every(row => row.every(cell => cell !== Player.None));
};
