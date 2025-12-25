import React, { useMemo } from 'react';
import { generateSpiralPath } from '@/lib/gameLogic';
import { motion } from 'framer-motion';

interface SpiralBoardProps {
  team1Position: number;
  team2Position: number;
  team1Name: string;
  team2Name: string;
}

const SpiralBoard: React.FC<SpiralBoardProps> = ({
  team1Position,
  team2Position,
  team1Name,
  team2Name,
}) => {
  const path = useMemo(() => generateSpiralPath(), []);
  
  const cellSize = 38;
  const gap = 4;
  const boardSize = 9 * (cellSize + gap);
  
  // Get positions on the same cell
  const sameCell = team1Position === team2Position;

  return (
    <div className="relative mx-auto" style={{ width: boardSize, height: boardSize }}>
      {/* Board background with gradient */}
      <div 
        className="absolute inset-0 rounded-3xl bg-gradient-to-br from-board-bg to-muted shadow-game"
        style={{ transform: 'perspective(800px) rotateX(10deg)' }}
      />
      
      {/* Grid cells */}
      <div 
        className="absolute inset-0 p-2"
        style={{ transform: 'perspective(800px) rotateX(10deg)' }}
      >
        {path.map((cell, index) => {
          const isTeam1Here = team1Position === index;
          const isTeam2Here = team2Position === index;
          const isStart = index === 0;
          const isEnd = index === 80;
          
          return (
            <div
              key={index}
              className={`
                absolute board-cell flex items-center justify-center font-display text-sm font-bold
                ${isStart ? 'ring-2 ring-success' : ''}
                ${isEnd ? 'ring-2 ring-primary animate-pulse-glow' : ''}
                transition-all duration-300
              `}
              style={{
                left: cell.x * (cellSize + gap) + gap,
                top: cell.y * (cellSize + gap) + gap,
                width: cellSize,
                height: cellSize,
              }}
            >
              <span className="text-muted-foreground/60">{cell.digit}</span>
            </div>
          );
        })}
        
        {/* Team 1 Pawn (Blue) */}
        <motion.div
          className="absolute z-20"
          initial={false}
          animate={{
            left: path[team1Position].x * (cellSize + gap) + gap + (sameCell ? -4 : 0),
            top: path[team1Position].y * (cellSize + gap) + gap - 6,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div 
            className={`
              pawn-blue w-8 h-10 rounded-t-full rounded-b-lg 
              flex items-center justify-center text-secondary-foreground text-xs font-bold
              ${sameCell ? '' : ''}
            `}
            title={team1Name}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-secondary-foreground/30 rounded-full" />
          </div>
        </motion.div>
        
        {/* Team 2 Pawn (Red) */}
        <motion.div
          className="absolute z-20"
          initial={false}
          animate={{
            left: path[team2Position].x * (cellSize + gap) + gap + (sameCell ? 4 : 0),
            top: path[team2Position].y * (cellSize + gap) + gap - 6,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div 
            className={`
              pawn-red w-8 h-10 rounded-t-full rounded-b-lg 
              flex items-center justify-center text-destructive-foreground text-xs font-bold
            `}
            title={team2Name}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-destructive-foreground/30 rounded-full" />
          </div>
        </motion.div>
      </div>
      
      {/* Legend */}
      <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-8 text-sm font-body">
        <div className="flex items-center gap-2">
          <div className="w-4 h-5 pawn-blue rounded-t-full rounded-b-sm" />
          <span className="text-team-blue font-semibold">{team1Name}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-5 pawn-red rounded-t-full rounded-b-sm" />
          <span className="text-team-red font-semibold">{team2Name}</span>
        </div>
      </div>
    </div>
  );
};

export default SpiralBoard;
