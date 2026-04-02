'use client';

import { useState } from 'react';
import { useSessionStore } from '@/stores/session.store';
import { Button } from '@/components/ui/Button';
import type { PlayerSnapshot } from '@/types/session.types';

interface Props {
  emitReady: (ready: boolean) => void;
  emitStartGame: () => void;
}

export function LobbyView({ emitReady, emitStartGame }: Props) {
  const snapshot = useSessionStore((s) => s.snapshot)!;
  const { players, hostPlayerId, selfPlayerId, code } = snapshot;

  const self = players.find((p) => p.playerId === selfPlayerId);
  const isHost = selfPlayerId === hostPlayerId;
  const isReady = self?.isReady ?? false;

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
        <span className="text-sm text-zinc-500">Lobby</span>
        <CodeBadge code={code} />
      </header>

      {/* Player list */}
      <ul className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        {players.map((player) => (
          <PlayerCard
            key={player.playerId}
            player={player}
            isHost={player.playerId === hostPlayerId}
            isSelf={player.playerId === selfPlayerId}
          />
        ))}
      </ul>

      {/* Footer actions */}
      <footer className="space-y-3 border-t border-zinc-200 bg-white p-4">
        <Button
          className="w-full"
          variant={isReady ? 'secondary' : 'primary'}
          onClick={() => emitReady(!isReady)}
        >
          {isReady ? '✓ Ready' : 'Mark ready'}
        </Button>

        {isHost && (
          <Button
            className="w-full"
            variant="primary"
            onClick={emitStartGame}
          >
            Start game
          </Button>
        )}
      </footer>
    </div>
  );
}

// ── CodeBadge ─────────────────────────────────────────────────────

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
      className="flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-1.5 transition-colors hover:bg-zinc-200 active:bg-zinc-300"
    >
      <span className="font-mono text-sm font-semibold tracking-widest text-zinc-900">
        {code}
      </span>
      <span className="text-xs text-zinc-500">{copied ? 'Copied!' : 'Copy'}</span>
    </button>
  );
}

// ── PlayerCard ────────────────────────────────────────────────────

function PlayerCard({
  player,
  isHost,
  isSelf,
}: {
  player: PlayerSnapshot;
  isHost: boolean;
  isSelf: boolean;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-xs ring-1 ring-zinc-200">
      {/* Color dot */}
      <span
        className="size-9 shrink-0 rounded-full"
        style={{ backgroundColor: player.color }}
      />

      {/* Name + badges */}
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <span className="truncate text-sm font-semibold text-zinc-900">
          {player.name}
          {isSelf && <span className="ml-1.5 text-xs font-normal text-zinc-400">(you)</span>}
        </span>
        <div className="flex items-center gap-1.5">
          {isHost && (
            <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
              Host
            </span>
          )}
          {player.isReady && (
            <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
              Ready
            </span>
          )}
        </div>
      </div>

      {/* Connection indicator */}
      <span
        className={`size-2 shrink-0 rounded-full ${
          player.isConnected ? 'bg-green-400' : 'bg-zinc-300'
        }`}
        title={player.isConnected ? 'Online' : 'Offline'}
      />
    </li>
  );
}
