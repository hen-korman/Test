'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface MatchScoreRingProps {
  score: number;
  size?: number;
}

export default function MatchScoreRing({ score, size = 80 }: MatchScoreRingProps) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 90) return '#22d3ee';
    if (s >= 75) return '#8b5cf6';
    if (s >= 60) return '#f0abfc';
    return '#a1a1aa';
  };

  const color = getColor(score);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="4"
        />
        {/* Score ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, delay: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
      {/* Score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-mono text-lg font-bold leading-none"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {score}
        </motion.span>
        <span className="text-[10px] text-zinc-500 font-mono">%</span>
      </div>
    </div>
  );
}
