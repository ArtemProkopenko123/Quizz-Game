'use client';

import { useSessionStore } from '@/stores/session.store';

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;
const OPTION_COLORS = [
  { base: 'bg-red-500' },
  { base: 'bg-blue-500' },
  { base: 'bg-yellow-400' },
  { base: 'bg-green-500' },
] as const;

export function RoundResultView() {
  const lastRoundResult = useSessionStore((s) => s.lastRoundResult);

  if (!lastRoundResult) return null;

  const { correctAnswerIndex } = lastRoundResult;
  const correctLabel = OPTION_LABELS[correctAnswerIndex];
  const correctColor = OPTION_COLORS[correctAnswerIndex];

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">
        Correct answer
      </p>

      {correctLabel && correctColor && (
        <div
          className={`flex size-20 items-center justify-center rounded-3xl text-4xl font-bold text-white shadow-lg ${correctColor.base}`}
        >
          {correctLabel}
        </div>
      )}

      <p className="mt-2 text-sm text-zinc-400">Next question coming up…</p>
    </div>
  );
}
