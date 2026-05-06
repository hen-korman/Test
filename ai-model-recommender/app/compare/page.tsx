'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, X, Zap, DollarSign, Database, Brain, Check } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { formatContextWindow, formatPrice, getProviderColor } from '@/lib/recommender';
import type { AIModel } from '@/lib/types';

const NeuralBackground = dynamic(() => import('@/components/NeuralBackground'), { ssr: false });

interface CompareCardProps {
  model: AIModel;
  onRemove: () => void;
  index: number;
  allModels: AIModel[];
  isWinner: (field: keyof AIModel | string) => boolean;
}

function CompareCard({ model, onRemove, index, isWinner }: CompareCardProps) {
  const color = getProviderColor(model.provider);
  const colors = ['#22d3ee', '#8b5cf6', '#f0abfc'];
  const cardColor = colors[index] || '#a1a1aa';

  return (
    <motion.div
      className="relative rounded-2xl overflow-hidden flex-1 min-w-0"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${cardColor}30`,
        boxShadow: `0 0 30px ${cardColor}08`,
      }}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${cardColor}60, transparent)` }} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold"
              style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}>
              {model.provider[0]}
            </div>
            <div>
              <h3 className="font-semibold text-zinc-200 text-sm leading-tight">{model.name}</h3>
              <span className="text-xs text-zinc-500">{model.provider}</span>
            </div>
          </div>
          <button
            onClick={onRemove}
            className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-600 hover:text-zinc-400 hover:bg-white/5 transition-all"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2">
          {/* Context */}
          <StatRow
            label="Context Window"
            value={formatContextWindow(model.contextWindow)}
            icon={<Database className="w-3 h-3" />}
            highlight={isWinner('contextWindow')}
          />
          {/* Input price */}
          <StatRow
            label="Input Price"
            value={`${formatPrice(model.pricing.input)}/M`}
            icon={<DollarSign className="w-3 h-3" />}
            highlight={isWinner('pricingInput')}
            good="low"
          />
          {/* Output price */}
          <StatRow
            label="Output Price"
            value={`${formatPrice(model.pricing.output)}/M`}
            icon={<DollarSign className="w-3 h-3" />}
            highlight={isWinner('pricingOutput')}
            good="low"
          />
          {/* MMLU */}
          {model.benchmarks.mmlu !== undefined && (
            <StatRow
              label="MMLU"
              value={`${model.benchmarks.mmlu}%`}
              icon={<Brain className="w-3 h-3" />}
              highlight={isWinner('mmlu')}
            />
          )}
          {/* HumanEval */}
          {model.benchmarks.humaneval !== undefined && (
            <StatRow
              label="HumanEval"
              value={`${model.benchmarks.humaneval}%`}
              icon={<Brain className="w-3 h-3" />}
              highlight={isWinner('humaneval')}
            />
          )}
          {/* GPQA */}
          {model.benchmarks.gpqa !== undefined && (
            <StatRow
              label="GPQA"
              value={`${model.benchmarks.gpqa}%`}
              icon={<Brain className="w-3 h-3" />}
              highlight={isWinner('gpqa')}
            />
          )}
          {/* Open Source */}
          <StatRow
            label="Open Source"
            value={model.openSource ? '✓ Yes' : '✗ No'}
            icon={<Zap className="w-3 h-3" />}
            highlight={isWinner('openSource') && model.openSource}
          />
        </div>

        {/* Capabilities */}
        <div className="mt-4">
          <span className="text-xs font-mono text-zinc-600 uppercase tracking-widest">Capabilities</span>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {model.capabilities.map(cap => (
              <span key={cap} className="capability-pill text-[10px]">{cap}</span>
            ))}
          </div>
        </div>

        {/* Strengths */}
        <div className="mt-4">
          <span className="text-xs font-mono text-zinc-600 uppercase tracking-widest">Strengths</span>
          <ul className="mt-2 space-y-1">
            {model.strengths.slice(0, 4).map(s => (
              <li key={s} className="text-xs text-zinc-400 flex items-start gap-1">
                <span className="text-green-500/60 mt-0.5 flex-shrink-0">+</span> {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

function StatRow({ label, value, icon, highlight, good }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
  good?: 'high' | 'low';
}) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg"
      style={{
        background: highlight ? 'rgba(34,211,238,0.06)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${highlight ? 'rgba(34,211,238,0.2)' : 'rgba(255,255,255,0.04)'}`,
      }}>
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <span style={{ color: highlight ? '#22d3ee' : undefined }}>{icon}</span>
        {label}
      </div>
      <div className="flex items-center gap-1">
        {highlight && <Check className="w-3 h-3 text-cyan-400" />}
        <span className="text-xs font-mono"
          style={{ color: highlight ? '#22d3ee' : '#a1a1aa', fontWeight: highlight ? 600 : 400 }}>
          {value}
        </span>
      </div>
    </div>
  );
}

export default function ComparePage() {
  const [allModels, setAllModels] = useState<AIModel[]>([]);
  const [selected, setSelected] = useState<AIModel[]>([]);
  const [search, setSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/models')
      .then(r => r.json())
      .then(data => {
        setAllModels(data.models || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const addModel = (model: AIModel) => {
    if (selected.length >= 3 || selected.find(m => m.id === model.id)) return;
    setSelected(prev => [...prev, model]);
    setShowPicker(false);
    setSearch('');
  };

  const removeModel = (id: string) => setSelected(prev => prev.filter(m => m.id !== id));

  const filteredModels = allModels.filter(m =>
    !selected.find(s => s.id === m.id) &&
    (m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.provider.toLowerCase().includes(search.toLowerCase()))
  );

  const isWinner = (field: string) => (model: AIModel): boolean => {
    if (selected.length < 2) return false;
    switch (field) {
      case 'contextWindow': return model.contextWindow === Math.max(...selected.map(m => m.contextWindow));
      case 'pricingInput': return model.pricing.input === Math.min(...selected.map(m => m.pricing.input));
      case 'pricingOutput': return model.pricing.output === Math.min(...selected.map(m => m.pricing.output));
      case 'mmlu': return (model.benchmarks.mmlu ?? 0) === Math.max(...selected.map(m => m.benchmarks.mmlu ?? 0));
      case 'humaneval': return (model.benchmarks.humaneval ?? 0) === Math.max(...selected.map(m => m.benchmarks.humaneval ?? 0));
      case 'gpqa': return (model.benchmarks.gpqa ?? 0) === Math.max(...selected.map(m => m.benchmarks.gpqa ?? 0));
      case 'openSource': return model.openSource;
      default: return false;
    }
  };

  return (
    <div className="relative min-h-screen" style={{ background: '#0a0a0f' }}>
      <NeuralBackground />
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="flex items-center gap-4 mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link href="/"
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="w-px h-4 bg-zinc-800" />
          <h1 className="text-2xl font-bold gradient-text">Model Comparison</h1>
          <span className="text-xs font-mono text-zinc-600">Battle mode</span>
        </motion.div>

        {/* Add model button */}
        {selected.length < 3 && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: 'rgba(139,92,246,0.1)',
                border: '1px solid rgba(139,92,246,0.3)',
                color: '#c4b5fd',
              }}
            >
              <Plus className="w-4 h-4" />
              Add model to compare ({selected.length}/3)
            </button>

            <AnimatePresence>
              {showPicker && (
                <motion.div
                  className="mt-3 rounded-2xl overflow-hidden max-w-md"
                  style={{ background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.08)' }}
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                >
                  <div className="p-3 border-b border-white/5">
                    <input
                      autoFocus
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search models..."
                      className="w-full bg-transparent text-sm text-zinc-300 placeholder-zinc-600 outline-none"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredModels.map(model => (
                      <button
                        key={model.id}
                        onClick={() => addModel(model)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-white/4 transition-colors text-left"
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
                          style={{ background: `${getProviderColor(model.provider)}20`, color: getProviderColor(model.provider) }}>
                          {model.provider[0]}
                        </div>
                        <div>
                          <span className="text-sm text-zinc-300">{model.name}</span>
                          <span className="text-xs text-zinc-600 ml-2">{model.provider}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Compare cards */}
        {selected.length === 0 ? (
          <motion.div
            className="text-center py-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-zinc-600 text-lg mb-2">No models selected</p>
            <p className="text-zinc-700 text-sm">Add up to 3 models to compare them side by side</p>
          </motion.div>
        ) : (
          <div className="flex gap-4 items-start">
            {selected.map((model, i) => (
              <CompareCard
                key={model.id}
                model={model}
                onRemove={() => removeModel(model.id)}
                index={i}
                allModels={allModels}
                isWinner={(field) => isWinner(field)(model)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
