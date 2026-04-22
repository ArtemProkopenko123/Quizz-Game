'use client';

import { useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useSessionStore } from '@/stores/session.store';
import type {
  SessionSnapshot,
  CountdownStartedPayload,
  QuestionStartedPayload,
  AnswerAcceptedPayload,
  RoundResultPayload,
  GameResultPayload,
  AllAnsweredPayload,
  PresenceChangedPayload,
  CategoryVoteStartedPayload,
  CategoryVoteUpdatedPayload,
  CategorySelectedPayload,
  CategoryAllVotedPayload,
  SessionSettingsUpdatedPayload,
} from '@/types/session.types';

export function useSession() {
  const {
    credentials,
    setSnapshot,
    updatePresence,
    setSocketConnected,
    setActiveQuestion,
    clearActiveQuestion,
    setAnswerAccepted,
    setAnswerRejected,
    setCountdownDeadline,
    updateQuestionDeadline,
    setLastRoundResult,
    setGameResult,
    setPhase,
    setCategoryVoteStarted,
    updateCategoryVotes,
    setCategorySelected,
    updateCategoryVoteDeadline,
    updateSessionSettings,
  } = useSessionStore(
    useShallow((s) => ({
      credentials:              s.credentials,
      setSnapshot:              s.setSnapshot,
      updatePresence:           s.updatePresence,
      setSocketConnected:       s.setSocketConnected,
      setActiveQuestion:        s.setActiveQuestion,
      clearActiveQuestion:      s.clearActiveQuestion,
      setAnswerAccepted:        s.setAnswerAccepted,
      setAnswerRejected:        s.setAnswerRejected,
      setCountdownDeadline:     s.setCountdownDeadline,
      updateQuestionDeadline:   s.updateQuestionDeadline,
      setLastRoundResult:       s.setLastRoundResult,
      setGameResult:            s.setGameResult,
      setPhase:                 s.setPhase,
      setCategoryVoteStarted:   s.setCategoryVoteStarted,
      updateCategoryVotes:      s.updateCategoryVotes,
      setCategorySelected:      s.setCategorySelected,
      updateCategoryVoteDeadline: s.updateCategoryVoteDeadline,
      updateSessionSettings:    s.updateSessionSettings,
    })),
  );

  // ── emit helpers ───────────────────────────────────────────────

  const emitReady = useCallback(
    (ready: boolean) => {
      if (!credentials) return;
      const event = ready ? 'player:ready' : 'player:not_ready';
      getSocket().emit(event, { sessionId: credentials.sessionId, playerId: credentials.playerId });
    },
    [credentials],
  );

  const emitStartGame = useCallback(() => {
    if (!credentials) return;
    getSocket().emit('game:start', { sessionId: credentials.sessionId, playerId: credentials.playerId });
  }, [credentials]);

  const emitSubmitAnswer = useCallback(
    (questionId: string, answerIndex: number) => {
      if (!credentials) return;
      getSocket().emit('answer:submit', {
        sessionId: credentials.sessionId,
        playerId: credentials.playerId,
        questionId,
        answerIndex,
      });
    },
    [credentials],
  );

  const emitCategoryVote = useCallback(
    (packId: string) => {
      if (!credentials) return;
      getSocket().emit('category:vote', {
        sessionId: credentials.sessionId,
        playerId: credentials.playerId,
        packId,
      });
    },
    [credentials],
  );

  const emitUpdateSettings = useCallback(
    (settings: Partial<{ roundCount: number; questionsPerRound: number; questionDuration: number }>) => {
      if (!credentials) return;
      getSocket().emit('session:update_settings', {
        sessionId: credentials.sessionId,
        playerId: credentials.playerId,
        ...settings,
      });
    },
    [credentials],
  );

  // ── connection lifecycle ───────────────────────────────────────

  useEffect(() => {
    if (!credentials) return;

    const creds = credentials;
    const socket = getSocket();

    function onConnect() {
      setSocketConnected(true);
      socket.emit('session:connect', {
        sessionId: creds.sessionId,
        playerId: creds.playerId,
        reconnectToken: creds.reconnectToken,
      });
    }

    function onDisconnect() {
      setSocketConnected(false);
    }

    function onSessionSnapshot(payload: SessionSnapshot) {
      setSnapshot({ ...payload, selfPlayerId: creds.playerId });
    }

    function onLobbyUpdated(payload: SessionSnapshot) {
      setSnapshot({ ...payload, selfPlayerId: creds.playerId });
    }

    function onPresenceChanged(payload: PresenceChangedPayload) {
      updatePresence(payload);
    }

    function onCountdownStarted(payload: CountdownStartedPayload) {
      setPhase('countdown');
      setCountdownDeadline(payload.deadlineAt);
    }

    function onQuestionStarted(payload: QuestionStartedPayload) {
      setPhase('question_open');
      setActiveQuestion(payload);
    }

    function onQuestionClosed() {
      setPhase('question_closed');
      clearActiveQuestion();
    }

    function onAllAnswered(payload: AllAnsweredPayload) {
      updateQuestionDeadline(payload.newDeadlineAt);
    }

    function onAnswerAccepted(payload: AnswerAcceptedPayload) {
      setAnswerAccepted(payload.scoreDelta);
    }

    function onAnswerRejected() {
      setAnswerRejected();
    }

    function onRoundResult(payload: RoundResultPayload) {
      setPhase('round_result');
      setLastRoundResult(payload);
    }

    function onGameResult(payload: GameResultPayload) {
      setPhase('game_result');
      setGameResult(payload);
    }

    function onCategoryVoteStarted(payload: CategoryVoteStartedPayload) {
      setCategoryVoteStarted(payload);
    }

    function onCategoryVoteUpdated(payload: CategoryVoteUpdatedPayload) {
      updateCategoryVotes(payload);
    }

    function onCategorySelected(payload: CategorySelectedPayload) {
      setCategorySelected(payload);
      // Countdown starts right after — phase update comes with game:countdown_started
    }

    function onCategoryAllVoted(payload: CategoryAllVotedPayload) {
      updateCategoryVoteDeadline(payload);
    }

    function onSessionSettingsUpdated(payload: SessionSettingsUpdatedPayload) {
      updateSessionSettings(payload);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('session:snapshot', onSessionSnapshot);
    socket.on('lobby:updated', onLobbyUpdated);
    socket.on('player:presence_changed', onPresenceChanged);
    socket.on('game:countdown_started', onCountdownStarted);
    socket.on('question:started', onQuestionStarted);
    socket.on('question:closed', onQuestionClosed);
    socket.on('round:all_answered', onAllAnswered);
    socket.on('answer:accepted', onAnswerAccepted);
    socket.on('answer:rejected', onAnswerRejected);
    socket.on('round:result', onRoundResult);
    socket.on('game:result', onGameResult);
    socket.on('category:vote_started', onCategoryVoteStarted);
    socket.on('category:vote_updated', onCategoryVoteUpdated);
    socket.on('category:selected', onCategorySelected);
    socket.on('category:all_voted', onCategoryAllVoted);
    socket.on('session:settings_updated', onSessionSettingsUpdated);

    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('session:snapshot', onSessionSnapshot);
      socket.off('lobby:updated', onLobbyUpdated);
      socket.off('player:presence_changed', onPresenceChanged);
      socket.off('game:countdown_started', onCountdownStarted);
      socket.off('question:started', onQuestionStarted);
      socket.off('question:closed', onQuestionClosed);
      socket.off('round:all_answered', onAllAnswered);
      socket.off('answer:accepted', onAnswerAccepted);
      socket.off('answer:rejected', onAnswerRejected);
      socket.off('round:result', onRoundResult);
      socket.off('game:result', onGameResult);
      socket.off('category:vote_started', onCategoryVoteStarted);
      socket.off('category:vote_updated', onCategoryVoteUpdated);
      socket.off('category:selected', onCategorySelected);
      socket.off('category:all_voted', onCategoryAllVoted);
      socket.off('session:settings_updated', onSessionSettingsUpdated);

      disconnectSocket();
      setSocketConnected(false);
    };
  }, [
    credentials,
    setSnapshot,
    updatePresence,
    setSocketConnected,
    setCountdownDeadline,
    setActiveQuestion,
    clearActiveQuestion,
    setAnswerAccepted,
    setAnswerRejected,
    updateQuestionDeadline,
    setLastRoundResult,
    setGameResult,
    setPhase,
    setCategoryVoteStarted,
    updateCategoryVotes,
    setCategorySelected,
    updateCategoryVoteDeadline,
    updateSessionSettings,
  ]);

  return { emitReady, emitStartGame, emitSubmitAnswer, emitCategoryVote, emitUpdateSettings };
}
