'use client';

import { useState, useEffect } from 'react';

interface CountdownResult {
  secondsLeft: number;
  /** 0–1, where 1 = full time remaining */
  progress: number;
  isExpired: boolean;
}

/**
 * Counts down to `deadlineAt` (ISO string).
 * Updates every 100 ms for smooth progress animation.
 */
export function useCountdown(
  deadlineAt: string | null,
  totalSeconds?: number,
): CountdownResult {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadlineAt) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [deadlineAt]);

  if (!deadlineAt) {
    return { secondsLeft: 0, progress: 0, isExpired: true };
  }

  const msLeft = Math.max(0, new Date(deadlineAt).getTime() - now);
  const secondsLeft = Math.ceil(msLeft / 1000);
  const total = totalSeconds ?? 20;
  const progress = total > 0 ? Math.min(1, msLeft / (total * 1000)) : 0;

  return { secondsLeft, progress, isExpired: msLeft === 0 };
}
