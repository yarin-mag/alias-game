import React from 'react';
import { motion } from 'framer-motion';

interface TimerProps {
  seconds: number;
  total: number;
  isRunning: boolean;
  isPaused: boolean;
}

const Timer: React.FC<TimerProps> = ({ seconds, total, isRunning, isPaused }) => {
  const isLow = seconds <= 10 && seconds > 0;
  
  const formatTime = (s: number): string => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      className={`
        timer-display px-6 py-4 text-4xl font-display tracking-wider
        ${isLow && isRunning ? 'animate-timer-pulse text-destructive' : ''}
        ${isPaused ? 'opacity-50' : ''}
      `}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      {formatTime(seconds)}
    </motion.div>
  );
};

export default Timer;
