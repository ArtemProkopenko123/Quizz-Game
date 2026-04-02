# Question Source

## Decision

The first question source for the MVP is versioned `JSON` seed files committed to the repository.

An import UI is intentionally deferred until after the playable MVP is stable.

## Why This Is The Right First Step

- It matches the current MVP boundary: gameplay needs predefined questions, but in-app question management is explicitly out of scope.
- It keeps the first implementation small and testable while the team focuses on session flow, realtime lifecycle, scoring, and reconnect behavior.
- It gives product and engineering a reviewable artifact in pull requests instead of hiding question changes behind a temporary admin screen.
- It works well for local setup, seeded environments, and deterministic automated tests.

## Initial Repository Contract

Question packs should live under `data/question-packs/`.

Each pack should be a single JSON file with:

- stable pack metadata
- an ordered list of questions
- exactly four answer options per question
- a single server-readable correct answer index

Recommended shape:

```json
{
  "id": "mvp-general-knowledge",
  "title": "MVP General Knowledge",
  "version": 1,
  "language": "en",
  "questions": [
    {
      "id": "q-001",
      "prompt": "Which planet is known as the Red Planet?",
      "options": ["Earth", "Mars", "Jupiter", "Venus"],
      "correctAnswerIndex": 1
    }
  ]
}
```

## Guardrails

- Files must be treated as backend-owned content. Clients only receive the active question payload, never the full pack with answer keys.
- Question IDs should stay stable once used so results, telemetry, and bug reports can reference them reliably.
- Validation should reject malformed packs, duplicate question IDs, fewer or more than four options, and invalid `correctAnswerIndex` values.
- The backend should load packs from disk or seed them into persistence; the client must not be the source of truth for question content.

## Deferred Work

The first admin/import UI can be added later if question authoring becomes a bottleneck. When that happens, the UI should still output or validate against the same backend question-pack contract instead of inventing a second format.
