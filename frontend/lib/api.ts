import type { SessionCredentials } from '@/types/session.types';
import { getApiBaseUrl } from '@/lib/public-origin';

export interface PackInfo {
  id: string;
  title: string;
  emoji: string;
  questionCount: number;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export interface CreateSessionPayload {
  hostName: string;
  hostColor: string;
  hostAvatarUrl?: string;
  questionPackId?: string;
}

export interface JoinSessionPayload {
  playerName: string;
  playerColor: string;
  playerAvatarUrl?: string;
}

export const api = {
  listPacks: () =>
    request<PackInfo[]>('/sessions/packs'),

  createSession: (body: CreateSessionPayload) =>
    request<SessionCredentials>('/sessions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  joinSession: (code: string, body: JoinSessionPayload) =>
    request<SessionCredentials>(`/sessions/${code}/join`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
