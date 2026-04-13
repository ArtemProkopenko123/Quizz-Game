import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  SessionCredentials,
  SessionSnapshot,
  SessionSettings,
  PackOption,
  QuestionStartedPayload,
  RoundResultPayload,
  GameResultPayload,
  PresenceChangedPayload,
  CategoryVoteStartedPayload,
  CategoryVoteUpdatedPayload,
  CategorySelectedPayload,
  SessionSettingsUpdatedPayload,
  CategoryAllVotedPayload,
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

  // Category vote state
  categoryVoteDeadline: string | null;
  categoryVotes: Record<string, string>; // playerId → packId
  availablePacks: PackOption[];
  categoryVoteStageIndex: number;
  categoryVoteTotalStages: number;
  /** Pack chosen by vote — shown during dramatic reveal then cleared */
  categoryWinner: CategorySelectedPayload | null;

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
  updateQuestionDeadline: (deadlineAt: string) => void;
  setLastRoundResult: (result: RoundResultPayload) => void;
  setGameResult: (result: GameResultPayload) => void;
  setPhase: (phase: SessionSnapshot['phase']) => void;
  setCategoryVoteStarted: (payload: CategoryVoteStartedPayload) => void;
  updateCategoryVotes: (payload: CategoryVoteUpdatedPayload) => void;
  setCategorySelected: (payload: CategorySelectedPayload) => void;
  updateCategoryVoteDeadline: (payload: CategoryAllVotedPayload) => void;
  updateSessionSettings: (payload: SessionSettingsUpdatedPayload) => void;
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
  categoryVoteDeadline: null as string | null,
  categoryVotes: {} as Record<string, string>,
  availablePacks: [] as PackOption[],
  categoryVoteStageIndex: 0,
  categoryVoteTotalStages: 0,
  categoryWinner: null as CategorySelectedPayload | null,
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

      clearActiveQuestion: () => set({ activeQuestion: null }),

      setAnswerAccepted: (scoreDelta) =>
        set({ answerStatus: 'accepted', answerScoreDelta: scoreDelta }),

      setAnswerRejected: () => set({ answerStatus: 'rejected' }),

      updateQuestionDeadline: (deadlineAt) =>
        set((state) =>
          state.activeQuestion
            ? { activeQuestion: { ...state.activeQuestion, deadlineAt } }
            : {},
        ),

      setLastRoundResult: (lastRoundResult) =>
        set((state) => {
          const scoreMap = new Map(
            lastRoundResult.scores.map((s) => [s.playerId, s.totalScore]),
          );
          const updatedSnapshot = state.snapshot
            ? {
                ...state.snapshot,
                players: state.snapshot.players.map((p) => ({
                  ...p,
                  score: scoreMap.get(p.playerId) ?? p.score,
                })),
              }
            : null;
          return { lastRoundResult, snapshot: updatedSnapshot };
        }),

      setGameResult: (gameResult) => set({ gameResult }),

      setPhase: (phase) =>
        set((state) =>
          state.snapshot ? { snapshot: { ...state.snapshot, phase } } : {},
        ),

      setCategoryVoteStarted: ({ deadlineAt, availablePacks, stageIndex, totalStages }) =>
        set((state) => ({
          categoryVoteDeadline: deadlineAt,
          availablePacks,
          categoryVotes: {},
          categoryVoteStageIndex: stageIndex,
          categoryVoteTotalStages: totalStages,
          categoryWinner: null,
          snapshot: state.snapshot ? { ...state.snapshot, phase: 'category_vote' } : null,
        })),

      updateCategoryVotes: ({ votes }) =>
        set({ categoryVotes: votes }),

      setCategorySelected: (payload) =>
        set({ categoryWinner: payload }),

      updateCategoryVoteDeadline: ({ newDeadlineAt }) =>
        set({ categoryVoteDeadline: newDeadlineAt }),

      updateSessionSettings: (settings: SessionSettingsUpdatedPayload) =>
        set((state) => ({
          snapshot: state.snapshot
            ? { ...state.snapshot, settings: settings as SessionSettings }
            : null,
        })),

      clear: () => set({ credentials: null, ...initialState }),
    }),
    {
      name: 'quizz-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ credentials: state.credentials }),
    },
  ),
);
