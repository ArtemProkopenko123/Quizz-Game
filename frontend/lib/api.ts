import type { SessionCredentials } from '@/types/session.types';

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
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
  questionPackId: string;
}

export interface JoinSessionPayload {
  playerName: string;
  playerColor: string;
}

export const api = {
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
