import { GoogleGenAI, Type } from "@google/genai";
import { Player, Move } from '../types';
import { BOARD_SIZE } from '../constants';

const API_KEY = process.env.API_KEY || '';

// Initialize AI only if key exists (handled in UI if not)
const ai = new GoogleGenAI({ apiKey: API_KEY });

const getBoardString = (board: Player[][]): string => {
  // Convert board to a readable string representation
  // 0 = Empty, 1 = Black, 2 = White
  // We use coordinates headers to help the model
  let str = "   ";
  for(let i=0; i<BOARD_SIZE; i++) str += (i % 10).toString() + " ";
  str += "\n";

  for (let r = 0; r < BOARD_SIZE; r++) {
    str += (r % 10).toString() + "  "; // Row index
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      const symbol = cell === Player.None ? '.' : (cell === Player.Black ? 'X' : 'O');
      str += symbol + " ";
    }
    str += "\n";
  }
  return str;
};

export const getGeminiMove = async (
  board: Player[][],
  aiPlayer: Player,
  modelName: string,
  thinkingBudget: number = 0
): Promise<Move> => {
  
  const playerSymbol = aiPlayer === Player.Black ? 'X' : 'O';
  const opponentSymbol = aiPlayer === Player.Black ? 'O' : 'X';
  const boardStr = getBoardString(board);

  const prompt = `
    You are an expert Gomoku (Five-in-a-Row) player.
    The board size is ${BOARD_SIZE}x${BOARD_SIZE}.
    
    Current Board State:
    ${boardStr}
    
    You are playing as '${playerSymbol}'. The opponent is '${opponentSymbol}'.
    The goal is to get 5 of your stones ('${playerSymbol}') in a row horizontally, vertically, or diagonally.
    You must also block the opponent ('${opponentSymbol}') if they are about to win.
    
    Analyze the board carefully.
    Return ONLY a JSON object with the coordinates of your next move.
    The coordinates must be within 0 to ${BOARD_SIZE - 1}.
    If the board is empty, start near the center (7, 7).
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            row: { type: Type.INTEGER },
            col: { type: Type.INTEGER }
          },
          required: ["row", "col"]
        },
        thinkingConfig: thinkingBudget > 0 ? { thinkingBudget } : undefined
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from Gemini");

    const move = JSON.parse(jsonText) as Move;

    // Validate move
    if (move.row < 0 || move.row >= BOARD_SIZE || move.col < 0 || move.col >= BOARD_SIZE) {
        throw new Error("Invalid coordinates returned by AI");
    }
    
    // Check if cell is occupied
    if (board[move.row][move.col] !== Player.None) {
        // Fallback: Find first empty spot if AI hallucinates an occupied spot (rare but possible)
        console.warn("AI chose occupied spot, finding fallback.");
        for(let r=0; r<BOARD_SIZE; r++){
            for(let c=0; c<BOARD_SIZE; c++){
                if(board[r][c] === Player.None) return { row: r, col: c};
            }
        }
    }

    return move;

  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw error;
  }
};
