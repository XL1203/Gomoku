import React from 'react';
import { Player, Move } from '../types';
import Stone from './Stone';

interface BoardProps {
  board: Player[][];
  onCellClick: (row: number, col: number) => void;
  lastMove: Move | null;
  disabled: boolean;
  winningLine: Move[] | null;
  currentPlayer: Player; // Added to know which color ghost stone to show
}

const Board: React.FC<BoardProps> = ({ board, onCellClick, lastMove, disabled, currentPlayer }) => {
  return (
    <div className="relative w-full h-full bg-[#e8d0a9] wood-texture select-none touch-manipulation">
      {/* Grid Grid */}
      <div 
        className="grid w-full h-full"
        style={{ 
          gridTemplateColumns: `repeat(${board.length}, 1fr)`,
          gridTemplateRows: `repeat(${board.length}, 1fr)`,
        }}
      >
        {board.map((row, rowIndex) => (
          row.map((cell, colIndex) => {
            const isLast = lastMove?.row === rowIndex && lastMove?.col === colIndex;

            // Strict black lines for clarity
            const lineClass = "bg-black"; 

            return (
              <div 
                key={`${rowIndex}-${colIndex}`}
                className="relative flex items-center justify-center cursor-pointer group"
                onClick={() => !disabled && onCellClick(rowIndex, colIndex)}
              >
                {/* Horizontal Line */}
                <div className={`absolute w-full h-[1px] ${lineClass} ${colIndex === 0 ? 'left-[50%] w-[50%]' : ''} ${colIndex === board.length - 1 ? 'w-[50%] right-[50%] left-auto' : ''}`} />
                
                {/* Vertical Line */}
                <div className={`absolute h-full w-[1px] ${lineClass} ${rowIndex === 0 ? 'top-[50%] h-[50%]' : ''} ${rowIndex === board.length - 1 ? 'h-[50%] bottom-[50%] top-auto' : ''}`} />
                
                {/* Center dot for star points (hoshi) - made bigger and clearer */}
                {((rowIndex === 3 || rowIndex === 11 || rowIndex === 7) && (colIndex === 3 || colIndex === 11 || colIndex === 7)) && (
                   <div className="absolute w-2 h-2 bg-black rounded-full z-0" />
                )}

                {/* Hover Target System: Crosshair + Ghost Stone */}
                {cell === Player.None && !disabled && (
                  <div className="hidden group-hover:flex absolute inset-0 items-center justify-center z-20 pointer-events-none">
                      {/* Red Crosshair Target */}
                      <div className="absolute w-full h-[1px] bg-red-500 opacity-60"></div>
                      <div className="absolute h-full w-[1px] bg-red-500 opacity-60"></div>
                      
                      {/* Ghost Stone */}
                      <div className={`w-[70%] h-[70%] rounded-full opacity-50 ${currentPlayer === Player.Black ? 'bg-black' : 'bg-white shadow-sm'}`} />
                  </div>
                )}

                {/* The Real Stone */}
                <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none">
                    <Stone player={cell} isLastMove={isLast} />
                </div>
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
};

export default Board;