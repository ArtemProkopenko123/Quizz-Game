# Quizz Game MVP

## Confirmed Stack

The MVP stack is confirmed as:

- `frontend`: `Next.js`
- `backend`: `NestJS`
- `database`: `PostgreSQL`
- `realtime/cache`: `Redis`
- `file storage`: `S3-compatible storage`

## Why This Stack

- `Next.js` gives a fast path to a mobile-friendly frontend and leaves room for future SSR pages or an admin surface.
- `NestJS` fits a modular backend with clear boundaries for sessions, players, gameplay, and realtime events.
- `PostgreSQL` is the source of truth for persistent game data.
- `Redis` is the right place for short-lived session and round state, presence, and leaderboard updates.
- `S3-compatible storage` keeps avatar uploads separate from app and database concerns.

## Scope

This repository will follow a split architecture:

- `frontend` app for player and host UI
- `backend` app for REST and realtime game orchestration
- persistent data in `PostgreSQL`
- active room state in `Redis`
- media assets in `S3-compatible storage`

The confirmed server-authoritative websocket lifecycle and baseline event contract are documented in `docs/realtime-contract.md`.

The confirmed MVP host-flow decision is documented in `docs/host-flow.md`.

## Confirmed Question Source

The first question source for the MVP is confirmed as versioned `JSON` seed files stored in the repository, not a separate import UI.

This choice keeps question delivery simple, reviewable, and easy to seed in local/dev environments while the core join, lobby, gameplay, scoring, and reconnect flows are being built.

The follow-up contract for question pack storage and the initial sample pack live in:

- `docs/question-source.md`
- `data/question-packs/mvp-sample.json`

## Confirmed MVP Boundaries

The first playable release is explicitly limited to the features below. Anything not listed here should be treated as out of scope until the MVP is complete.

### Included In MVP

- `join-code`: a host can create a session and receive a short code that players enter to join the same room
- `host-flow`: the host uses the same core mobile app flow as players and can start the game from the lobby without a separate presenter screen
- `lobby`: joined players appear in a shared lobby before the game starts
- `avatar`: each player can capture or upload a profile image for the match
- `color`: each player selects a color identity visible in the lobby and score views
- `questions`: the match runs through a predefined set of multiple-choice questions
- `timer`: each question has a server-driven answer deadline
- `scoring`: the server validates answers, accepts only the first valid submission per player, and updates scores
- `results`: players see round scores and a final ranking after the last question
- `reconnect`: a player who temporarily disconnects can return to the active session without creating a duplicate participant

### MVP Done Criteria

The MVP scope should be considered complete only when all of the following are true:

- a player can join an existing session by code from a phone browser
- lobby state shows the current participant list before the host starts the game
- player identity for the match includes `name`, `avatar`, and `color`
- questions are delivered in order with four answer options
- the timer is authoritative on the server and the client only renders remaining time
- score calculation happens on the server, not in the client UI
- duplicate answer submissions are rejected safely
- final results are shown after the last round
- reconnect restores the player to the active room within the same session instead of creating a second player record

### Not In MVP

- account registration or persistent user profiles
- advanced roles beyond `host` and `player`
- a dedicated presenter or host-only screen
- in-app question management or admin tooling
- chat, power-ups, voice features, or rich social mechanics
- client-authoritative timers or client-side score calculation
- large-scale optimization work beyond supporting a single room of roughly `10-20` players
