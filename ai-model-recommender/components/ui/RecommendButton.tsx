'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface RecommendButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
}

export default function RecommendButton({ onClick, loading, disabled }: RecommendButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="relative w-full sm:w-auto px-10 py-4 rounded-2xl font-semibold text-lg overflow-hidden cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
        color: '#fff',
      }}
    >
      {/* Animated glow bg */}
      {!loading && !disabled && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            filter: 'blur(20px)',
            opacity: 0.5,
            zIndex: -1,
          }}
          animate={{
            opacity: [0.4, 0.7, 0.4],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
      )}

      {/* Particle overlay on hover */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        {!loading && Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/40"
            style={{
              left: `${10 + i * 12}%`,
              top: '50%',
            }}
            animate={{
              y: [-20, -40, -60],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.25,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <span className="relative flex items-center justify-center gap-2.5">
        {loading ? (
          <>
            <motion.div
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
            <span>Finding best models…</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>Recommend</span>
          </>
        )}
      </span>
    </motion.button>
  );
}
