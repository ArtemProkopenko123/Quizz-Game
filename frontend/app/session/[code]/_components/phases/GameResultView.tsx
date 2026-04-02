'use client';

import { useSessionStore } from '@/stores/session.store';

const TOP3_STYLES = [
  { bg: 'bg-yellow-50',  ring: 'ring-yellow-300', rank: 'text-yellow-500 font-extrabold' },
  { bg: 'bg-zinc-50',    ring: 'ring-zinc-300',   rank: 'text-zinc-400   font-extrabold' },
  { bg: 'bg-orange-50',  ring: 'ring-orange-200', rank: 'text-orange-400 font-extrabold' },
] as const;

export function GameResultView() {
  const gameResult = useSessionStore((s) => s.gameResult);
  const snapshot   = useSessionStore((s) => s.snapshot);

  if (!gameResult) return null;

  const colorMap = new Map(snapshot?.players.map((p) => [p.playerId, p.color]) ?? []);

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
      <div className="pt-4 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">Game over</p>
        <p className="mt-1 text-2xl font-bold text-zinc-900">Final results</p>
      </div>

      <ol className="flex flex-col gap-2">
        {gameResult.leaderboard.map((entry) => {
          const style       = TOP3_STYLES[entry.rank - 1];
          const playerColor = colorMap.get(entry.playerId);
          return (
            <li
              key={entry.playerId}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 ring-1 ${
                style ? `${style.bg} ${style.ring}` : 'bg-white ring-zinc-200'
              }`}
            >
              <span
                className={`w-6 text-center text-sm ${
                  style ? style.rank : 'font-bold text-zinc-400'
                }`}
              >
                {entry.rank}
              </span>

              {playerColor && (
                <div
                  className="size-8 shrink-0 rounded-full"
                  style={{ backgroundColor: playerColor }}
                />
              )}

              <span className="flex-1 text-sm font-medium text-zinc-900">{entry.name}</span>

              <span className="text-sm font-bold tabular-nums text-zinc-700">
                {entry.score} pts
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-auto pb-4 text-center">
        <a
          href="/"
          className="inline-block rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition-transform hover:bg-violet-700 active:scale-95"
        >
          Back to home
        </a>
      </div>
    </div>
  );
}
