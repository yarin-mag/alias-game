import React from 'react';
import { motion } from 'framer-motion';

interface HourglassProps {
  progress: number; // 0 to 1 (1 = full, 0 = empty)
  isRunning: boolean;
}

const Hourglass: React.FC<HourglassProps> = ({ progress, isRunning }) => {
  const topSandHeight = Math.max(0, progress * 40);
  const bottomSandHeight = Math.max(0, (1 - progress) * 40);

  return (
    <div className="relative w-20 h-32 flex flex-col items-center justify-center">
      {/* Top glass */}
      <div className="relative w-16 h-14 overflow-hidden">
        {/* Glass shape - top */}
        <div 
          className="absolute inset-0 border-4 border-primary/60 rounded-t-2xl"
          style={{
            clipPath: 'polygon(10% 0%, 90% 0%, 60% 100%, 40% 100%)',
          }}
        />
        {/* Sand in top */}
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-gradient-to-b from-sand-top to-sand-bottom rounded-t-lg"
          style={{
            width: `${30 + progress * 30}%`,
            clipPath: 'polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%)',
          }}
          animate={{ height: topSandHeight }}
          transition={{ duration: 0.5 }}
        />
      </div>
      
      {/* Neck */}
      <div className="relative w-3 h-4 bg-primary/40 z-10">
        {/* Falling sand particles */}
        {isRunning && progress > 0.02 && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sand-bottom"
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: 40, opacity: 0 }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'linear',
                }}
              />
            ))}
          </>
        )}
      </div>
      
      {/* Bottom glass */}
      <div className="relative w-16 h-14 overflow-hidden">
        {/* Glass shape - bottom */}
        <div 
          className="absolute inset-0 border-4 border-primary/60 rounded-b-2xl"
          style={{
            clipPath: 'polygon(40% 0%, 60% 0%, 90% 100%, 10% 100%)',
          }}
        />
        {/* Sand in bottom */}
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-gradient-to-t from-sand-bottom to-sand-top"
          style={{
            width: `${30 + (1 - progress) * 40}%`,
            borderRadius: '0 0 8px 8px',
          }}
          animate={{ height: bottomSandHeight }}
          transition={{ duration: 0.5 }}
        />
      </div>
      
      {/* Frame */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-2 bg-primary/80 rounded-full" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-2 bg-primary/80 rounded-full" />
    </div>
  );
};

export default Hourglass;
