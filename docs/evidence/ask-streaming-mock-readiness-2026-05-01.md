# Ask Streaming Mock Readiness Evidence

Generated at: 2026-05-01T08:36:00+09:00
Generated from: local worktree
Check type: `/api/ask` mock SSE stream readiness
Result: partial pass

This evidence records the first server-side RAG answer streaming boundary.
It intentionally uses a mock answer provider and does not call Claude.

## Official API Context Checked

Anthropic Messages streaming docs state that `stream: true` returns server-sent events and that streams can include `message_start`, `content_block_delta`, `message_delta`, `message_stop`, `ping`, and `error` events. The docs also state that unknown event types may be added and should be handled gracefully.

Design decision:

- The Worker must not forward raw Anthropic SSE events directly to the frontend.
- Provider events should be normalized server-side into project-owned RAG stream events before the UI handles them.

## Scope

Added files:

- `src/worker/rag-stream.ts`
- `src/worker/search-request.ts`
- `tests/worker/rag-stream.test.ts`
- `tests/worker/ask.test.ts`

Updated files:

- `src/worker/app.ts`
- `src/client/App.tsx`
- `src/client/ask-api.ts`
- `tests/client/ask-api.test.ts`
- `tests/e2e/top-page.spec.ts`
- `tests/evidence/ui-screenshots.spec.ts`

Removed files:

- `src/client/mock-answer-stream.ts`
- `tests/client/mock-answer-stream.test.ts`

## Behavior

`POST /api/ask`:

- requires the same access key guard as `POST /api/search`;
- validates the same request shape as search;
- runs the current search provider boundary;
- returns `text/event-stream`;
- emits project-owned events:
  - `retrieval_start`
  - `sources`
  - `generation_start`
  - `answer_delta`
  - `no_answer`
  - `source_validation_failed`
  - `done`

Mock-only limits:

- It does not call Claude.
- It does not parse Anthropic raw SSE.
- It does not prove production streaming behavior.
- It does not make provider mode the default.

## Client Integration

The browser UI now reads `/api/ask` as an SSE stream instead of generating answer deltas from a client-only mock helper.

Client-side behavior:

- `src/client/ask-api.ts` parses `text/event-stream` frames.
- The UI updates answer text from `answer_delta` events.
- The UI updates source cards from `sources` events.
- `source_validation_failed` is displayed as a non-answer state.
- The access key remains in React state and is not stored in localStorage or sessionStorage.

## Verification Commands

```bash
corepack pnpm run typecheck
corepack pnpm vitest run tests/worker/rag-stream.test.ts tests/worker/ask.test.ts tests/worker/search.test.ts
corepack pnpm vitest run tests/client/ask-api.test.ts
corepack pnpm run test:e2e
```

Result:

- `typecheck`: pass
- targeted tests: pass, 3 files / 13 tests
- client SSE parser tests: pass
- E2E tests: pass, 5 tests

## Known Limitations

- `/api/ask` currently produces mock answer deltas from retrieved source cards.
- Claude adapter integration remains future work.
- Abort behavior is wired through the client `/api/ask` request signal, but server-side remote abort behavior is not yet smoked.
- Provider-mode `/api/ask` remote smoke is not verified.
