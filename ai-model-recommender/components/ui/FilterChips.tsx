'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { FilterState } from '@/lib/types';

interface FilterOption {
  label: string;
  value: string;
  icon?: string;
}

interface FilterGroupProps {
  title: string;
  options: FilterOption[];
  selected: string;
  onChange: (value: string) => void;
  color?: 'purple' | 'cyan' | 'magenta';
}

function FilterGroup({ title, options, selected, onChange, color = 'purple' }: FilterGroupProps) {
  const colors = {
    purple: {
      active: 'rgba(139,92,246,0.25)',
      border: 'rgba(139,92,246,0.6)',
      text: '#c4b5fd',
      shadow: '0 0 12px rgba(139,92,246,0.4)',
    },
    cyan: {
      active: 'rgba(34,211,238,0.15)',
      border: 'rgba(34,211,238,0.5)',
      text: '#67e8f9',
      shadow: '0 0 12px rgba(34,211,238,0.35)',
    },
    magenta: {
      active: 'rgba(240,171,252,0.15)',
      border: 'rgba(240,171,252,0.5)',
      text: '#f0abfc',
      shadow: '0 0 12px rgba(240,171,252,0.35)',
    },
  };

  const c = colors[color];

  return (
    <div className="space-y-2">
      <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">{title}</span>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const isActive = selected === opt.value;
          return (
            <motion.button
              key={opt.value}
              onClick={() => onChange(isActive ? '' : opt.value)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              style={{
                background: isActive ? c.active : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isActive ? c.border : 'rgba(255,255,255,0.08)'}`,
                color: isActive ? c.text : '#71717a',
                boxShadow: isActive ? c.shadow : 'none',
              }}
            >
              {opt.icon && <span className="mr-1">{opt.icon}</span>}
              {opt.label}
              {isActive && (
                <motion.div
                  layoutId={`chip-glow-${title}`}
                  className="absolute inset-0 rounded-lg"
                  style={{ background: `${c.active}`, mixBlendMode: 'screen' }}
                  initial={false}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

interface FilterChipsProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export default function FilterChips({ filters, onChange }: FilterChipsProps) {
  const update = (key: keyof FilterState) => (value: string) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <motion.div
      className="space-y-4 p-5 rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <FilterGroup
          title="Task Type"
          selected={filters.taskType}
          onChange={update('taskType')}
          color="purple"
          options={[
            { label: 'Text', value: 'text', icon: '📝' },
            { label: 'Code', value: 'code', icon: '⌨️' },
            { label: 'Vision', value: 'vision', icon: '👁️' },
            { label: 'Audio', value: 'audio', icon: '🎵' },
            { label: 'Multimodal', value: 'multimodal', icon: '🌐' },
          ]}
        />
        <FilterGroup
          title="Budget"
          selected={filters.budget}
          onChange={update('budget')}
          color="cyan"
          options={[
            { label: 'Free', value: 'free', icon: '🆓' },
            { label: 'Cheap', value: 'cheap', icon: '💚' },
            { label: 'Mid', value: 'mid', icon: '💛' },
            { label: 'Premium', value: 'premium', icon: '💎' },
          ]}
        />
        <FilterGroup
          title="Context Size"
          selected={filters.contextSize}
          onChange={update('contextSize')}
          color="magenta"
          options={[
            { label: '<32K', value: 'small' },
            { label: '32K–200K', value: 'medium' },
            { label: '200K+', value: 'large' },
          ]}
        />
        <FilterGroup
          title="Privacy"
          selected={filters.privacy}
          onChange={update('privacy')}
          color="purple"
          options={[
            { label: 'Cloud OK', value: 'cloud', icon: '☁️' },
            { label: 'Open Source', value: 'open-source', icon: '🔓' },
            { label: 'Local Only', value: 'local', icon: '🏠' },
          ]}
        />
        <FilterGroup
          title="Priority"
          selected={filters.priority}
          onChange={update('priority')}
          color="cyan"
          options={[
            { label: 'Speed', value: 'speed', icon: '⚡' },
            { label: 'Quality', value: 'quality', icon: '🏆' },
            { label: 'Balance', value: 'balance', icon: '⚖️' },
          ]}
        />
      </div>
    </motion.div>
  );
}
