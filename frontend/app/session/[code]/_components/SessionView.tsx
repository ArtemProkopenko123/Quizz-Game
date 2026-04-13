'use client';

import { useSessionStore } from '@/stores/session.store';
import { useSession } from '@/hooks/useSession';
import { LobbyView } from './phases/LobbyView';
import { CountdownView } from './phases/CountdownView';
import { QuestionView } from './phases/QuestionView';
import { GameResultView } from './phases/GameResultView';
import { CategoryVoteView } from './phases/CategoryVoteView';
import type { SessionPhase, SessionSettings } from '@/types/session.types';

interface Props {
  code: string;
}

export function SessionView({ code }: Props) {
  const { emitReady, emitStartGame, emitSubmitAnswer, emitCategoryVote, emitUpdateSettings } = useSession();

  const snapshot = useSessionStore((s) => s.snapshot);
  const isSocketConnected = useSessionStore((s) => s.isSocketConnected);
  const credentials = useSessionStore((s) => s.credentials);

  if (!credentials) {
    return <NotFound code={code} />;
  }

  if (!isSocketConnected || !snapshot) {
    return <Connecting />;
  }

  return (
    <PhaseRouter
      phase={snapshot.phase}
      emitReady={emitReady}
      emitStartGame={emitStartGame}
      emitSubmitAnswer={emitSubmitAnswer}
      emitCategoryVote={emitCategoryVote}
      emitUpdateSettings={emitUpdateSettings}
    />
  );
}

interface PhaseRouterProps {
  phase: SessionPhase;
  emitReady: (ready: boolean) => void;
  emitStartGame: () => void;
  emitSubmitAnswer: (questionId: string, answerIndex: number) => void;
  emitCategoryVote: (packId: string) => void;
  emitUpdateSettings: (patch: Partial<SessionSettings>) => void;
}

function PhaseRouter({
  phase,
  emitReady,
  emitStartGame,
  emitSubmitAnswer,
  emitCategoryVote,
  emitUpdateSettings,
}: PhaseRouterProps) {
  switch (phase) {
    case 'lobby':
      return (
        <LobbyView
          emitReady={emitReady}
          emitStartGame={emitStartGame}
          emitUpdateSettings={emitUpdateSettings}
        />
      );
    case 'category_vote':
      return <CategoryVoteView emitCategoryVote={emitCategoryVote} />;
    case 'countdown':
      return <CountdownView />;
    case 'question_open':
    case 'question_closed':
    case 'round_result':
      return <QuestionView emitSubmitAnswer={emitSubmitAnswer} />;
    case 'game_result':
      return <GameResultView />;
    case 'terminated':
      return <Placeholder label="Session ended" />;
  }
}

function Connecting() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <div className="size-10 animate-spin rounded-full border-4 border-zinc-200 border-t-violet-600" />
      <p className="text-sm text-zinc-500">Connecting...</p>
    </div>
  );
}

function NotFound({ code }: { code: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <p className="font-semibold text-zinc-900">Session not found</p>
      <p className="text-sm text-zinc-500">
        No credentials for game <span className="font-mono">{code}</span>.
      </p>
      <a href="/" className="mt-4 text-sm text-violet-600 underline underline-offset-2">
        Back to home
      </a>
    </div>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <p className="text-sm text-zinc-400">{label}</p>
    </div>
  );
}
