'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useSessionStore } from '@/stores/session.store';

type Mode = 'pick' | 'create' | 'join';

const COLORS = [
  '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
];

const AVATARS = [
  '👤', '🐶', '🐱', '🐭', '🐹',
  '🐰', '🦊', '🐻', '🐼', '🐨',
  '🐯', '🦁', '🐮', '🐸', '🐙',
  '🦋', '🐧', '🦄',
];

const DEFAULT_PACK_ID = 'mvp-general-knowledge';

/* ── Dark-themed input ─────────────────────────────────────── */
function DarkInput({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-white/40">
        {label}
      </label>
      <input
        className="h-12 w-full rounded-xl border border-white/10 bg-white/8 px-4 text-base font-medium text-white placeholder:text-white/25 outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20"
        {...props}
      />
    </div>
  );
}

/* ── Dark-themed button ────────────────────────────────────── */
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  loading?: boolean;
}
function DarkButton({ variant = 'primary', loading, className = '', children, disabled, ...props }: BtnProps) {
  const base =
    'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-bold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-violet-400 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
  const variants = {
    primary:
      'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-900/40 hover:from-violet-500 hover:to-fuchsia-500 active:scale-[0.97]',
    ghost:
      'bg-white/8 text-white/70 ring-1 ring-white/12 hover:bg-white/14 hover:text-white active:scale-[0.97]',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={disabled ?? loading} {...props}>
      {loading ? (
        <>
          <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          {children}
        </>
      ) : children}
    </button>
  );
}

/* ── Main form ─────────────────────────────────────────────── */
interface HomeFormProps {
  initialCode?: string;
}

export function HomeForm({ initialCode }: HomeFormProps) {
  const router = useRouter();
  const setCredentials = useSessionStore((s) => s.setCredentials);

  const [mode, setMode] = useState<Mode>(initialCode ? 'join' : 'pick');
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0] ?? '#ef4444');
  const [avatar, setAvatar] = useState(AVATARS[0] ?? '👤');
  const [joinCode, setJoinCode] = useState(initialCode ?? '');
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
          hostAvatarUrl: avatar,
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
          playerAvatarUrl: avatar,
        });
        setCredentials(creds);
        router.push(`/session/${creds.code}`);
      } catch {
        setError('Game not found or already started.');
      }
    });
  }

  /* ── Pick mode ── */
  if (mode === 'pick') {
    return (
      <div className="space-y-3">
        <DarkButton onClick={() => setMode('create')}>
          <span className="text-lg">🎮</span> Create game
        </DarkButton>
        <DarkButton variant="ghost" onClick={() => setMode('join')}>
          <span className="text-lg">🔗</span> Join game
        </DarkButton>
      </div>
    );
  }

  /* ── Create / Join form ── */
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => { e.preventDefault(); mode === 'create' ? handleCreate() : handleJoin(); }}
    >
      {mode === 'join' && (
        <DarkInput
          label="Game code"
          placeholder="ABC123"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          maxLength={8}
          autoFocus={!initialCode}
        />
      )}

      <DarkInput
        label="Your name"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={64}
        autoFocus={mode === 'create' || !!initialCode}
      />

      {/* Color picker */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Color</p>
        <div className="flex gap-2.5">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="relative size-8 rounded-full transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
            >
              {color === c && (
                <span
                  className="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-offset-slate-900"
                  style={{ '--tw-ring-color': c } as React.CSSProperties}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Avatar picker */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Аватар</p>
        <div className="grid grid-cols-6 gap-1.5">
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAvatar(a)}
              className={`flex h-10 items-center justify-center rounded-xl text-xl transition-all duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 ${
                avatar === a
                  ? 'ring-2 ring-violet-500 bg-violet-500/20'
                  : 'bg-white/6 hover:bg-white/12'
              }`}
              aria-label={`Аватар ${a}`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm font-medium text-red-400">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => setMode('pick')}
          disabled={isPending}
          className="h-12 flex-1 rounded-xl text-sm font-semibold text-white/50 transition hover:text-white/80 disabled:opacity-50 cursor-pointer"
        >
          ← Back
        </button>
        <DarkButton
          type="submit"
          className="flex-[2]"
          loading={isPending}
          disabled={!canSubmit}
        >
          {mode === 'create' ? 'Create game' : 'Join game'}
        </DarkButton>
      </div>
    </form>
  );
}
