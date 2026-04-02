'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { useSessionStore } from '@/stores/session.store';

type Mode = 'pick' | 'create' | 'join';

const COLORS = [
  '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
];

const DEFAULT_PACK_ID = 'mvp-general-knowledge';

export function HomeForm() {
  const router = useRouter();
  const setCredentials = useSessionStore((s) => s.setCredentials);

  const [mode, setMode] = useState<Mode>('pick');
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0] ?? '#ef4444');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const canSubmit = name.trim().length > 0 && (mode === 'create' || joinCode.trim().length > 0);

  function handleCreate() {
    if (!canSubmit) return;
    setError('');

    startTransition(async () => {
      try {
        const creds = await api.createSession({
          hostName: name.trim(),
          hostColor: color,
          questionPackId: DEFAULT_PACK_ID,
        });
        setCredentials(creds);
        router.push(`/session/${creds.code}`);
      } catch {
        setError('Could not create game. Please try again.');
      }
    });
  }

  function handleJoin() {
    if (!canSubmit) return;
    setError('');

    startTransition(async () => {
      try {
        const creds = await api.joinSession(joinCode.trim().toUpperCase(), {
          playerName: name.trim(),
          playerColor: color,
        });
        setCredentials(creds);
        router.push(`/session/${creds.code}`);
      } catch {
        setError('Game not found or already started.');
      }
    });
  }

  if (mode === 'pick') {
    return (
      <div className="space-y-4">
        <Button className="w-full" size="lg" onClick={() => setMode('create')}>
          Create game
        </Button>
        <Button className="w-full" size="lg" variant="secondary" onClick={() => setMode('join')}>
          Join game
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        mode === 'create' ? handleCreate() : handleJoin();
      }}
    >
      {mode === 'join' && (
        <Input
          label="Game code"
          placeholder="ABC123"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          maxLength={8}
          autoFocus
        />
      )}

      <Input
        label="Your name"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={64}
        autoFocus={mode === 'create'}
      />

      <div className="space-y-1.5">
        <p className="text-sm font-medium text-zinc-700">Color</p>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="size-8 rounded-full transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
              style={{ backgroundColor: c, outline: color === c ? `3px solid ${c}` : undefined, outlineOffset: color === c ? '2px' : undefined }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3 pt-1">
        <Button
          type="button"
          variant="ghost"
          className="flex-1"
          onClick={() => setMode('pick')}
          disabled={isPending}
        >
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1"
          loading={isPending}
          disabled={!canSubmit}
        >
          {mode === 'create' ? 'Create' : 'Join'}
        </Button>
      </div>
    </form>
  );
}
