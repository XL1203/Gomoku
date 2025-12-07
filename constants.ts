
export const BOARD_SIZE = 15;
export const WIN_STREAK = 5;

// Visual constants
export const CELL_SIZE_PX = 32; // Base size for calculation, though we use responsive classes
export const CELL_SIZE_MOBILE_PX = 20;

export const DIFFICULTIES = [
  { name: '简单 (Flash)', model: 'gemini-2.5-flash', thinkingBudget: 0 },
  { name: '困难 (Pro)', model: 'gemini-3-pro-preview', thinkingBudget: 4096 }, // Uses thinking for harder gameplay
];
