'use client';

import { useRouter } from 'next/navigation';
import { Trophy, Medal, Award, Home } from 'lucide-react';
import { useSessionStore } from '@/stores/session.store';
import { cn } from '@/lib/cn';

const RANK_CONFIGS = [
  { icon: Trophy,  iconColor: 'text-yellow-400', bg: 'bg-yellow-500/15',  ring: 'ring-yellow-500/30', label: 'text-yellow-400' },
  { icon: Medal,   iconColor: 'text-zinc-300',   bg: 'bg-white/8',        ring: 'ring-white/12',      label: 'text-zinc-300'  },
  { icon: Award,   iconColor: 'text-orange-400', bg: 'bg-orange-500/15',  ring: 'ring-orange-500/30', label: 'text-orange-400' },
] as const;

export function GameResultView() {
  const router     = useRouter();
  const clear      = useSessionStore((s) => s.clear);
  const gameResult = useSessionStore((s) => s.gameResult);
  const snapshot   = useSessionStore((s) => s.snapshot);

  if (!gameResult) return null;

  function handleBackToHome() {
    clear();
    router.push('/');
  }

  const colorMap = new Map(snapshot?.players.map((p) => [p.playerId, p.color]) ?? []);
  const avatarMap = new Map(snapshot?.players.map((p) => [p.playerId, p.avatarUrl]) ?? []);

  const winner = gameResult.leaderboard[0];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">

      {/* Hero section */}
      <div className="flex flex-col items-center gap-4 px-6 pt-8 pb-6 text-center">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 animate-fade-up">Game over</span>
        <h2 className="text-3xl font-black text-white animate-fade-up" style={{ animationDelay: '60ms' }}>
          Final Results
        </h2>

        {winner && (
          <div className="mt-2 flex flex-col items-center gap-3 animate-pop-in" style={{ animationDelay: '120ms' }}>
            <div
              className="flex size-16 items-center justify-center rounded-full text-3xl ring-4 ring-yellow-400/40 shadow-[0_0_32px_rgba(234,179,8,0.3)]"
              style={{ backgroundColor: colorMap.get(winner.playerId) ?? '#8b5cf6' }}
            >
              {avatarMap.get(winner.playerId) ?? '🏆'}
            </div>
            <div>
              <p className="text-lg font-black text-white">{winner.name}</p>
              <p className="text-sm text-yellow-400 font-semibold">{winner.score} pts · Winner!</p>
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <ol className="flex flex-col gap-2 px-4 pb-4 mx-auto w-full max-w-lg">
        {gameResult.leaderboard.map((entry, i) => {
          const rankCfg = RANK_CONFIGS[entry.rank - 1];
          const playerColor = colorMap.get(entry.playerId);
          const playerAvatar = avatarMap.get(entry.playerId);
          const RankIcon = rankCfg?.icon;

          return (
            <li
              key={entry.playerId}
              className={cn(
                'flex items-center gap-3.5 rounded-2xl px-4 py-3.5 ring-1 animate-fade-up',
                rankCfg ? `${rankCfg.bg} ${rankCfg.ring}` : 'bg-white/6 ring-white/8',
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex size-7 shrink-0 items-center justify-center">
                {RankIcon ? (
                  <RankIcon className={cn('size-5', rankCfg.iconColor)} />
                ) : (
                  <span className="text-sm font-bold text-white/25">{entry.rank}</span>
                )}
              </div>

              {playerColor && (
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-xl ring-2 ring-white/15"
                  style={{ backgroundColor: playerColor }}
                >
                  {playerAvatar ?? '👤'}
                </div>
              )}

              <span className="flex-1 truncate text-sm font-semibold text-white">{entry.name}</span>

              <span className={cn('text-sm font-black tabular-nums', rankCfg ? rankCfg.label : 'text-white/60')}>
                {entry.score} pts
              </span>
            </li>
          );
        })}
      </ol>

      {/* Back button */}
      <div className="mt-auto px-4 pb-6 pt-2 flex justify-center">
        <button
          onClick={handleBackToHome}
          className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-violet-600 to-fuchsia-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-900/40 transition-all hover:from-violet-500 hover:to-fuchsia-500 active:scale-95"
        >
          <Home className="size-4" />
          Back to home
        </button>
      </div>
    </div>
  );
}
