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

  const cellSize = 70;
  const gap = 6;
  const padding = 24;
  const boardSize = 9 * (cellSize + gap) + padding * 2;

  // Get positions on the same cell
  const sameCell = team1Position === team2Position;

  return (
    <div className="relative mx-auto" style={{ width: boardSize, height: boardSize + 100 }}>
      {/* Board container with enhanced 3D effect */}
      <div
        className="absolute inset-0 rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, hsl(var(--board-bg)), hsl(var(--muted)))',
          boxShadow: '0 30px 80px -20px rgba(0,0,0,0.4), 0 10px 30px -5px rgba(0,0,0,0.2), inset 0 2px 8px rgba(255,255,255,0.15)',
          transform: 'perspective(1000px) rotateX(5deg)',
          border: '2px solid hsl(var(--border))',
        }}
      >
        {/* Decorative gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: 'radial-gradient(circle at 30% 30%, hsl(var(--primary)/0.1), transparent 50%)',
            borderRadius: '1.5rem',
          }}
        />
        {/* Inner shadow overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 6px 40px rgba(0,0,0,0.2), inset 0 2px 10px rgba(0,0,0,0.1)',
            borderRadius: '1.5rem',
          }}
        />
      </div>

      {/* Grid cells */}
      <div
        className="absolute inset-0"
        style={{ 
          transform: 'perspective(1000px) rotateX(5deg)',
          padding: `${padding}px`,
        }}
      >
        {path.map((cell, index) => {
          const isTeam1Here = team1Position === index;
          const isTeam2Here = team2Position === index;
          const isStart = index === 0;
          const isEnd = index === 80;
          const isAhead1 = index > team1Position && index <= team1Position + 5;
          const isAhead2 = index > team2Position && index <= team2Position + 5;
          const isBehind = index < Math.min(team1Position, team2Position);
          const layer = Math.min(cell.x, cell.y, 8 - cell.x, 8 - cell.y);
          const brightness = 1 - layer * 0.05;

          return (
            <motion.div
              key={index}
              className={`
                absolute flex items-center justify-center font-display font-bold
                rounded-xl transition-all duration-300 cursor-default
                ${isStart ? 'bg-success/40 ring-3 ring-success/60 shadow-lg shadow-success/30' : ''}
                ${isEnd ? 'bg-primary/50 ring-3 ring-primary/70 shadow-xl shadow-primary/40' : ''}
                ${cell.isSpecial && !isStart && !isEnd ? 'bg-accent/30 ring-2 ring-accent/60 shadow-md shadow-accent/20' : ''}
                ${!isStart && !isEnd && !cell.isSpecial ? 'bg-board-cell border-2 border-board-cell-border' : ''}
                ${isBehind ? 'opacity-35' : ''}
              `}
              style={{
                left: cell.x * (cellSize + gap) + padding,
                top: cell.y * (cellSize + gap) + padding,
                width: cellSize,
                height: cellSize,
                filter: `brightness(${brightness})`,
                fontSize: cell.isSpecial || isStart || isEnd ? '1.25rem' : '1rem',
                boxShadow: isEnd
                  ? '0 0 30px 8px rgba(var(--primary), 0.4), inset 0 2px 8px rgba(255,255,255,0.3), 0 4px 12px rgba(0,0,0,0.2)'
                  : cell.isSpecial
                    ? '0 0 15px 4px rgba(var(--accent), 0.3), inset 0 2px 6px rgba(255,255,255,0.3), 0 3px 8px rgba(0,0,0,0.15)'
                    : isStart
                      ? 'inset 0 2px 6px rgba(255,255,255,0.4), 0 3px 10px rgba(0,0,0,0.15), 0 0 15px 3px rgba(var(--success), 0.2)'
                      : 'inset 0 2px 6px rgba(255,255,255,0.4), 0 3px 10px rgba(0,0,0,0.15)',
              }}
              animate={isEnd ? { scale: [1, 1.05, 1] } : {}}
              transition={isEnd ? { repeat: Infinity, duration: 2 } : {}}
              whileHover={!isBehind ? { scale: 1.05, zIndex: 10 } : {}}
            >
              {isStart && (
                <Flag className="w-7 h-7 text-success drop-shadow-lg" />
              )}
              {isEnd && (
                <Star className="w-8 h-8 text-primary fill-primary drop-shadow-lg" />
              )}
              {cell.isSpecial && !isStart && !isEnd && (
                <Sparkles className="w-6 h-6 text-accent drop-shadow-md" />
              )}
              {!isStart && !isEnd && !cell.isSpecial && (
                <span className="text-muted-foreground/80 text-base font-bold">{cell.digit}</span>
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
          className="absolute z-30"
          initial={false}
          animate={{
            left: path[team1Position].x * (cellSize + gap) + padding + (sameCell ? 4 : cellSize / 2 - 20),
            top: path[team1Position].y * (cellSize + gap) + padding - 12 + (sameCell ? 0 : 0),
          }}
          transition={{ type: 'spring', stiffness: 60, damping: 20 }}
        >
          <div className="relative">
            {/* Enhanced pawn shadow */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-3 bg-black/25 rounded-full blur-md"
            />
            {/* Pawn body - larger */}
            <div
              className="pawn-blue w-10 h-14 rounded-t-full rounded-b-xl relative shadow-xl"
              title={team1Name}
              style={{
                boxShadow: '0 6px 0 hsl(var(--team-blue-dark)), 0 8px 16px rgba(0,0,0,0.4), inset 0 2px 6px rgba(255,255,255,0.5)',
              }}
            >
              {/* Pawn head - larger */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-gradient-to-b from-team-blue-light to-team-blue rounded-full border-[3px] border-team-blue-dark/40 shadow-lg" />
              {/* Enhanced shine effect */}
              <div className="absolute top-3 left-2 w-2 h-4 bg-white/40 rounded-full blur-sm" />
              {/* Additional highlight */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-2 bg-white/30 rounded-full" />
            </div>
          </div>
        </motion.div>

        {/* Team 2 Pawn (Red) */}
        <motion.div
          className="absolute z-30"
          initial={false}
          animate={{
            left: path[team2Position].x * (cellSize + gap) + padding + (sameCell ? cellSize - 44 : cellSize / 2 - 20),
            top: path[team2Position].y * (cellSize + gap) + padding - 12,
          }}
          transition={{ type: 'spring', stiffness: 60, damping: 20 }}
        >
          <div className="relative">
            {/* Enhanced pawn shadow */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-3 bg-black/25 rounded-full blur-md"
            />
            {/* Pawn body - larger */}
            <div
              className="pawn-red w-10 h-14 rounded-t-full rounded-b-xl relative shadow-xl"
              title={team2Name}
              style={{
                boxShadow: '0 6px 0 hsl(var(--team-red-dark)), 0 8px 16px rgba(0,0,0,0.4), inset 0 2px 6px rgba(255,255,255,0.5)',
              }}
            >
              {/* Pawn head - larger */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-gradient-to-b from-team-red-light to-team-red rounded-full border-[3px] border-team-red-dark/40 shadow-lg" />
              {/* Enhanced shine effect */}
              <div className="absolute top-3 left-2 w-2 h-4 bg-white/40 rounded-full blur-sm" />
              {/* Additional highlight */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-2 bg-white/30 rounded-full" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Legend */}
      <div className="absolute -bottom-4 left-0 right-0 flex flex-wrap justify-center gap-5 text-sm font-body">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-card/80 backdrop-blur-sm rounded-lg shadow-md border border-border/50">
          <div className="w-5 h-6 pawn-blue rounded-t-full rounded-b-sm shadow-sm" />
          <span className="text-team-blue font-bold">{team1Name}</span>
          <span className="text-muted-foreground font-semibold">({team1Position})</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-card/80 backdrop-blur-sm rounded-lg shadow-md border border-border/50">
          <div className="w-5 h-6 pawn-red rounded-t-full rounded-b-sm shadow-sm" />
          <span className="text-team-red font-bold">{team2Name}</span>
          <span className="text-muted-foreground font-semibold">({team2Position})</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-card/80 backdrop-blur-sm rounded-lg shadow-md border border-border/50">
          <Flag className="w-5 h-5 text-success" />
          <span className="text-muted-foreground font-medium">התחלה</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-card/80 backdrop-blur-sm rounded-lg shadow-md border border-border/50">
          <Star className="w-5 h-5 text-primary fill-primary" />
          <span className="text-muted-foreground font-medium">סיום</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-card/80 backdrop-blur-sm rounded-lg shadow-md border border-border/50">
          <Sparkles className="w-5 h-5 text-accent" />
          <span className="text-muted-foreground font-medium">תור מיוחד</span>
        </div>
      </div>
    </div>
  );
};

export default SpiralBoard;