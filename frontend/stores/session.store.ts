import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  SessionCredentials,
  SessionSnapshot,
  QuestionStartedPayload,
  RoundResultPayload,
  GameResultPayload,
  PresenceChangedPayload,
} from '@/types/session.types';

type AnswerStatus = 'idle' | 'accepted' | 'rejected';

interface SessionStore {
  // Persisted across page refresh
  credentials: SessionCredentials | null;

  // Live WS state
  snapshot: SessionSnapshot | null;
  isSocketConnected: boolean;

  // Countdown before first question
  countdownDeadline: string | null;

  // Active question round
  activeQuestion: QuestionStartedPayload | null;
  answerStatus: AnswerStatus;
  answerScoreDelta: number | null;

  // Results
  lastRoundResult: RoundResultPayload | null;
  gameResult: GameResultPayload | null;

  // Actions
  setCredentials: (creds: SessionCredentials) => void;
  setSnapshot: (snapshot: SessionSnapshot) => void;
  updatePresence: (payload: PresenceChangedPayload) => void;
  setSocketConnected: (connected: boolean) => void;
  setCountdownDeadline: (deadline: string) => void;
  setActiveQuestion: (question: QuestionStartedPayload) => void;
  clearActiveQuestion: () => void;
  setAnswerAccepted: (scoreDelta: number) => void;
  setAnswerRejected: () => void;
  setLastRoundResult: (result: RoundResultPayload) => void;
  setGameResult: (result: GameResultPayload) => void;
  clear: () => void;
}

const initialState = {
  snapshot: null,
  isSocketConnected: false,
  countdownDeadline: null as string | null,
  activeQuestion: null,
  answerStatus: 'idle' as AnswerStatus,
  answerScoreDelta: null,
  lastRoundResult: null,
  gameResult: null,
};

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      credentials: null,
      ...initialState,

      setCredentials: (credentials) => set({ credentials }),

      setSnapshot: (snapshot) => set({ snapshot }),

      updatePresence: ({ playerId, isConnected }) =>
        set((state) => {
          if (!state.snapshot) return {};
          return {
            snapshot: {
              ...state.snapshot,
              players: state.snapshot.players.map((p) =>
                p.playerId === playerId ? { ...p, isConnected } : p,
              ),
            },
          };
        }),

      setSocketConnected: (isSocketConnected) => set({ isSocketConnected }),

      setCountdownDeadline: (countdownDeadline) => set({ countdownDeadline }),

      setActiveQuestion: (activeQuestion) =>
        set({ activeQuestion, answerStatus: 'idle', answerScoreDelta: null }),

      clearActiveQuestion: () =>
        set({ activeQuestion: null }),

      setAnswerAccepted: (scoreDelta) =>
        set({ answerStatus: 'accepted', answerScoreDelta: scoreDelta }),

      setAnswerRejected: () =>
        set({ answerStatus: 'rejected' }),

      setLastRoundResult: (lastRoundResult) =>
        set({ lastRoundResult, activeQuestion: null }),

      setGameResult: (gameResult) => set({ gameResult }),

      clear: () => set({ credentials: null, ...initialState }),
    }),
    {
      name: 'quizz-session',
      storage: createJSONStorage(() => sessionStorage),
      // Only credentials survive a refresh; live state is restored from WS
      partialize: (state) => ({ credentials: state.credentials }),
    },
  ),
);
