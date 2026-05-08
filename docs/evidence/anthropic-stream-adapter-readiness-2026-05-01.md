# Anthropic Stream Adapter Readiness Evidence

Generated at: 2026-05-01T08:57:00+09:00
Generated from: local worktree
Check type: Anthropic raw stream event adapter readiness
Result: partial pass

This evidence records a pure adapter boundary for future Claude streaming integration.
It does not call Claude.

## Official API Context Checked

Anthropic Messages streaming documentation describes SSE event flow with events such as `message_start`, `content_block_delta`, `message_delta`, `message_stop`, `ping`, and `error`.
It also states that unknown event types may be added and should be handled gracefully.

Design decision:

- Do not forward raw Anthropic stream events to the frontend.
- Normalize provider events into project-owned RAG stream events.
- Ignore unknown provider events unless a future adapter explicitly supports them.
- Sanitize provider error details before they reach the UI.

## Scope

Added files:

- `src/worker/anthropic-stream-adapter.ts`
- `tests/worker/anthropic-stream-adapter.test.ts`

Updated files:

- `src/worker/rag-stream.ts`
- `src/worker/app.ts`
- `src/client/ask-api.ts`
- `src/client/App.tsx`
- `tests/worker/rag-stream.test.ts`
- `tests/client/ask-api.test.ts`

## Behavior

Implemented pure adapter behavior:

- `content_block_delta` with `text_delta` -> `answer_delta`
- `message_stop` -> `done`
- provider `error` -> sanitized project `error`
- `ping` and unknown provider events -> ignored

Abort wiring:

- `/api/ask` passes `Request.signal` to the SSE response helper.
- If the signal is already aborted, the helper emits no events.

## Verification Commands

```bash
corepack pnpm run typecheck
corepack pnpm vitest run tests/worker/anthropic-stream-adapter.test.ts tests/worker/rag-stream.test.ts tests/client/ask-api.test.ts tests/worker/ask.test.ts
```

Result:

- `typecheck`: pass
- targeted tests: pass, 4 files / 19 tests

## Not Claimed

- This does not call Claude.
- This does not parse a real remote Anthropic SSE stream.
- This does not prove provider-side abort or cost cancellation.
- This does not validate answer claims against retrieved chunks.

## Known Limitations

- Source id presence validation is not the same as claim-level factual validation.
- Provider-side token cost may already exist even if the UI aborts a request.
