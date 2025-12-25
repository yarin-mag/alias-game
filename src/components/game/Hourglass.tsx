import React from 'react';
import { motion } from 'framer-motion';

interface HourglassProps {
  progress: number; // 0 to 1 (1 = full, 0 = empty)
  isRunning: boolean;
}

const Hourglass: React.FC<HourglassProps> = ({ progress, isRunning }) => {
  const topSandHeight = Math.max(0, progress * 50);
  const bottomSandHeight = Math.max(0, (1 - progress) * 50);

  return (
    <div className="relative w-24 h-40 flex flex-col items-center justify-center">
      {/* Frame - Top */}
      <div 
        className="absolute top-0 left-0 right-0 h-4 rounded-full z-10"
        style={{
          background: 'linear-gradient(180deg, hsl(38 60% 45%), hsl(38 50% 30%))',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.3)',
        }}
      />
      
      {/* Frame - Bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-4 rounded-full z-10"
        style={{
          background: 'linear-gradient(180deg, hsl(38 50% 35%), hsl(38 60% 45%))',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.2), inset 0 -2px 4px rgba(255,255,255,0.2)',
        }}
      />
      
      {/* Glass container */}
      <div className="relative w-20 h-36 mt-2 mb-2">
        {/* Top bulb */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 overflow-hidden"
          style={{
            clipPath: 'polygon(10% 0%, 90% 0%, 55% 100%, 45% 100%)',
          }}
        >
          {/* Glass effect */}
          <div 
            className="absolute inset-0 rounded-t-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, rgba(0,0,0,0.1) 100%)',
              border: '2px solid rgba(255,255,255,0.3)',
            }}
          />
          
          {/* Sand in top */}
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2"
            style={{
              width: `${40 + progress * 40}%`,
              background: 'linear-gradient(180deg, hsl(var(--sand-top)), hsl(var(--sand-bottom)))',
              clipPath: 'polygon(5% 0%, 95% 0%, 75% 100%, 25% 100%)',
              borderRadius: '4px 4px 0 0',
            }}
            animate={{ height: topSandHeight }}
            transition={{ duration: 0.3 }}
          />
        </div>
        
        {/* Neck */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-6 z-20"
          style={{
            background: 'linear-gradient(90deg, rgba(255,255,255,0.2), rgba(0,0,0,0.1))',
          }}
        >
          {/* Falling sand stream */}
          {isRunning && progress > 0.02 && (
            <div 
              className="absolute left-1/2 -translate-x-1/2 w-1 bg-gradient-to-b from-sand-top to-sand-bottom"
              style={{ 
                height: '100%',
                animation: 'sandStream 0.3s linear infinite',
              }}
            />
          )}
          
          {/* Falling sand particles */}
          {isRunning && progress > 0.02 && (
            <>
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                  style={{ background: 'hsl(var(--sand-bottom))' }}
                  initial={{ y: -4, opacity: 1, scale: 1 }}
                  animate={{ y: 50, opacity: 0, scale: 0.5 }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: 'linear',
                  }}
                />
              ))}
            </>
          )}
        </div>
        
        {/* Bottom bulb */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-16 overflow-hidden"
          style={{
            clipPath: 'polygon(45% 0%, 55% 0%, 90% 100%, 10% 100%)',
          }}
        >
          {/* Glass effect */}
          <div 
            className="absolute inset-0 rounded-b-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 50%, rgba(0,0,0,0.15) 100%)',
              border: '2px solid rgba(255,255,255,0.25)',
            }}
          />
          
          {/* Sand pile in bottom */}
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2"
            style={{
              width: `${50 + (1 - progress) * 40}%`,
              background: 'linear-gradient(0deg, hsl(var(--sand-bottom)), hsl(var(--sand-top)))',
              borderRadius: '0 0 50% 50%',
            }}
            animate={{ height: bottomSandHeight }}
            transition={{ duration: 0.3 }}
          >
            {/* Sand pile peak */}
            {isRunning && bottomSandHeight > 10 && (
              <div 
                className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0"
                style={{
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderBottom: '8px solid hsl(var(--sand-top))',
                }}
              />
            )}
          </motion.div>
        </div>
        
        {/* Glass shine effect */}
        <div 
          className="absolute top-4 left-3 w-1 h-8 bg-white/40 rounded-full blur-[1px]"
          style={{ transform: 'rotate(-15deg)' }}
        />
        <div 
          className="absolute bottom-4 left-3 w-1 h-8 bg-white/30 rounded-full blur-[1px]"
          style={{ transform: 'rotate(15deg)' }}
        />
      </div>
      
      {/* Glow effect when running */}
      {isRunning && (
        <motion.div 
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(var(--sand-bottom), 0.15) 0%, transparent 70%)',
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </div>
  );
};

export default Hourglass;