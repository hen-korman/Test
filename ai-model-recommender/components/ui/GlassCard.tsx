'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'purple' | 'cyan' | 'none';
  delay?: number;
  animate?: boolean;
}

export default function GlassCard({
  children,
  className = '',
  hover = true,
  glow = 'none',
  delay = 0,
  animate = true,
}: GlassCardProps) {
  const glowStyles = {
    purple: { boxShadow: '0 0 0 1px rgba(139,92,246,0.35), 0 0 30px rgba(139,92,246,0.12), inset 0 0 30px rgba(139,92,246,0.02)' },
    cyan: { boxShadow: '0 0 0 1px rgba(34,211,238,0.35), 0 0 30px rgba(34,211,238,0.12), inset 0 0 30px rgba(34,211,238,0.02)' },
    none: {},
  };

  const baseStyle = {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    ...glowStyles[glow],
  };

  const hoverStyle = hover
    ? { y: -4, scale: 1.01, boxShadow: '0 0 0 1px rgba(139,92,246,0.5), 0 20px 60px rgba(139,92,246,0.15)' }
    : {};

  if (!animate) {
    return (
      <div className={`rounded-2xl ${className}`} style={baseStyle}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={`rounded-2xl ${className}`}
      style={baseStyle}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.34, 1.56, 0.64, 1] }}
      whileHover={hoverStyle}
    >
      {children}
    </motion.div>
  );
}
