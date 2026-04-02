'use client';

import { useState } from 'react';
import { useSessionStore } from '@/stores/session.store';
import { useCountdown } from '@/hooks/useCountdown';

const QUESTION_SECONDS = 20;
const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;
const OPTION_COLORS = [
  { base: 'bg-red-500',    ring: 'ring-red-400',    text: 'text-red-600',    light: 'bg-red-50'    },
  { base: 'bg-blue-500',   ring: 'ring-blue-400',   text: 'text-blue-600',   light: 'bg-blue-50'   },
  { base: 'bg-yellow-400', ring: 'ring-yellow-400', text: 'text-yellow-600', light: 'bg-yellow-50' },
  { base: 'bg-green-500',  ring: 'ring-green-400',  text: 'text-green-600',  light: 'bg-green-50'  },
] as const;

interface Props {
  emitSubmitAnswer: (questionId: string, answerIndex: number) => void;
}

export function QuestionView({ emitSubmitAnswer }: Props) {
  const activeQuestion = useSessionStore((s) => s.activeQuestion);
  const answerStatus   = useSessionStore((s) => s.answerStatus);
  const scoreDelta     = useSessionStore((s) => s.answerScoreDelta);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const { secondsLeft, progress } = useCountdown(
    activeQuestion?.deadlineAt ?? null,
    QUESTION_SECONDS,
  );

  if (!activeQuestion) return null;

  const { questionId, prompt, options, roundIndex, totalRounds } = activeQuestion;
  const hasAnswered = answerStatus !== 'idle';

  function handleSelect(index: number) {
    if (hasAnswered) return;
    setSelectedIndex(index);
    emitSubmitAnswer(questionId, index);
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Timer bar */}
      <div className="h-1.5 w-full bg-zinc-200">
        <div
          className={`h-full transition-[width] duration-100 ${
            progress > 0.4 ? 'bg-violet-500' : progress > 0.2 ? 'bg-yellow-400' : 'bg-red-500'
          }`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3">
        <span className="text-xs font-medium text-zinc-400">
          Question {roundIndex + 1} / {totalRounds}
        </span>
        <span
          className={`text-lg font-bold tabular-nums ${
            secondsLeft <= 5 ? 'text-red-500' : 'text-zinc-700'
          }`}
        >
          {secondsLeft}s
        </span>
      </header>

      {/* Prompt */}
      <div className="flex-1 px-4 py-6">
        <p className="text-center text-xl font-semibold leading-snug text-zinc-900">
          {prompt}
        </p>
      </div>

      {/* Answer feedback */}
      {hasAnswered && (
        <div
          className={`mx-4 mb-4 rounded-xl px-4 py-3 text-center text-sm font-semibold ${
            answerStatus === 'accepted'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {answerStatus === 'accepted'
            ? scoreDelta !== null
              ? `+${scoreDelta} pts`
              : 'Answer accepted!'
            : 'Answer not accepted'}
        </div>
      )}

      {/* Options grid */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {options.map((option, index) => {
          const color = OPTION_COLORS[index];
          const label = OPTION_LABELS[index];
          const isSelected = selectedIndex === index;

          if (!color || !label) return null;

          return (
            <button
              key={index}
              disabled={hasAnswered}
              onClick={() => handleSelect(index)}
              className={[
                'flex min-h-20 flex-col items-start gap-2 rounded-2xl p-3 text-left',
                'transition-all duration-150',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500',
                'disabled:cursor-not-allowed',
                isSelected
                  ? `${color.light} ring-2 ${color.ring}`
                  : `bg-white ring-1 ring-zinc-200 hover:ring-2 ${hasAnswered ? '' : `hover:${color.ring}`}`,
              ].join(' ')}
            >
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${color.base}`}
              >
                {label}
              </span>
              <span className={`text-sm font-medium ${isSelected ? color.text : 'text-zinc-800'}`}>
                {option}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
