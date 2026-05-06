'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, GitCompare, History, X, ChevronRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import FilterChips from '@/components/ui/FilterChips';
import ModelCard from '@/components/ui/ModelCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import TypewriterText from '@/components/ui/TypewriterText';
import RecommendButton from '@/components/ui/RecommendButton';
import type { FilterState, Recommendation } from '@/lib/types';

const NeuralBackground = dynamic(() => import('@/components/NeuralBackground'), { ssr: false });
const NeuralOrb = dynamic(() => import('@/components/three/NeuralOrb'), { ssr: false });

const DEFAULT_FILTERS: FilterState = {
  taskType: '',
  budget: '',
  contextSize: '',
  privacy: '',
  priority: '',
};

interface HistoryEntry {
  id: string;
  task: string;
  filters: FilterState;
  recommendations: Recommendation[];
  timestamp: number;
}

export default function HomePage() {
  const [task, setTask] = useState('');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [taskSummary, setTaskSummary] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ai-recommender-history');
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  const saveToHistory = useCallback((t: string, f: FilterState, recs: Recommendation[]) => {
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      task: t,
      filters: f,
      recommendations: recs,
      timestamp: Date.now(),
    };
    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, 10);
      localStorage.setItem('ai-recommender-history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleRecommend = async () => {
    if (!task.trim() || task.trim().length < 3) {
      setError('Please describe your task (at least 3 characters)');
      return;
    }
    setError('');
    setLoading(true);
    setRecommendations([]);
    setTaskSummary('');

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, filters }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get recommendations');

      setRecommendations(data.recommendations || []);
      setTaskSummary(data.taskSummary || '');
      saveToHistory(task, filters, data.recommendations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleRecommend();
    }
  };

  const handleHistoryLoad = (entry: HistoryEntry) => {
    setTask(entry.task);
    setFilters(entry.filters);
    setRecommendations(entry.recommendations);
    setShowHistory(false);
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="relative min-h-screen" style={{ background: '#0a0a0f' }}>
      {/* Neural network background */}
      <NeuralBackground />

      {/* Gradient orbs */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-zinc-200 text-sm">AI Model Recommender</span>
          </motion.div>
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 transition-colors relative"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <History className="w-3.5 h-3.5" />
              History
              {history.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: '#fff' }}>
                  {history.length}
                </span>
              )}
            </button>
            <a
              href="/compare"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <GitCompare className="w-3.5 h-3.5" />
              Compare
            </a>
          </motion.div>
        </nav>

        {/* Hero Section */}
        <div className="flex flex-col items-center text-center px-6 pt-10 pb-16 max-w-5xl mx-auto">
          {/* 3D Orb */}
          <motion.div
            className="w-40 h-40 mb-8"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <NeuralOrb />
          </motion.div>

          {/* Hero text */}
          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl font-bold leading-none tracking-tight mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            <span className="gradient-text">Find Your AI</span>
          </motion.h1>

          <motion.p
            className="text-zinc-400 text-lg sm:text-xl max-w-2xl leading-relaxed mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            Describe any task. Get the perfect AI model recommendation, ranked by match quality — powered by Claude.
          </motion.p>

          <motion.p
            className="text-zinc-600 text-sm font-mono mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {recommendations.length === 0 && !loading
              ? '20+ models · Always up to date · Hebrew + English'
              : taskSummary
                ? `Detected: ${taskSummary}`
                : ''}
          </motion.p>

          {/* Command palette input */}
          <motion.div
            className="w-full max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 0 0 1px rgba(139,92,246,0.1), 0 20px 60px rgba(0,0,0,0.4)',
              }}
            >
              {/* Animated top border */}
              <div className="absolute top-0 left-0 right-0 h-px animated-border" />

              <div className="p-4">
                <textarea
                  ref={textareaRef}
                  value={task}
                  onChange={e => setTask(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={3}
                  className="w-full bg-transparent text-zinc-100 text-base resize-none placeholder-transparent focus:outline-none leading-relaxed"
                  style={{ caretColor: '#8b5cf6' }}
                />
                {!task && (
                  <div className="absolute top-4 left-4 text-zinc-600 text-base pointer-events-none select-none leading-relaxed">
                    <TypewriterText />
                  </div>
                )}
              </div>

              {/* Bottom row */}
              <div className="flex items-center justify-between px-4 pb-4 gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
                    style={{
                      background: showFilters ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
                      border: showFilters ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.07)',
                      color: showFilters ? '#c4b5fd' : '#71717a',
                    }}
                  >
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold"
                        style={{ background: 'rgba(139,92,246,0.4)', color: '#c4b5fd' }}>
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                  <span className="text-xs text-zinc-700 font-mono hidden sm:block">⌘↵ to submit</span>
                </div>
                <RecommendButton
                  onClick={handleRecommend}
                  loading={loading}
                  disabled={!task.trim()}
                />
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 flex items-center gap-2 text-sm px-4 py-2 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
                >
                  <X className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Filters panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 overflow-hidden"
                >
                  <FilterChips filters={filters} onChange={setFilters} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Results Section */}
        <div className="max-w-5xl mx-auto px-6 pb-24">
          {/* Loading skeletons */}
          {loading && (
            <div className="grid gap-6 md:grid-cols-3">
              {[0, 1, 2].map(i => <SkeletonCard key={i} delay={i * 0.12} />)}
            </div>
          )}

          {/* Results */}
          {!loading && recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-200">Top Recommendations</h2>
                  {taskSummary && (
                    <p className="text-sm text-zinc-500 mt-0.5 font-mono">{taskSummary}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setRecommendations([]);
                    setTask('');
                    setTaskSummary('');
                    setFilters(DEFAULT_FILTERS);
                    textareaRef.current?.focus();
                  }}
                  className="text-xs text-zinc-600 hover:text-zinc-400 flex items-center gap-1 transition-colors"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {recommendations.map((rec, i) => (
                  <ModelCard
                    key={rec.modelId}
                    rec={rec}
                    rank={i}
                    task={task}
                    filters={filters}
                    topModelName={recommendations[0]?.model?.name || ''}
                    delay={i * 0.1}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Empty state */}
          {!loading && recommendations.length === 0 && (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex justify-center gap-8 text-zinc-800 font-mono text-xs">
                {['Claude Opus 4.7', 'GPT-5', 'Gemini 2.5 Pro', 'Llama 4', 'DeepSeek R1'].map((name, i) => (
                  <motion.span
                    key={name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                  >
                    {name}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* History Drawer */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
            />
            <motion.div
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm z-50 overflow-y-auto"
              style={{ background: '#0d0d1a', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-zinc-200">Recent Searches</h3>
                  <button onClick={() => setShowHistory(false)}>
                    <X className="w-4 h-4 text-zinc-500" />
                  </button>
                </div>
                {history.length === 0 ? (
                  <p className="text-zinc-600 text-sm">No history yet. Start recommending!</p>
                ) : (
                  <div className="space-y-3">
                    {history.map(entry => (
                      <button
                        key={entry.id}
                        onClick={() => handleHistoryLoad(entry)}
                        className="w-full text-left p-3 rounded-xl hover:bg-white/5 transition-colors group"
                        style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <p className="text-sm text-zinc-300 line-clamp-2 mb-1">{entry.task}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-600 font-mono">
                            {new Date(entry.timestamp).toLocaleDateString()}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                        </div>
                        {entry.recommendations[0]?.model && (
                          <p className="text-xs text-purple-400/70 mt-1 font-mono">
                            → {entry.recommendations[0].model.name}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
