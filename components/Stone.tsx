import React from 'react';
import { Player } from '../types';

interface StoneProps {
  player: Player;
  isLastMove: boolean;
}

const Stone: React.FC<StoneProps> = ({ player, isLastMove }) => {
  if (player === Player.None) return null;

  const baseClasses = "w-[80%] h-[80%] rounded-full shadow-md transform transition-all duration-300 ease-out scale-100";
  // Black stone: radial gradient for 3D effect
  const blackStyle = "bg-gray-900 shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.1),2px_2px_4px_rgba(0,0,0,0.5)]";
  // White stone: radial gradient
  const whiteStyle = "bg-gray-100 shadow-[inset_2px_2px_4px_rgba(255,255,255,1),inset_-2px_-2px_4px_rgba(0,0,0,0.2),2px_2px_4px_rgba(0,0,0,0.4)]";

  return (
    <div className={`${baseClasses} ${player === Player.Black ? blackStyle : whiteStyle} flex items-center justify-center`}>
      {isLastMove && (
        <div className={`w-[30%] h-[30%] rounded-full opacity-80 ${player === Player.Black ? 'bg-white/30' : 'bg-black/30'} animate-pulse`} />
      )}
    </div>
  );
};

export default Stone;