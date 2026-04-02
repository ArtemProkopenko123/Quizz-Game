# Realtime Contract

## Goal

This document confirms the server-authoritative model for the quiz game MVP and defines the baseline lifecycle for realtime events between clients and the backend.

## Core Rules

- The backend is the only source of truth for match phase, timer state, accepted answers, score calculation, and player presence.
- Clients may render optimistic UI states such as "submitting..." or "reconnecting...", but they must always reconcile with the latest server snapshot.
- Clients never decide whether an answer is correct and never compute score deltas locally.
- The first valid answer from a player for a round is the only answer that can be accepted.
- Every state transition must be validated against the current match phase on the server.
- Reconnect must restore an existing player identity instead of creating a duplicate player record.

## Session Bootstrap

The initial session setup remains split across transport layers:

- `REST` creates a session, joins by code, uploads avatars, and returns stable identifiers such as `sessionId`, `playerId`, and a reconnect token.
- `WebSocket` is used for presence, lobby updates, game lifecycle events, round timing, answer submission, and score/result broadcasts.

This keeps identity and side-effect-heavy setup outside the socket handshake while reserving realtime transport for short-lived game state.

## Match Phases

The server controls a single phase machine for every session:

1. `lobby`
2. `countdown`
3. `question_open`
4. `question_closed`
5. `round_result`
6. `game_result`
7. `terminated`

Rules:

- Players may join or reconnect only while the session is active and not `terminated`.
- The host may start the game only from `lobby`.
- Answer submissions are accepted only during `question_open`.
- Once the round deadline is reached, the server moves to `question_closed`, finalizes scoring, then emits `round_result`.
- After the final round result, the server emits `game_result` and marks the match complete.

## Connection Model

### Client -> Server handshake intent

After connecting the socket, the client identifies itself with a stable payload:

```ts
type ConnectToSession = {
  sessionId: string;
  playerId: string;
  reconnectToken: string;
};
```

The server validates the identifiers, binds the current `socketId` to the existing player record, rejoins the socket room, and answers with a full session snapshot.

### Server -> Client snapshot response

Every successful connect or reconnect should return enough state for the client to render without guessing:

```ts
type SessionSnapshot = {
  sessionId: string;
  code: string;
  phase:
    | "lobby"
    | "countdown"
    | "question_open"
    | "question_closed"
    | "round_result"
    | "game_result"
    | "terminated";
  hostPlayerId: string;
  selfPlayerId: string;
  players: Array<{
    playerId: string;
    name: string;
    color: string;
    avatarUrl: string | null;
    isConnected: boolean;
    isReady: boolean;
    score: number;
  }>;
  currentRound: {
    index: number;
    total: number;
    deadlineAt: string | null;
    questionId: string | null;
    hasAnswered: boolean;
  } | null;
};
```

The client should treat this snapshot as authoritative and replace stale local room state with it.

## Event Lifecycle

### 1. Lobby presence

Client events:

- `session:connect`
- `player:ready`
- `player:not_ready`

Server events:

- `session:snapshot`
- `lobby:updated`
- `player:presence_changed`

Expected behavior:

- A connect or reconnect emits `session:snapshot`.
- Any player join, reconnect, disconnect, or ready-state change emits `lobby:updated`.
- Temporary disconnects update presence but do not remove the player from the session immediately.

### 2. Game start

Client events:

- `game:start`

Server events:

- `game:countdown_started`
- `question:started`

Expected behavior:

- Only the host can emit `game:start`.
- The server rejects duplicate start requests unless the phase is still `lobby`.
- The server may optionally emit a short countdown before opening the first question.

### 3. Question round

Client events:

- `answer:submit`

Server events:

- `answer:accepted`
- `answer:rejected`
- `question:closed`
- `round:result`

Expected behavior:

- `question:started` includes question content, answer options, round index, and `deadlineAt`.
- `answer:submit` contains `sessionId`, `playerId`, `questionId`, and `answerIndex`.
- The server accepts only the first valid submission from a player for the active question.
- Duplicate, late, or phase-invalid submissions are answered with `answer:rejected`.
- When the deadline expires, the server closes the round, scores it, and emits `round:result`.

### 4. Next round or finish

Server events:

- `question:started`
- `game:result`

Expected behavior:

- If more questions remain, the server opens the next round and emits a new `question:started`.
- If the last round is complete, the server emits `game:result` and moves the session into a completed state.

## Event Catalog

### Client -> Server

| Event | Purpose | Required fields | Allowed phase |
| --- | --- | --- | --- |
| `session:connect` | bind socket to existing player identity | `sessionId`, `playerId`, `reconnectToken` | any non-terminated phase |
| `player:ready` | mark player ready in lobby | `sessionId`, `playerId` | `lobby` |
| `player:not_ready` | unset readiness in lobby | `sessionId`, `playerId` | `lobby` |
| `game:start` | start the match as host | `sessionId`, `playerId` | `lobby` |
| `answer:submit` | submit first answer for active round | `sessionId`, `playerId`, `questionId`, `answerIndex` | `question_open` |

### Server -> Client

| Event | Purpose |
| --- | --- |
| `session:snapshot` | authoritative room state after connect/reconnect |
| `lobby:updated` | current player list, presence, readiness, host identity |
| `player:presence_changed` | lightweight presence update when a player disconnects/reconnects |
| `game:countdown_started` | optional pre-round countdown state |
| `question:started` | question payload with answer options and deadline |
| `answer:accepted` | confirms the first valid answer was stored |
| `answer:rejected` | explains why a submission was refused |
| `question:closed` | signals the answer window is over |
| `round:result` | correct answer, round scoring, cumulative leaderboard |
| `game:result` | final ranking and match completion state |

## Error Semantics

The backend should return typed error codes for invalid commands instead of generic failures.

Recommended baseline codes:

- `SESSION_NOT_FOUND`
- `PLAYER_NOT_FOUND`
- `RECONNECT_TOKEN_INVALID`
- `FORBIDDEN`
- `INVALID_PHASE`
- `ROUND_NOT_ACTIVE`
- `ANSWER_ALREADY_SUBMITTED`
- `ANSWER_DEADLINE_EXPIRED`
- `QUESTION_MISMATCH`
- `VALIDATION_ERROR`

`answer:rejected` and failed command acknowledgements should include at least:

```ts
type RealtimeError = {
  code:
    | "SESSION_NOT_FOUND"
    | "PLAYER_NOT_FOUND"
    | "RECONNECT_TOKEN_INVALID"
    | "FORBIDDEN"
    | "INVALID_PHASE"
    | "ROUND_NOT_ACTIVE"
    | "ANSWER_ALREADY_SUBMITTED"
    | "ANSWER_DEADLINE_EXPIRED"
    | "QUESTION_MISMATCH"
    | "VALIDATION_ERROR";
  message: string;
};
```

## Idempotency Requirements

- Repeating `session:connect` for the same valid player should refresh presence and return a fresh `session:snapshot`.
- Repeating `game:start` after the game has already left `lobby` must not restart the match.
- Repeating `answer:submit` after the first accepted answer must not overwrite the stored answer.

## MVP Acceptance For This Contract

This contract should be treated as confirmed when implementation follows these expectations:

- the frontend renders from `session:snapshot` and subsequent server broadcasts
- the backend owns all phase transitions and deadlines
- answer acceptance is single-shot per player per round
- reconnect restores the existing player state inside the same session
- every socket command is validated against the active phase and returns a typed error on rejection
