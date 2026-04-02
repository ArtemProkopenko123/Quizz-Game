'use client';

import { useSessionStore } from '@/stores/session.store';
import { useCountdown } from '@/hooks/useCountdown';

const COUNTDOWN_SECONDS = 3;

export function CountdownView() {
  const countdownDeadline = useSessionStore((s) => s.countdownDeadline);
  const { secondsLeft } = useCountdown(countdownDeadline, COUNTDOWN_SECONDS);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <p className="text-sm font-medium uppercase tracking-widest text-zinc-400">
        Get ready
      </p>

      <div className="relative flex size-32 items-center justify-center">
        {/* Ring */}
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="#e4e4e7"
            strokeWidth="8"
          />
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="#7c3aed"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 54}
            strokeDashoffset={2 * Math.PI * 54 * (1 - secondsLeft / COUNTDOWN_SECONDS)}
            className="transition-[stroke-dashoffset] duration-100"
          />
        </svg>
        <span className="text-5xl font-bold tabular-nums text-zinc-900">
          {secondsLeft}
        </span>
      </div>

      <p className="text-zinc-500">The game is about to start</p>
    </div>
  );
}
