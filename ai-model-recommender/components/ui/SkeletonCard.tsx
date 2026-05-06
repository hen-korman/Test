'use client';

import { motion } from 'framer-motion';

export default function SkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="rounded-2xl p-6 space-y-4"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded shimmer" />
          <div className="h-3 w-1/3 rounded shimmer" />
        </div>
        <div className="w-16 h-16 rounded-full shimmer" />
      </div>

      {/* Score bar */}
      <div className="h-3 w-full rounded-full shimmer" />

      {/* Capability pills */}
      <div className="flex gap-2">
        {[80, 60, 90].map((w, i) => (
          <div key={i} className={`h-6 w-${w === 80 ? '16' : w === 60 ? '12' : '20'} rounded shimmer`} />
        ))}
      </div>

      {/* Text lines */}
      <div className="space-y-2">
        <div className="h-3 w-full rounded shimmer" />
        <div className="h-3 w-5/6 rounded shimmer" />
        <div className="h-3 w-4/6 rounded shimmer" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-12 rounded-lg shimmer" />
        ))}
      </div>
    </motion.div>
  );
}
