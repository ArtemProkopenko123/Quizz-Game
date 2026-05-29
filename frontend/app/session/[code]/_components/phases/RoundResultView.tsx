'use client';

import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useSessionStore } from '@/stores/session.store';

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;
const OPTION_CONFIGS = [
  { color: '#f43f5e', bg: 'rgba(244,63,94,0.2)',  border: 'rgba(244,63,94,0.4)'  },
  { color: '#3b82f6', bg: 'rgba(59,130,246,0.2)', border: 'rgba(59,130,246,0.4)' },
  { color: '#f59e0b', bg: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.4)' },
  { color: '#10b981', bg: 'rgba(16,185,129,0.2)', border: 'rgba(16,185,129,0.4)' },
] as const;

export function RoundResultView() {
  const lastRoundResult = useSessionStore((s) => s.lastRoundResult);

  if (!lastRoundResult) return null;

  const { correctAnswerIndex } = lastRoundResult;
  const correctLabel = OPTION_LABELS[correctAnswerIndex];
  const cfg = OPTION_CONFIGS[correctAnswerIndex];

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">

      <div className="flex flex-col items-center gap-1 animate-fade-up">
        <CheckCircle2 className="size-8 text-emerald-400" />
        <p className="text-xs font-bold uppercase tracking-widest text-white/40">
          Correct answer
        </p>
      </div>

      {correctLabel && cfg && (
        <div
          className="animate-pop-in flex size-24 items-center justify-center rounded-3xl text-5xl font-black text-white shadow-lg"
          style={{
            background: cfg.bg,
            border: `2px solid ${cfg.border}`,
            boxShadow: `0 0 40px ${cfg.border}`,
          }}
        >
          {correctLabel}
        </div>
      )}

      <div className="flex items-center gap-2 animate-fade-up text-white/30" style={{ animationDelay: '200ms' }}>
        <ArrowRight className="size-4" />
        <p className="text-sm font-medium">Next question coming up…</p>
      </div>
    </div>
  );
}
