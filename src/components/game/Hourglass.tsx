import React from 'react';
import { motion } from 'framer-motion';

interface HourglassProps {
  progress: number; // 0 to 1 (1 = full, 0 = empty)
  isRunning: boolean;
}

const Hourglass: React.FC<HourglassProps> = ({ progress, isRunning }) => {
  // SVG ViewBox is 0 0 100 180
  // Center x is 50.

  // Progress calculations
  // Top Sand: Starts full (height depends on progress)
  const topSandHeight = progress * 85;

  return (
    <div className="relative w-32 h-52 flex flex-col items-center justify-center select-none" style={{ perspective: '500px' }}>

      {/* --- FRAME TOP --- */}
      <div
        className="absolute top-0 w-28 h-4 rounded-lg z-20 shadow-xl"
        style={{
          background: 'linear-gradient(90deg, #5D4037, #8D6E63, #5D4037)',
          boxShadow: '0 4px 6px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.3)'
        }}
      />

      {/* --- SVG HOURGLASS --- */}
      <svg
        viewBox="0 0 100 180"
        className="relative w-24 h-44 z-10 overflow-visible"
      >
        <defs>
          {/* Glass Gradient */}
          <linearGradient id="glassGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </linearGradient>

          {/* Sand Gradient */}
          <linearGradient id="sandGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F4D03F" />
            <stop offset="100%" stopColor="#E1C340" />
          </linearGradient>

          {/* Noise Filter for Texture */}
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.4" />
            </feComponentTransfer>
          </filter>

          {/* Bulb Shapes */}
          <path id="topBulbPath" d="M 10 2 Q 5 2 5 15 Q 12 70 48 88 Q 50 90 52 88 Q 88 70 95 15 Q 95 2 90 2 Z" />
          <path id="bottomBulbPath" d="M 48 92 Q 50 90 52 92 Q 88 110 95 165 Q 95 178 90 178 H 10 Q 5 178 5 165 Q 12 110 48 92 Z" />

          {/* Clip Paths */}
          <clipPath id="topBulbClip">
            <use href="#topBulbPath" />
          </clipPath>
          <clipPath id="bottomBulbClip">
            <use href="#bottomBulbPath" />
          </clipPath>
        </defs>

        {/* --- TOP BULB --- */}
        <g clipPath="url(#topBulbClip)">
          {/* Background */}
          <rect width="100" height="90" fill="url(#glassGradient)" />

          {/* Sand */}
          <motion.rect
            x="0"
            y="0"
            width="100"
            height="90"
            fill="url(#sandGradient)"
            initial={false}
            animate={{ y: 90 - topSandHeight }}
            transition={{ duration: 0.5, ease: "linear" }}
          />
          {/* Sand Texture Overlay */}
          <motion.rect
            x="0"
            y="0"
            width="100"
            height="90"
            filter="url(#noise)"
            initial={false}
            animate={{ y: 90 - topSandHeight }}
            transition={{ duration: 0.5, ease: "linear" }}
            style={{ mixBlendMode: 'multiply' }}
          />

          {/* Inner Highlight/Shadow */}
          <use href="#topBulbPath" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <path d="M 15 10 Q 15 60 40 80" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
        </g>

        {/* --- STREAM --- */}
        {isRunning && progress > 0.01 && (
          <g>
            <line x1="50" y1="90" x2="50" y2="180" stroke="#E1C340" strokeWidth="2" />
            {/* Animated Stream Texture */}
            <motion.line
              x1="50" y1="90" x2="50" y2="180"
              stroke="white"
              strokeWidth="1"
              strokeDasharray="4 4"
              animate={{ strokeDashoffset: [0, -8] }}
              transition={{ repeat: Infinity, duration: 0.2, ease: "linear" }}
              opacity="0.4"
            />
          </g>
        )}

        {/* --- BOTTOM BULB --- */}
        <g clipPath="url(#bottomBulbClip)">
          {/* Background */}
          <rect y="90" width="100" height="90" fill="url(#glassGradient)" />

          {/* Sand Pile - Growing Triangle */}
          <motion.path
            fill="url(#sandGradient)"
            style={{ transformOrigin: '50% 180px' }}
            animate={{ scale: (1 - progress) }}
            d="M 0 178 H 100 L 50 120 Z" // Wide base triangle
            transition={{ duration: 0.5, ease: "linear" }}
          />

          {/* Sand Texture Overlay */}
          <motion.path
            fill="black"
            filter="url(#noise)"
            style={{ transformOrigin: '50% 180px', mixBlendMode: 'multiply', opacity: 0.3 }}
            animate={{ scale: (1 - progress) }}
            d="M 0 178 H 100 L 50 120 Z"
            transition={{ duration: 0.5, ease: "linear" }}
          />

          {/* Inner Highlight */}
          <use href="#bottomBulbPath" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <path d="M 15 170 Q 15 120 40 100" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
        </g>

        {/* --- CONNECTOR RING --- */}
        <rect x="46" y="88" width="8" height="4" rx="1" fill="#8D6E63" />

      </svg>

      {/* --- FRAME BOTTOM --- */}
      <div
        className="absolute bottom-0 w-28 h-4 rounded-lg z-20 shadow-xl"
        style={{
          background: 'linear-gradient(90deg, #5D4037, #8D6E63, #5D4037)',
          boxShadow: '0 -4px 6px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.3)'
        }}
      />

      {/* FRAME RODS */}
      <div className="absolute top-2 bottom-2 left-1 w-1.5 bg-gradient-to-r from-amber-800 to-amber-600 rounded-full shadow-inner" />
      <div className="absolute top-2 bottom-2 right-1 w-1.5 bg-gradient-to-r from-amber-800 to-amber-600 rounded-full shadow-inner" />

      {/* Rod highlights */}
      <div className="absolute top-4 left-1.5 w-0.5 h-44 bg-white/20 blur-[0.5px]" />
      <div className="absolute top-4 right-1.5 w-0.5 h-44 bg-white/20 blur-[0.5px]" />
    </div>
  );
};

export default Hourglass;
