# Anthropic Answer Provider Readiness Evidence

Generated at: 2026-05-01T09:22:47+09:00
Generated from: local worktree
Check type: Anthropic answer provider boundary readiness
Result: partial pass

This evidence records a guarded Anthropic answer provider implementation for `/api/ask`.
It does not call Claude.

## Scope

Added files:

- `src/worker/anthropic-answer-provider.ts`
- `tests/worker/anthropic-answer-provider.test.ts`

Updated files:

- `src/worker/answer-provider.ts`
- `src/worker/app.ts`
- `src/worker/types.ts`
- `src/worker/rag-stream.ts`
- `tests/worker/answer-provider.test.ts`

## Official API Assumptions Checked

Anthropic Messages API documentation was checked before this implementation.
The direct API integration uses:

- `POST https://api.anthropic.com/v1/messages`
- `x-api-key`
- `anthropic-version: 2023-06-01`
- `content-type: application/json`
- request body with `model`, `max_tokens`, `messages`, and `stream: true`
- streaming events such as `content_block_delta`, `message_stop`, `ping`, and provider `error`

The Worker does not forward raw provider events to the frontend.
It normalizes provider events into project-owned RAG stream events.

## Behavior

`RAG_ANSWER_PROVIDER_MODE=anthropic` now has an implementation behind explicit live guards.

Required configuration:

- `RAG_ANSWER_PROVIDER_MODE=anthropic`
- `RAG_ENABLE_ANTHROPIC_LIVE=true`
- `RAG_ANTHROPIC_API_KEY`
- `RAG_CLAUDE_MODEL`

If any live guard is missing, `/api/ask` fails closed with a sanitized `server_misconfigured` response.

Runtime behavior covered by tests:

- no-answer search results skip the provider call
- valid text deltas with existing source ids become answer stream events
- responses without source ids become `source_validation_failed`
- responses with unknown source ids become `source_validation_failed`
- provider HTTP 529 becomes sanitized `overloaded`
- provider stream errors become sanitized project `error` events
- invalid provider JSON is sanitized as provider error
- access keys are not included in request body or stream events

## Verification Commands

```bash
corepack pnpm run typecheck
corepack pnpm vitest run tests/worker/anthropic-answer-provider.test.ts tests/worker/answer-provider.test.ts tests/worker/ask.test.ts
```

Result:

- `typecheck`: pass
- targeted tests: pass, 3 files / 19 tests

## Not Claimed

- No Claude API call was made.
- No real provider stream was consumed.
- No Anthropic secret binding was configured in Cloudflare.
- No deployed `/api/ask` live-provider smoke was run.
- Abort behavior is wired through `Request.signal`, but this does not prove provider-side cost reversal.

## Next Step

Run a manual live smoke only after explicit cost approval and secret setup.
The first live smoke should use one known-answer fixture and one no-answer fixture, and should record only sanitized results.
