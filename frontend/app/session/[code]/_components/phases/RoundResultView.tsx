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
  const snapshot        = useSessionStore((s) => s.snapshot);

  if (!lastRoundResult) return null;

  const { correctAnswerIndex, leaderboard, scores } = lastRoundResult;

  const correctLabel = OPTION_LABELS[correctAnswerIndex];
  const correctColor = OPTION_COLORS[correctAnswerIndex];

  const roundScoreMap = new Map(scores.map((s) => [s.playerId, s.roundScore]));
  const colorMap      = new Map(snapshot?.players.map((p) => [p.playerId, p.color]) ?? []);

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
      {/* Correct answer badge */}
      <div className="flex flex-col items-center gap-2 pt-4">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">
          Correct answer
        </p>
        {correctLabel && correctColor && (
          <div
            className={`flex size-14 items-center justify-center rounded-2xl text-2xl font-bold text-white ${correctColor.base}`}
          >
            {correctLabel}
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Leaderboard</p>
        <ol className="flex flex-col gap-2">
          {leaderboard.map((entry, i) => {
            const roundScore  = roundScoreMap.get(entry.playerId) ?? 0;
            const playerColor = colorMap.get(entry.playerId);
            return (
              <li
                key={entry.playerId}
                className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-zinc-200"
              >
                <span className="w-5 text-center text-sm font-bold text-zinc-400">{i + 1}</span>

                {playerColor && (
                  <div
                    className="size-8 shrink-0 rounded-full"
                    style={{ backgroundColor: playerColor }}
                  />
                )}

                <span className="flex-1 text-sm font-medium text-zinc-900">{entry.name}</span>

                {roundScore > 0 && (
                  <span className="text-xs font-semibold text-green-600">+{roundScore}</span>
                )}

                <span className="text-sm font-bold tabular-nums text-zinc-700">{entry.score}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
