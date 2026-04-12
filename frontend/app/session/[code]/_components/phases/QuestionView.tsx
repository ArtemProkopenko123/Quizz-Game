'use client';

import { useState, useEffect } from 'react';
import { useSessionStore } from '@/stores/session.store';
import { useCountdown } from '@/hooks/useCountdown';

const QUESTION_SECONDS = 20;
const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

const OPTION_CONFIGS = [
  { color: '#f43f5e', idleBg: 'rgba(244,63,94,0.13)',  selBg: 'rgba(244,63,94,0.32)',  glow: '0 0 28px rgba(244,63,94,0.55)',  border: 'rgba(244,63,94,0.5)'  },
  { color: '#3b82f6', idleBg: 'rgba(59,130,246,0.13)', selBg: 'rgba(59,130,246,0.32)', glow: '0 0 28px rgba(59,130,246,0.55)', border: 'rgba(59,130,246,0.5)' },
  { color: '#f59e0b', idleBg: 'rgba(245,158,11,0.13)', selBg: 'rgba(245,158,11,0.32)', glow: '0 0 28px rgba(245,158,11,0.55)', border: 'rgba(245,158,11,0.5)' },
  { color: '#10b981', idleBg: 'rgba(16,185,129,0.13)', selBg: 'rgba(16,185,129,0.32)', glow: '0 0 28px rgba(16,185,129,0.55)', border: 'rgba(16,185,129,0.5)' },
] as const;

// ── Circular Timer ───────────────────────────────────────────
const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function CircularTimer({ progress, secondsLeft }: { progress: number; secondsLeft: number }) {
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const isUrgent = secondsLeft <= 5;
  const strokeColor = isUrgent ? '#ef4444' : progress > 0.4 ? '#8b5cf6' : '#facc15';
  const glowColor   = isUrgent ? 'rgba(239,68,68,0.8)' : progress > 0.4 ? 'rgba(139,92,246,0.6)' : 'rgba(250,204,21,0.6)';

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: 124,
        height: 124,
        animation: isUrgent ? 'timer-urgent 0.6s ease-in-out infinite' : undefined,
      }}
    >
      <svg
        width={124}
        height={124}
        viewBox="0 0 124 124"
        style={{ transform: 'rotate(-90deg)', filter: `drop-shadow(0 0 10px ${glowColor})` }}
      >
        <circle cx={62} cy={62} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8} />
        <circle
          cx={62} cy={62} r={RADIUS}
          fill="none"
          stroke={strokeColor}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s ease' }}
        />
      </svg>
      <span className={`absolute text-4xl font-black tabular-nums ${isUrgent ? 'text-red-400' : 'text-white'}`}>
        {secondsLeft}
      </span>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
interface Props {
  emitSubmitAnswer: (questionId: string, answerIndex: number) => void;
}

export function QuestionView({ emitSubmitAnswer }: Props) {
  const activeQuestion  = useSessionStore((s) => s.activeQuestion);
  const answerStatus    = useSessionStore((s) => s.answerStatus);
  const lastRoundResult = useSessionStore((s) => s.lastRoundResult);
  const snapshot        = useSessionStore((s) => s.snapshot);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    setSelectedIndex(null);
  }, [activeQuestion?.questionId]);

  const { secondsLeft, progress } = useCountdown(
    activeQuestion?.deadlineAt ?? null,
    QUESTION_SECONDS,
  );

  if (!activeQuestion) return null;

  const { questionId, prompt, options, roundIndex, totalRounds } = activeQuestion;

  const showResult   = lastRoundResult?.questionId === questionId;
  const correctIndex = lastRoundResult?.correctAnswerIndex ?? -1;

  function handleSelect(index: number) {
    if (showResult) return;
    setSelectedIndex(index);
    emitSubmitAnswer(questionId, index);
  }

  const snapshotPlayers = snapshot?.players ?? [];
  const players = showResult
    ? (lastRoundResult?.scores ?? [])
        .map((s) => {
          const p = snapshotPlayers.find((p) => p.playerId === s.playerId);
          return { playerId: s.playerId, name: p?.name ?? '?', color: p?.color ?? '#999', score: s.totalScore, roundScore: s.roundScore };
        })
        .sort((a, b) => b.score - a.score)
    : [...snapshotPlayers].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-1 flex-col">
      <div key={questionId} className="flex flex-col">

        {/* Round counter */}
        <header className="flex justify-center px-4 pt-5 pb-1 animate-fade-up">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
            Вопрос {roundIndex + 1} / {totalRounds}
          </span>
        </header>

        {/* Timer — fixed height to avoid layout shift */}
        <div
          className="flex h-[148px] items-center justify-center animate-fade-up"
          style={{ animationDelay: '60ms' }}
        >
          {!showResult && <CircularTimer progress={progress} secondsLeft={secondsLeft} />}

          {showResult && (
            <div className="flex flex-col items-center gap-1">
              <span className="text-4xl">✅</span>
              <span className="text-xs font-semibold uppercase tracking-widest text-white/40">Правильный ответ</span>
            </div>
          )}
        </div>

        {/* Question prompt */}
        <div className="px-5 pb-3 animate-fade-up" style={{ animationDelay: '120ms' }}>
          <p className="text-center text-2xl font-bold leading-snug text-white drop-shadow-lg">
            {prompt}
          </p>
        </div>

        {/* Submitted hint */}
        {selectedIndex !== null && !showResult && (
          <p className="mb-1 text-center text-xs font-medium text-white/30">
            Ответ принят · нажмите для смены
          </p>
        )}

        {/* Options grid */}
        <div className="grid grid-cols-2 gap-3 p-4">
          {options.map((option, index) => {
            const label = OPTION_LABELS[index];
            const cfg   = OPTION_CONFIGS[index];
            if (!label || !cfg) return null;

            const isSelected = selectedIndex === index;
            const isCorrect  = showResult && index === correctIndex;
            const isWrong    = showResult && isSelected && !isCorrect;
            const isDimmed   = showResult && !isCorrect && !isWrong;

            let background  = cfg.idleBg;
            let boxShadow: string | undefined;
            let borderColor = 'rgba(255,255,255,0.08)';
            let extraCls    = '';

            if (showResult) {
              if (isCorrect) {
                background  = 'rgba(16,185,129,0.25)';
                boxShadow   = '0 0 32px rgba(16,185,129,0.5)';
                borderColor = 'rgba(16,185,129,0.6)';
                extraCls    = 'animate-correct';
              } else if (isWrong) {
                background  = 'rgba(239,68,68,0.2)';
                borderColor = 'rgba(239,68,68,0.4)';
                extraCls    = 'animate-wrong opacity-80';
              }
            } else if (isSelected) {
              background  = cfg.selBg;
              boxShadow   = cfg.glow;
              borderColor = cfg.border;
            }

            return (
              <div
                key={index}
                className="animate-pop-in"
                style={{ animationDelay: `${200 + index * 80}ms` }}
              >
                <button
                  key={isSelected ? `${index}-sel` : index}
                  disabled={showResult}
                  onClick={() => handleSelect(index)}
                  className={`w-full min-h-[88px] flex flex-col items-start gap-2.5 rounded-2xl p-3.5 text-left transition-all duration-150 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 ${isDimmed ? 'opacity-35' : ''} ${extraCls} ${isSelected && !showResult ? 'animate-answer-bounce' : ''}`}
                  style={{
                    background,
                    boxShadow,
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  {/* Label badge */}
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
                    style={{
                      backgroundColor: isCorrect ? '#10b981' : isWrong ? '#ef4444' : cfg.color,
                      boxShadow: isCorrect ? '0 0 12px rgba(16,185,129,0.6)' : isWrong ? 'none' : `0 0 10px ${cfg.color}60`,
                    }}
                  >
                    {label}
                  </span>
                  {/* Option text */}
                  <span className={`text-sm font-semibold leading-snug ${isCorrect ? 'text-emerald-300' : isWrong ? 'text-red-300' : isSelected ? 'text-white' : 'text-white/80'}`}>
                    {option}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scoreboard */}
      {players.length > 0 && (
        <ul className="mx-4 mb-5 mt-auto flex flex-col gap-2">
          {players.map((player, rank) => {
            const delta = showResult && 'roundScore' in player ? player.roundScore : null;
            return (
              <li
                key={player.playerId}
                className="flex items-center gap-3 rounded-xl px-4 py-2.5"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <span className="w-4 text-center text-xs font-bold text-white/25">{rank + 1}</span>
                <div
                  className="size-7 shrink-0 rounded-full ring-2 ring-white/15"
                  style={{ backgroundColor: player.color }}
                />
                <span className="flex-1 truncate text-sm font-semibold text-white/80">{player.name}</span>
                {delta !== null && (
                  delta > 0
                    ? <span className="text-xs font-bold text-emerald-400">+{delta}</span>
                    : <span className="text-xs text-white/25">—</span>
                )}
                <span className="text-sm font-black tabular-nums text-white">{player.score}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
