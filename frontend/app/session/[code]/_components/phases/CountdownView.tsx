'use client';

import { Zap } from 'lucide-react';
import { useSessionStore } from '@/stores/session.store';
import { useCountdown } from '@/hooks/useCountdown';
import { cn } from '@/lib/cn';

const COUNTDOWN_SECONDS = 3;

export function CountdownView() {
  const countdownDeadline = useSessionStore((s) => s.countdownDeadline);
  const { secondsLeft } = useCountdown(countdownDeadline, COUNTDOWN_SECONDS);

  const isUrgent = secondsLeft <= 1;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8">

      <div className="flex items-center gap-2 animate-fade-up">
        <Zap className="size-4 text-violet-400" />
        <p className="text-sm font-bold uppercase tracking-widest text-white/50">
          Get ready
        </p>
        <Zap className="size-4 text-violet-400" />
      </div>

      <div className="relative flex size-36 items-center justify-center animate-fade-up" style={{ animationDelay: '60ms' }}>
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 144 144">
          <circle
            cx="72" cy="72" r="62"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="8"
          />
          <circle
            cx="72" cy="72" r="62"
            fill="none"
            stroke={isUrgent ? '#ef4444' : '#8b5cf6'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 62}
            strokeDashoffset={2 * Math.PI * 62 * (1 - secondsLeft / COUNTDOWN_SECONDS)}
            className="transition-[stroke-dashoffset,stroke] duration-100"
            style={{ filter: `drop-shadow(0 0 10px ${isUrgent ? 'rgba(239,68,68,0.8)' : 'rgba(139,92,246,0.6)'})` }}
          />
        </svg>
        <span className={cn(
          'text-6xl font-black tabular-nums transition-colors duration-200',
          isUrgent ? 'text-red-400' : 'text-white',
        )}>
          {secondsLeft}
        </span>
      </div>

      <p className="animate-fade-up text-sm font-medium text-white/35" style={{ animationDelay: '120ms' }}>
        The game is about to start
      </p>
    </div>
  );
}
