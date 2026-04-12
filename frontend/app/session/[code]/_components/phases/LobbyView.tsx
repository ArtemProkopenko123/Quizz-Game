'use client';

import { useState } from 'react';
import { useSessionStore } from '@/stores/session.store';
import type { PlayerSnapshot } from '@/types/session.types';

interface Props {
  emitReady: (ready: boolean) => void;
  emitStartGame: () => void;
}

export function LobbyView({ emitReady, emitStartGame }: Props) {
  const snapshot = useSessionStore((s) => s.snapshot)!;
  const { players, hostPlayerId, selfPlayerId, code } = snapshot;

  const self    = players.find((p) => p.playerId === selfPlayerId);
  const isHost  = selfPlayerId === hostPlayerId;
  const isReady = self?.isReady ?? false;

  const readyCount = players.filter((p) => p.isReady).length;

  return (
    <div className="flex flex-1 flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">Лобби</p>
          <p className="mt-0.5 text-sm font-semibold text-white/60">
            {readyCount}/{players.length} готовы
          </p>
        </div>
        <CodeBadge code={code} />
      </header>

      {/* Player list */}
      <ul className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
        {players.map((player) => (
          <PlayerCard
            key={player.playerId}
            player={player}
            isHost={player.playerId === hostPlayerId}
            isSelf={player.playerId === selfPlayerId}
          />
        ))}
      </ul>

      {/* Footer */}
      <footer className="space-y-3 p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button
          onClick={() => emitReady(!isReady)}
          className={`inline-flex h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl text-base font-bold transition-all duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-violet-400 focus-visible:outline-offset-2 ${
            isReady
              ? 'text-white/60'
              : 'text-white shadow-lg shadow-violet-900/40'
          }`}
          style={{
            background: isReady
              ? 'rgba(255,255,255,0.08)'
              : 'linear-gradient(135deg, #7c3aed, #a855f7)',
            border: isReady ? '1px solid rgba(255,255,255,0.1)' : 'none',
          }}
        >
          {isReady ? '✓ Готов' : 'Готов!'}
        </button>

        {isHost && (
          <button
            onClick={emitStartGame}
            className="inline-flex h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl text-base font-bold text-white shadow-lg shadow-fuchsia-900/40 transition-all duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-violet-400 focus-visible:outline-offset-2"
            style={{ background: 'linear-gradient(135deg, #db2777, #9333ea)' }}
          >
            🚀 Начать игру
          </button>
        )}
      </footer>
    </div>
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
      className="flex cursor-pointer items-center gap-2.5 rounded-xl px-4 py-2 transition-all active:scale-95"
      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
    >
      <span className="font-mono text-base font-black tracking-[0.2em] text-white">
        {code}
      </span>
      <span className="text-xs font-medium text-white/40">
        {copied ? '✓' : '⎘'}
      </span>
    </button>
  );
}

// ── PlayerCard ───────────────────────────────────────────────
function PlayerCard({ player, isHost, isSelf }: { player: PlayerSnapshot; isHost: boolean; isSelf: boolean }) {
  return (
    <li
      className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5 animate-fade-up"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Avatar */}
      <span
        className="size-10 shrink-0 rounded-full ring-2 ring-white/15"
        style={{ backgroundColor: player.color }}
      />

      {/* Name + badges */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-sm font-bold text-white">
          {player.name}
          {isSelf && <span className="ml-1.5 text-xs font-normal text-white/35">(вы)</span>}
        </span>
        <div className="flex items-center gap-1.5">
          {isHost && (
            <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-300" style={{ background: 'rgba(139,92,246,0.2)' }}>
              Хост
            </span>
          )}
          {player.isReady && (
            <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300" style={{ background: 'rgba(16,185,129,0.2)' }}>
              Готов
            </span>
          )}
        </div>
      </div>

      {/* Online dot */}
      <span
        className={`size-2.5 shrink-0 rounded-full ${player.isConnected ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-white/20'}`}
      />
    </li>
  );
}
