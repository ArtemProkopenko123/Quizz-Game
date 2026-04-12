'use client';

import { useEffect, useCallback } from 'react';
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
} from '@/types/session.types';

/**
 * Manages the WebSocket lifecycle for a quiz session.
 *
 * - Connects on mount if credentials are present
 * - Emits `session:connect` with stored credentials
 * - Routes all server→client events into the Zustand store
 * - Disconnects on unmount
 */
export function useSession() {
  const credentials = useSessionStore((s) => s.credentials);
  const setSnapshot = useSessionStore((s) => s.setSnapshot);
  const updatePresence = useSessionStore((s) => s.updatePresence);
  const setSocketConnected = useSessionStore((s) => s.setSocketConnected);
  const setActiveQuestion = useSessionStore((s) => s.setActiveQuestion);
  const clearActiveQuestion = useSessionStore((s) => s.clearActiveQuestion);
  const setAnswerAccepted = useSessionStore((s) => s.setAnswerAccepted);
  const setAnswerRejected = useSessionStore((s) => s.setAnswerRejected);
  const setCountdownDeadline = useSessionStore((s) => s.setCountdownDeadline);
  const updateQuestionDeadline = useSessionStore((s) => s.updateQuestionDeadline);
  const setLastRoundResult = useSessionStore((s) => s.setLastRoundResult);
  const setGameResult = useSessionStore((s) => s.setGameResult);
  const setPhase = useSessionStore((s) => s.setPhase);

  // ── emit helpers ───────────────────────────────────────────────

  const emitReady = useCallback(
    (ready: boolean) => {
      if (!credentials) return;
      const event = ready ? 'player:ready' : 'player:not_ready';
      getSocket().emit(event, {
        sessionId: credentials.sessionId,
        playerId: credentials.playerId,
      });
    },
    [credentials],
  );

  const emitStartGame = useCallback(() => {
    if (!credentials) return;
    getSocket().emit('game:start', {
      sessionId: credentials.sessionId,
      playerId: credentials.playerId,
    });
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

  // ── connection lifecycle ───────────────────────────────────────

  useEffect(() => {
    if (!credentials) return;

    // Capture in closure so callbacks always have a non-null reference
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

    // ── Server → Client events ─────────────────────────────────

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
  ]);

  return { emitReady, emitStartGame, emitSubmitAnswer };
}
