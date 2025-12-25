import React, { useMemo } from 'react';
import { generateSpiralPath } from '@/lib/gameLogic';
import { motion } from 'framer-motion';
import { Flag, Star, Sparkles } from 'lucide-react';

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
  
  const cellSize = 42;
  const gap = 3;
  const boardSize = 9 * (cellSize + gap) + 20;
  
  // Get positions on the same cell
  const sameCell = team1Position === team2Position;

  return (
    <div className="relative mx-auto" style={{ width: boardSize, height: boardSize + 80 }}>
      {/* Board container with 3D effect */}
      <div 
        className="absolute inset-0 rounded-3xl overflow-hidden"
        style={{ 
          background: 'linear-gradient(145deg, hsl(var(--board-bg)), hsl(var(--muted)))',
          boxShadow: '0 20px 60px -15px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.1)',
          transform: 'perspective(1000px) rotateX(5deg)',
        }}
      >
        {/* Inner shadow overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 4px 30px rgba(0,0,0,0.15)',
            borderRadius: '1.5rem',
          }}
        />
      </div>
      
      {/* Grid cells */}
      <div 
        className="absolute inset-0 p-[10px]"
        style={{ transform: 'perspective(1000px) rotateX(5deg)' }}
      >
        {path.map((cell, index) => {
          const isTeam1Here = team1Position === index;
          const isTeam2Here = team2Position === index;
          const isStart = index === 0;
          const isEnd = index === 80;
          const isAhead1 = index > team1Position && index <= team1Position + 5;
          const isAhead2 = index > team2Position && index <= team2Position + 5;
          const isBehind = index < Math.min(team1Position, team2Position);
          
          return (
            <motion.div
              key={index}
              className={`
                absolute flex items-center justify-center font-display text-sm font-bold
                rounded-lg transition-all duration-300 cursor-default
                ${isStart ? 'bg-success/30 ring-2 ring-success' : ''}
                ${isEnd ? 'bg-primary/40 ring-2 ring-primary' : ''}
                ${cell.isSpecial && !isStart && !isEnd ? 'bg-accent/20 ring-1 ring-accent/50' : ''}
                ${!isStart && !isEnd && !cell.isSpecial ? 'bg-board-cell border border-board-cell-border' : ''}
                ${isBehind ? 'opacity-40' : ''}
              `}
              style={{
                left: cell.x * (cellSize + gap) + 10,
                top: cell.y * (cellSize + gap) + 10,
                width: cellSize,
                height: cellSize,
                boxShadow: isEnd 
                  ? '0 0 20px 5px rgba(var(--primary), 0.3)' 
                  : cell.isSpecial 
                    ? '0 0 10px 2px rgba(var(--accent), 0.2)'
                    : 'inset 0 1px 3px rgba(255,255,255,0.3), 0 2px 6px rgba(0,0,0,0.1)',
              }}
              animate={isEnd ? { scale: [1, 1.02, 1] } : {}}
              transition={isEnd ? { repeat: Infinity, duration: 2 } : {}}
            >
              {isStart && (
                <Flag className="w-5 h-5 text-success" />
              )}
              {isEnd && (
                <Star className="w-6 h-6 text-primary fill-primary" />
              )}
              {cell.isSpecial && !isStart && !isEnd && (
                <Sparkles className="w-4 h-4 text-accent" />
              )}
              {!isStart && !isEnd && !cell.isSpecial && (
                <span className="text-muted-foreground/70 text-xs">{cell.digit}</span>
              )}
              
              {/* Path indicator for upcoming cells */}
              {(isAhead1 || isAhead2) && !isEnd && (
                <div 
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  style={{
                    background: isAhead1 && isAhead2 
                      ? 'linear-gradient(135deg, rgba(var(--team-blue), 0.15), rgba(var(--team-red), 0.15))'
                      : isAhead1 
                        ? 'rgba(var(--team-blue), 0.1)'
                        : 'rgba(var(--team-red), 0.1)',
                  }}
                />
              )}
            </motion.div>
          );
        })}
        
        {/* Team 1 Pawn (Blue) */}
        <motion.div
          className="absolute z-20"
          initial={false}
          animate={{
            left: path[team1Position].x * (cellSize + gap) + 10 + (sameCell ? 2 : cellSize / 2 - 14),
            top: path[team1Position].y * (cellSize + gap) + 10 - 8 + (sameCell ? 0 : 0),
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="relative">
            {/* Pawn shadow */}
            <div 
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-2 bg-black/20 rounded-full blur-sm"
            />
            {/* Pawn body */}
            <div 
              className="pawn-blue w-7 h-9 rounded-t-full rounded-b-lg relative"
              title={team1Name}
            >
              {/* Pawn head */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gradient-to-b from-team-blue-light to-team-blue rounded-full border-2 border-team-blue-dark/30" />
              {/* Shine effect */}
              <div className="absolute top-2 left-1 w-1.5 h-3 bg-white/30 rounded-full" />
            </div>
          </div>
        </motion.div>
        
        {/* Team 2 Pawn (Red) */}
        <motion.div
          className="absolute z-20"
          initial={false}
          animate={{
            left: path[team2Position].x * (cellSize + gap) + 10 + (sameCell ? cellSize - 30 : cellSize / 2 - 14),
            top: path[team2Position].y * (cellSize + gap) + 10 - 8,
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="relative">
            {/* Pawn shadow */}
            <div 
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-2 bg-black/20 rounded-full blur-sm"
            />
            {/* Pawn body */}
            <div 
              className="pawn-red w-7 h-9 rounded-t-full rounded-b-lg relative"
              title={team2Name}
            >
              {/* Pawn head */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gradient-to-b from-team-red-light to-team-red rounded-full border-2 border-team-red-dark/30" />
              {/* Shine effect */}
              <div className="absolute top-2 left-1 w-1.5 h-3 bg-white/30 rounded-full" />
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Legend */}
      <div className="absolute -bottom-2 left-0 right-0 flex flex-wrap justify-center gap-4 text-xs font-body">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-5 pawn-blue rounded-t-full rounded-b-sm" />
          <span className="text-team-blue font-semibold">{team1Name}</span>
          <span className="text-muted-foreground">({team1Position})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-5 pawn-red rounded-t-full rounded-b-sm" />
          <span className="text-team-red font-semibold">{team2Name}</span>
          <span className="text-muted-foreground">({team2Position})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Flag className="w-4 h-4 text-success" />
          <span className="text-muted-foreground">התחלה</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Star className="w-4 h-4 text-primary fill-primary" />
          <span className="text-muted-foreground">סיום</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-muted-foreground">תור מיוחד</span>
        </div>
      </div>
    </div>
  );
};

export default SpiralBoard;