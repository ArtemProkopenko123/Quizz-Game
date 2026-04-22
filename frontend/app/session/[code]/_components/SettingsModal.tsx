'use client';

import { useState } from 'react';
import type { SessionSettings } from '@/types/session.types';

interface Props {
  settings: SessionSettings;
  maxRounds: number;
  onSave: (patch: Partial<SessionSettings>) => void;
  onClose: () => void;
}

const DURATION_OPTIONS = [15, 20, 30] as const;

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-semibold text-white/70">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex size-8 items-center justify-center rounded-lg bg-white/8 text-white/60 transition hover:bg-white/14 disabled:opacity-30 cursor-pointer"
        >
          −
        </button>
        <span className="w-6 text-center text-base font-black tabular-nums text-white">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex size-8 items-center justify-center rounded-lg bg-white/8 text-white/60 transition hover:bg-white/14 disabled:opacity-30 cursor-pointer"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function SettingsModal({ settings, maxRounds, onSave, onClose }: Props) {
  const [roundCount, setRoundCount] = useState(settings.roundCount);
  const [questionsPerRound, setQuestionsPerRound] = useState(settings.questionsPerRound);
  const [questionDuration, setQuestionDuration] = useState(settings.questionDuration);

  function handleSave() {
    onSave({ roundCount, questionsPerRound, questionDuration });
    onClose();
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 space-y-6 animate-pop-in"
        style={{
          background: 'rgba(15,10,30,0.95)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-white">Game settings</h2>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl text-white/40 transition hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Settings */}
        <div className="space-y-5">
          <Stepper
            label="Rounds"
            value={roundCount}
            min={1}
            max={maxRounds}
            onChange={setRoundCount}
          />
          <Stepper
            label="Questions per round"
            value={questionsPerRound}
            min={3}
            max={10}
            onChange={setQuestionsPerRound}
          />

          {/* Duration toggle */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-white/70">Time per question</span>
            <div className="flex gap-1.5">
              {DURATION_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setQuestionDuration(d)}
                  className={`h-8 w-12 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    questionDuration === d
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40'
                      : 'bg-white/8 text-white/50 hover:bg-white/14'
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Info line */}
        <p className="text-xs text-white/25 text-center">
          Total questions: ~{roundCount * questionsPerRound}
        </p>

        {/* Save */}
        <button
          onClick={handleSave}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-base font-bold text-white shadow-lg shadow-violet-900/40 transition hover:from-violet-500 hover:to-fuchsia-500 active:scale-[0.97] cursor-pointer"
        >
          Save
        </button>
      </div>
    </div>
  );
}
