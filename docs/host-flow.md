# Host Flow

## Decision

The first MVP will **not** ship a separate presenter or host-only screen.

The host uses the same main mobile web application as every other participant, with one extra capability: starting the game from the lobby.

## Why This Is The Right First Step

- It keeps the first playable version focused on the core multiplayer loop instead of splitting effort across two different UI surfaces.
- It matches the confirmed realtime contract, where host-specific behavior is currently limited to ownership of `game:start`.
- It reduces implementation and testing scope for lobby, reconnect, round progression, and score/result rendering.
- It avoids introducing a second room-view state model before the server-authoritative session lifecycle is proven.

## MVP Product Contract

For the first version:

- the host can create a session and receive the join code
- the host sees the same lobby/player/question/result screens as other players
- the host can trigger `game:start` while in `lobby`
- all round timing, scoring, and progression still come from the backend

## Explicitly Deferred

The following are intentionally postponed until after the first playable MVP:

- a dedicated presenter display for showing the join code, question, timer, or leaderboard on a separate screen
- a second host-only route with controls distinct from the player flow
- special presenter UX optimized for TVs, tablets, or desktop projection

## Follow-up Trigger

A separate host screen should be reconsidered only if one of these becomes true:

- playtests show the host should moderate without answering as a player
- the team needs a shared large-screen presentation view for in-person sessions
- host controls become more complex than `create session` and `start game`
