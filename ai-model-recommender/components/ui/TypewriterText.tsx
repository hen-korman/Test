'use client';

import { useState, useEffect } from 'react';

const EXAMPLES = [
  'Summarize 100-page legal documents…',
  'Generate React components from sketches…',
  'Analyze satellite imagery for crop yields…',
  'Write a production-grade REST API…',
  'Translate medical reports with context…',
  'Debug complex distributed system logs…',
  'Create viral marketing copy in 5 languages…',
  'Build a recommendation engine from scratch…',
];

export default function TypewriterText({ className }: { className?: string }) {
  const [displayText, setDisplayText] = useState('');
  const [exampleIdx, setExampleIdx] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'pause' | 'deleting'>('typing');

  useEffect(() => {
    const example = EXAMPLES[exampleIdx];
    let timeout: NodeJS.Timeout;

    if (phase === 'typing') {
      if (displayText.length < example.length) {
        timeout = setTimeout(() => {
          setDisplayText(example.slice(0, displayText.length + 1));
        }, 45);
      } else {
        timeout = setTimeout(() => setPhase('pause'), 2200);
      }
    } else if (phase === 'pause') {
      timeout = setTimeout(() => setPhase('deleting'), 200);
    } else {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 22);
      } else {
        setExampleIdx((exampleIdx + 1) % EXAMPLES.length);
        setPhase('typing');
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, phase, exampleIdx]);

  return (
    <span className={className}>
      {displayText}
      <span
        className="inline-block w-0.5 h-5 ml-0.5 align-middle"
        style={{
          background: 'linear-gradient(to bottom, #8b5cf6, #22d3ee)',
          animation: 'pulse-opacity 1s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes pulse-opacity {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </span>
  );
}
