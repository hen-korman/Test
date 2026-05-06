'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, ExternalLink, Zap, DollarSign, Brain, Database } from 'lucide-react';
import MatchScoreRing from './MatchScoreRing';
import type { Recommendation, FilterState } from '@/lib/types';
import { formatContextWindow, formatPrice, getProviderColor } from '@/lib/recommender';

interface ModelCardProps {
  rec: Recommendation;
  rank: number;
  task: string;
  filters: FilterState;
  topModelName: string;
  delay?: number;
}

const PROVIDER_LOGOS: Record<string, string> = {
  Anthropic: '/logos/anthropic.svg',
  OpenAI: '/logos/openai.svg',
  Google: '/logos/google.svg',
  Meta: '/logos/meta.svg',
  Mistral: '/logos/mistral.svg',
  DeepSeek: '/logos/deepseek.svg',
  xAI: '/logos/xai.svg',
  Alibaba: '/logos/alibaba.svg',
  Microsoft: '/logos/microsoft.svg',
};

const RANK_LABELS = ['#1 Best Match', '#2 Runner Up', '#3 Alternative'];
const RANK_COLORS = ['#22d3ee', '#8b5cf6', '#f0abfc'];

export default function ModelCard({ rec, rank, task, filters, topModelName, delay = 0 }: ModelCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [whyNot, setWhyNot] = useState('');
  const [loadingWhyNot, setLoadingWhyNot] = useState(false);
  const [showLang, setShowLang] = useState<'en' | 'he'>('en');

  const model = rec.model;
  if (!model) return null;

  const providerColor = getProviderColor(model.provider);
  const rankColor = RANK_COLORS[rank] || '#a1a1aa';

  const handleWhyNot = async () => {
    if (whyNot) return;
    setLoadingWhyNot(true);
    try {
      const res = await fetch('/api/why-not', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task,
          excludedModel: model.name,
          recommendedModel: topModelName,
          filters,
        }),
      });
      const data = await res.json();
      setWhyNot(data.explanation || 'No explanation available.');
    } catch {
      setWhyNot('Could not load explanation.');
    } finally {
      setLoadingWhyNot(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.34, 1.56, 0.64, 1] }}
      className="group relative rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${rank === 0 ? 'rgba(34,211,238,0.25)' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: rank === 0
          ? '0 0 40px rgba(34,211,238,0.08), inset 0 0 40px rgba(34,211,238,0.02)'
          : '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Rank badge */}
      <div
        className="absolute top-4 left-4 px-2 py-1 rounded-md text-xs font-mono font-bold"
        style={{
          background: `${rankColor}18`,
          border: `1px solid ${rankColor}40`,
          color: rankColor,
        }}
      >
        {RANK_LABELS[rank]}
      </div>

      {/* Open source badge */}
      {model.openSource && (
        <div className="absolute top-4 right-[90px] px-2 py-1 rounded-md text-xs font-mono"
          style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80' }}>
          Open Source
        </div>
      )}

      <div className="p-6 pt-12">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Provider initial as colored circle */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0"
              style={{ background: `${providerColor}20`, border: `1px solid ${providerColor}40`, color: providerColor }}
            >
              {model.provider[0]}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-lg text-zinc-100 leading-tight truncate glitch-hover cursor-default">
                {model.name}
              </h3>
              <span className="text-xs font-mono text-zinc-500">{model.provider}</span>
            </div>
          </div>
          <MatchScoreRing score={rec.matchScore} />
        </div>

        {/* Capabilities */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {model.capabilities.slice(0, 5).map(cap => (
            <span key={cap} className="capability-pill">
              {cap}
            </span>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="flex flex-col items-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Database className="w-3.5 h-3.5 text-purple-400 mb-1" />
            <span className="text-xs font-mono text-zinc-300 font-bold">{formatContextWindow(model.contextWindow)}</span>
            <span className="text-[10px] text-zinc-600">context</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <DollarSign className="w-3.5 h-3.5 text-cyan-400 mb-1" />
            <span className="text-xs font-mono text-zinc-300 font-bold">{formatPrice(model.pricing.input)}</span>
            <span className="text-[10px] text-zinc-600">/ M in</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Zap className="w-3.5 h-3.5 text-pink-400 mb-1" />
            <span className="text-xs font-mono text-zinc-300 font-bold">{formatPrice(model.pricing.output)}</span>
            <span className="text-[10px] text-zinc-600">/ M out</span>
          </div>
        </div>

        {/* Reason */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-zinc-500">Why this model?</span>
            <div className="flex gap-1">
              <button
                onClick={() => setShowLang('en')}
                className={`text-xs px-2 py-0.5 rounded font-mono transition-colors ${showLang === 'en' ? 'bg-purple-500/20 text-purple-300' : 'text-zinc-600 hover:text-zinc-400'}`}
              >EN</button>
              <button
                onClick={() => setShowLang('he')}
                className={`text-xs px-2 py-0.5 rounded font-mono transition-colors ${showLang === 'he' ? 'bg-purple-500/20 text-purple-300' : 'text-zinc-600 hover:text-zinc-400'}`}
              >עב</button>
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={showLang}
              className="text-sm text-zinc-400 leading-relaxed"
              dir={showLang === 'he' ? 'rtl' : 'ltr'}
              initial={{ opacity: 0, x: showLang === 'he' ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {showLang === 'en' ? rec.reasons.en : rec.reasons.he}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Expand button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 w-full flex items-center justify-center gap-1 text-xs text-zinc-600 hover:text-zinc-400 transition-colors py-1"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Less details' : 'More details'}
        </button>

        {/* Expanded section */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4 border-t border-white/5">
                {/* Tradeoffs */}
                <div>
                  <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Tradeoffs</span>
                  <p className="text-sm text-zinc-400 mt-1">{rec.tradeoffs}</p>
                </div>

                {/* Strengths / Weaknesses */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs font-mono text-green-500/80 uppercase tracking-widest">Strengths</span>
                    <ul className="mt-1 space-y-1">
                      {model.strengths.slice(0, 3).map(s => (
                        <li key={s} className="text-xs text-zinc-400 flex items-start gap-1">
                          <span className="text-green-500/60 mt-0.5">+</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-xs font-mono text-red-400/80 uppercase tracking-widest">Weaknesses</span>
                    <ul className="mt-1 space-y-1">
                      {model.weaknesses.slice(0, 3).map(w => (
                        <li key={w} className="text-xs text-zinc-400 flex items-start gap-1">
                          <span className="text-red-400/60 mt-0.5">−</span> {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Benchmarks */}
                {Object.keys(model.benchmarks).length > 0 && (
                  <div>
                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Benchmarks</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Object.entries(model.benchmarks).map(([k, v]) => v !== undefined && (
                        <div key={k} className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                          <Brain className="w-3 h-3 text-purple-400" />
                          <span className="text-xs font-mono text-zinc-300">{k.toUpperCase()}</span>
                          <span className="text-xs font-mono text-purple-300 font-bold">{v}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Why not this? (if not rank 0) */}
                {rank > 0 && (
                  <div>
                    <button
                      onClick={handleWhyNot}
                      className="text-xs font-mono text-zinc-600 hover:text-cyan-400 transition-colors flex items-center gap-1"
                      disabled={loadingWhyNot}
                    >
                      <span>{loadingWhyNot ? '...' : '?'}</span>
                      Why wasn't this the top pick?
                    </button>
                    <AnimatePresence>
                      {whyNot && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-xs text-zinc-500 mt-2 leading-relaxed"
                        >
                          {whyNot}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom gradient line for rank 0 */}
      {rank === 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{
          background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent)'
        }} />
      )}
    </motion.div>
  );
}
