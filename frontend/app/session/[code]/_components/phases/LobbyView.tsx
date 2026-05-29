'use client';

import { useState } from 'react';
import { Settings2, Share2, Copy, Check, Zap, Users, Clock, Hash, Rocket, CheckCircle2, Circle } from 'lucide-react';
import { useSessionStore } from '@/stores/session.store';
import { SettingsModal } from '../SettingsModal';
import { cn } from '@/lib/cn';
import type { PlayerSnapshot, SessionSettings } from '@/types/session.types';

interface Props {
  emitReady: (ready: boolean) => void;
  emitStartGame: () => void;
  emitUpdateSettings: (patch: Partial<SessionSettings>) => void;
}

export function LobbyView({ emitReady, emitStartGame, emitUpdateSettings }: Props) {
  const snapshot = useSessionStore((s) => s.snapshot)!;
  const { players, hostPlayerId, selfPlayerId, code, settings } = snapshot;

  const self    = players.find((p) => p.playerId === selfPlayerId);
  const isHost  = selfPlayerId === hostPlayerId;
  const isReady = self?.isReady ?? false;

  const readyCount = players.filter((p) => p.isReady).length;

  const [showSettings, setShowSettings] = useState(false);

  const MAX_ROUNDS = 5;

  return (
    <div className="flex flex-1 flex-col lg:flex-row">

      {/* ── Left panel (or top on mobile) ── */}
      <div className="flex flex-col lg:w-80 xl:w-96 lg:border-r lg:border-white/7">

        {/* Header */}
        <header className="flex items-center justify-between px-5 py-4 border-b border-white/7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">Lobby</p>
            <p className="mt-0.5 text-sm font-semibold text-white/60">
              {readyCount}/{players.length} ready
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isHost && (
              <IconButton onClick={() => setShowSettings(true)} title="Game settings">
                <Settings2 className="size-4.5 text-white/70" />
              </IconButton>
            )}
            {isHost && <ShareButton code={code} />}
            <CodeBadge code={code} />
          </div>
        </header>

        {/* Settings badges */}
        <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-white/7">
          <SettingBadge icon={<Hash className="size-3.5" />} label={`${settings.roundCount} ${settings.roundCount === 1 ? 'round' : 'rounds'}`} />
          <SettingBadge icon={<Zap className="size-3.5" />} label={`${settings.questionsPerRound} questions`} />
          <SettingBadge icon={<Clock className="size-3.5" />} label={`${settings.questionDuration}s`} />
        </div>

        {/* Player list */}
        <ul className="flex flex-1 flex-col gap-2 overflow-y-auto p-4 lg:max-h-[calc(100vh-280px)]">
          {players.map((player) => (
            <PlayerCard
              key={player.playerId}
              player={player}
              isHost={player.playerId === hostPlayerId}
              isSelf={player.playerId === selfPlayerId}
            />
          ))}
        </ul>
      </div>

      {/* ── Right panel / bottom on mobile ── */}
      <div className="flex flex-1 flex-col">

        {/* Desktop: waiting area with big room code */}
        <div className="hidden lg:flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="flex size-20 items-center justify-center rounded-3xl bg-violet-600/20 ring-1 ring-violet-500/30">
            <Users className="size-10 text-violet-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">Waiting for players</p>
            <p className="mt-1 text-sm text-white/40">Share the code below so friends can join</p>
          </div>
          <div className="rounded-2xl bg-white/6 px-8 py-5 ring-1 ring-white/10">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-2">Room code</p>
            <p className="font-mono text-5xl font-black tracking-[0.3em] text-white">{code}</p>
          </div>
          <p className="text-xs text-white/25">
            {readyCount < players.length
              ? `Waiting for ${players.length - readyCount} more player${players.length - readyCount !== 1 ? 's' : ''} to ready up`
              : 'All players ready!'}
          </p>
        </div>

        {/* Footer with action buttons */}
        <footer className="space-y-3 p-4 border-t border-white/7">
          <button
            onClick={() => emitReady(!isReady)}
            className={cn(
              'inline-flex h-13 w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl text-base font-bold transition-all duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-violet-400 focus-visible:outline-offset-2',
              isReady
                ? 'bg-white/8 text-white/60 ring-1 ring-white/10'
                : 'bg-linear-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-900/40',
            )}
          >
            {isReady
              ? <><CheckCircle2 className="size-5" /> Ready</>
              : <><Circle className="size-5" /> Ready!</>
            }
          </button>

          {isHost && (
            <button
              onClick={emitStartGame}
              className="inline-flex h-13 w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl text-base font-bold text-white shadow-lg shadow-fuchsia-900/40 transition-all duration-150 active:scale-[0.97] bg-linear-to-r from-pink-600 to-purple-600 focus-visible:outline-2 focus-visible:outline-violet-400 focus-visible:outline-offset-2"
            >
              <Rocket className="size-5" /> Start game
            </button>
          )}
        </footer>
      </div>

      {showSettings && (
        <SettingsModal
          settings={settings}
          maxRounds={MAX_ROUNDS}
          onSave={emitUpdateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

// ── IconButton ───────────────────────────────────────────────
function IconButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="flex size-10 cursor-pointer items-center justify-center rounded-xl bg-white/8 ring-1 ring-white/12 transition-all hover:bg-white/14 active:scale-90"
      {...props}
    >
      {children}
    </button>
  );
}

// ── SettingBadge ─────────────────────────────────────────────
function SettingBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/6 px-2.5 py-1 text-xs font-semibold text-white/40">
      {icon}
      {label}
    </span>
  );
}

// ── CodeBadge ────────────────────────────────────────────────
function CodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex cursor-pointer items-center gap-2 rounded-xl bg-white/8 px-3.5 py-2 ring-1 ring-white/12 transition-all hover:bg-white/14 active:scale-95"
    >
      <span className="font-mono text-sm font-black tracking-[0.2em] text-white">
        {code}
      </span>
      {copied
        ? <Check className="size-3.5 text-emerald-400" />
        : <Copy className="size-3.5 text-white/40" />
      }
    </button>
  );
}

// ── ShareButton ──────────────────────────────────────────────
function ShareButton({ code }: { code: string }) {
  const [done, setDone] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/join/${code}`;
    const shareData = { title: 'Join the QUIZZ game!', text: `Code: ${code}`, url };

    if (navigator.share && navigator.canShare?.(shareData)) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    }
  }

  return (
    <IconButton onClick={handleShare} title="Share link">
      {done
        ? <Check className="size-4.5 text-emerald-400" />
        : <Share2 className="size-4.5 text-white/70" />
      }
    </IconButton>
  );
}

// ── PlayerCard ───────────────────────────────────────────────
function PlayerCard({ player, isHost, isSelf }: { player: PlayerSnapshot; isHost: boolean; isSelf: boolean }) {
  return (
    <li className="flex items-center gap-3.5 rounded-2xl bg-white/6 px-4 py-3.5 ring-1 ring-white/8 animate-fade-up">
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-xl ring-2 ring-white/15"
        style={{ backgroundColor: player.color }}
      >
        {player.avatarUrl ?? '👤'}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-sm font-bold text-white">
          {player.name}
          {isSelf && <span className="ml-1.5 text-xs font-normal text-white/35">(you)</span>}
        </span>
        <div className="flex items-center gap-1.5">
          {isHost && (
            <span className="rounded-md bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-300">
              Host
            </span>
          )}
          {player.isReady && (
            <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              Ready
            </span>
          )}
        </div>
      </div>

      <span
        className={cn(
          'size-2.5 shrink-0 rounded-full',
          player.isConnected
            ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
            : 'bg-white/20',
        )}
      />
    </li>
  );
}
