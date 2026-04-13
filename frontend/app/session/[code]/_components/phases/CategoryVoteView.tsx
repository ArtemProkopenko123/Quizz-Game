'use client';

import { useState } from 'react';
import { useSessionStore } from '@/stores/session.store';
import { useCountdown } from '@/hooks/useCountdown';
import type { PackOption } from '@/types/session.types';

const VOTE_SECONDS = 30;

const PACK_CONFIGS = [
  { color: '#f43f5e', idleBg: 'rgba(244,63,94,0.13)',  selBg: 'rgba(244,63,94,0.32)',  glow: '0 0 28px rgba(244,63,94,0.55)',  border: 'rgba(244,63,94,0.5)'  },
  { color: '#3b82f6', idleBg: 'rgba(59,130,246,0.13)', selBg: 'rgba(59,130,246,0.32)', glow: '0 0 28px rgba(59,130,246,0.55)', border: 'rgba(59,130,246,0.5)' },
  { color: '#f59e0b', idleBg: 'rgba(245,158,11,0.13)', selBg: 'rgba(245,158,11,0.32)', glow: '0 0 28px rgba(245,158,11,0.55)', border: 'rgba(245,158,11,0.5)' },
  { color: '#10b981', idleBg: 'rgba(16,185,129,0.13)', selBg: 'rgba(16,185,129,0.32)', glow: '0 0 28px rgba(16,185,129,0.55)', border: 'rgba(16,185,129,0.5)' },
  { color: '#8b5cf6', idleBg: 'rgba(139,92,246,0.13)', selBg: 'rgba(139,92,246,0.32)', glow: '0 0 28px rgba(139,92,246,0.55)', border: 'rgba(139,92,246,0.5)' },
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
  emitCategoryVote: (packId: string) => void;
}

export function CategoryVoteView({ emitCategoryVote }: Props) {
  const availablePacks = useSessionStore((s) => s.availablePacks);
  const categoryVotes  = useSessionStore((s) => s.categoryVotes);
  const categoryWinner = useSessionStore((s) => s.categoryWinner);
  const voteDeadline   = useSessionStore((s) => s.categoryVoteDeadline);
  const stageIndex     = useSessionStore((s) => s.categoryVoteStageIndex);
  const totalStages    = useSessionStore((s) => s.categoryVoteTotalStages);
  const snapshot       = useSessionStore((s) => s.snapshot);

  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);

  const { secondsLeft, progress } = useCountdown(voteDeadline, VOTE_SECONDS);

  const players = snapshot?.players ?? [];
  const selfPlayerId = snapshot?.selfPlayerId ?? '';

  function handleVote(packId: string) {
    if (categoryWinner) return;
    setSelectedPackId(packId);
    emitCategoryVote(packId);
  }

  // Vote count per pack
  const voteCounts: Record<string, string[]> = {};
  for (const [playerId, packId] of Object.entries(categoryVotes)) {
    if (!voteCounts[packId]) voteCounts[packId] = [];
    voteCounts[packId]!.push(playerId);
  }

  return (
    <div className="flex flex-1 flex-col p-5 gap-5">

      {/* Header */}
      <div className="flex flex-col items-center gap-1 animate-fade-up">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">
          Этап {stageIndex + 1} из {totalStages}
        </p>
        <p className="text-xl font-black text-white">Выберите категорию</p>
      </div>

      {/* Timer */}
      <div
        className="flex h-[148px] items-center justify-center animate-fade-up"
        style={{ animationDelay: '60ms' }}
      >
        {!categoryWinner ? (
          <CircularTimer progress={progress} secondsLeft={secondsLeft} />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="text-4xl">{categoryWinner.packEmoji}</span>
            <span className="text-sm font-black text-white">{categoryWinner.packTitle}</span>
            <span className="text-xs text-white/40">Голосование завершено</span>
          </div>
        )}
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {availablePacks.map((pack, i) => {
          const cfg = PACK_CONFIGS[i % PACK_CONFIGS.length]!;
          const voters = (voteCounts[pack.id] ?? [])
            .map((pid) => players.find((p) => p.playerId === pid) ?? null)
            .filter(Boolean) as Array<{ playerId: string; name: string; color: string; avatarUrl: string | null }>;

          return (
            <CategoryCard
              key={pack.id}
              pack={pack}
              cfg={cfg}
              voters={voters}
              isSelected={selectedPackId === pack.id}
              isWinner={categoryWinner?.packId === pack.id}
              isLoser={!!categoryWinner && categoryWinner.packId !== pack.id}
              animDelay={i * 80}
              onVote={() => handleVote(pack.id)}
              selfVoted={categoryVotes[selfPlayerId] === pack.id}
            />
          );
        })}
      </div>

      {/* Hint */}
      {!categoryWinner && !selectedPackId && (
        <p className="text-center text-xs text-white/25 animate-fade-up" style={{ animationDelay: '300ms' }}>
          Не успеете — категория выбирается случайно
        </p>
      )}
    </div>
  );
}

// ── Category card ────────────────────────────────────────────────
interface CardCfg {
  color: string;
  idleBg: string;
  selBg: string;
  glow: string;
  border: string;
}

interface CardProps {
  pack: PackOption;
  cfg: CardCfg;
  voters: Array<{ playerId: string; name: string; color: string; avatarUrl: string | null }>;
  isSelected: boolean;
  isWinner: boolean;
  isLoser: boolean;
  animDelay: number;
  selfVoted: boolean;
  onVote: () => void;
}

function CategoryCard({ pack, cfg, voters, isSelected, isWinner, isLoser, animDelay, selfVoted, onVote }: CardProps) {
  const isActive = isSelected || selfVoted;

  let background  = cfg.idleBg;
  let borderColor = 'rgba(255,255,255,0.08)';
  let boxShadow: string | undefined;
  let extraCls    = '';
  let opacity     = 1;

  if (isWinner) {
    background  = 'rgba(16,185,129,0.25)';
    borderColor = 'rgba(16,185,129,0.6)';
    boxShadow   = '0 0 32px rgba(16,185,129,0.5)';
    extraCls    = 'animate-correct';
  } else if (isLoser) {
    opacity = 0.35;
  } else if (isActive) {
    background  = cfg.selBg;
    borderColor = cfg.border;
    boxShadow   = cfg.glow;
  }

  return (
    <div
      className="animate-pop-in"
      style={{ animationDelay: `${animDelay}ms` }}
    >
      <button
        key={isActive && !isWinner && !isLoser ? `${pack.id}-sel` : pack.id}
        onClick={onVote}
        disabled={!!isWinner || !!isLoser}
        className={`w-full min-h-[140px] flex flex-col items-center gap-3 rounded-2xl p-4 text-center transition-all duration-150 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 ${extraCls} ${isActive && !isWinner && !isLoser ? 'animate-answer-bounce' : ''}`}
        style={{
          background,
          border: `1px solid ${borderColor}`,
          boxShadow,
          opacity,
        }}
      >
        {/* Emoji badge */}
        <span
          className="flex size-12 items-center justify-center rounded-2xl text-3xl"
          style={{
            backgroundColor: isWinner ? 'rgba(16,185,129,0.3)' : isActive ? `${cfg.color}25` : 'rgba(255,255,255,0.06)',
            boxShadow: isWinner ? '0 0 12px rgba(16,185,129,0.4)' : isActive ? `0 0 10px ${cfg.color}50` : undefined,
          }}
        >
          {pack.emoji}
        </span>

        {/* Title */}
        <div>
          <p className="text-sm font-black text-white leading-tight">{pack.title}</p>
          <p className="text-xs text-white/30 mt-0.5">{pack.questionCount} вопросов</p>
        </div>

        {/* Voter avatars */}
        <div className="flex justify-center min-h-[28px]">
          {voters.length > 0 ? (
            <div className="flex -space-x-2">
              {voters.slice(0, 5).map((v) => (
                <span
                  key={v.playerId}
                  className="flex size-7 items-center justify-center rounded-full text-sm ring-2"
                  style={{
                    backgroundColor: v.color,
                    '--tw-ring-color': 'rgba(15,10,30,1)',
                  } as React.CSSProperties}
                  title={v.name}
                >
                  {v.avatarUrl ?? '👤'}
                </span>
              ))}
              {voters.length > 5 && (
                <span
                  className="flex size-7 items-center justify-center rounded-full text-xs font-bold text-white ring-2"
                  style={{ backgroundColor: 'rgba(139,92,246,0.5)' }}
                >
                  +{voters.length - 5}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-white/15">—</span>
          )}
        </div>

        {/* Vote count badge */}
        {voters.length > 0 && (
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-bold"
            style={{
              background: isWinner ? 'rgba(16,185,129,0.25)' : isActive ? `${cfg.color}25` : 'rgba(255,255,255,0.08)',
              color: isWinner ? '#6ee7b7' : isActive ? cfg.color : 'rgba(255,255,255,0.5)',
            }}
          >
            {voters.length} {voters.length === 1 ? 'голос' : voters.length < 5 ? 'голоса' : 'голосов'}
          </span>
        )}
      </button>
    </div>
  );
}
