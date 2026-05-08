# Answer Provider Mode Readiness Evidence

Generated at: 2026-05-01T09:13:00+09:00
Generated from: local worktree
Check type: answer provider mode boundary readiness
Result: partial pass

This evidence records a configuration boundary for answer generation providers.
It does not call Claude.

## Scope

Added files:

- `src/worker/answer-provider.ts`
- `tests/worker/answer-provider.test.ts`

Updated files:

- `src/worker/app.ts`
- `src/worker/types.ts`
- `tests/worker/ask.test.ts`

## Behavior

`RAG_ANSWER_PROVIDER_MODE` controls the answer provider boundary.

Supported values:

- unset or `mock`: use the existing server-side mock SSE answer provider.
- `anthropic`: reserved for future Claude streaming integration.

Current safety behavior:

- `anthropic` mode is intentionally not implemented yet.
- If `anthropic` is selected, `/api/ask` returns a sanitized `server_misconfigured` response.
- The raw internal implementation error and access key are not exposed.

## Verification Commands

```bash
corepack pnpm run typecheck
corepack pnpm vitest run tests/worker/answer-provider.test.ts tests/worker/ask.test.ts tests/worker/anthropic-stream-adapter.test.ts
```

Result:

- `typecheck`: pass
- targeted tests: pass, 3 files / 13 tests

## Not Claimed

- This does not call Claude.
- This does not configure an Anthropic secret binding.
- This does not implement production Claude streaming.
- This does not change the default mock provider.

## Next Step

Implement an Anthropic client boundary behind `RAG_ANSWER_PROVIDER_MODE=anthropic`, then verify it with a manual live smoke only after explicit cost approval.
