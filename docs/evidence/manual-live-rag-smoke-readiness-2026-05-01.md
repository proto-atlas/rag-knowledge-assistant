# Manual Live RAG Smoke Readiness Evidence

Generated at: 2026-05-01T09:47:23+09:00
Generated from: local worktree
Check type: manual live smoke readiness
Result: partial pass

This evidence records the manual live smoke helper and checklist.
It does not call Claude, Workers AI, Vectorize, D1, or a deployed Worker route.

## Scope

Added files:

- `src/rag/manual-live-smoke.ts`
- `tests/rag/manual-live-smoke.test.ts`
- `scripts/manual-live-rag-smoke.mjs`

Updated files:

- `package.json`
- `docs/MANUAL-LIVE-SMOKE.md`
- `README.md`
- `docs/REVIEWER.md`

## Behavior

`smoke:manual-live-rag` is a manual-only script for a future explicit-cost provider smoke.

The script refuses to run unless the confirmation flag is present:

```bash
--confirm-manual-live-rag-smoke
```

Required runtime environment variables:

- `RAG_LIVE_SMOKE_URL`
- `RAG_ACCESS_KEY`

The script is intentionally scoped to:

- one known-answer request
- one no-answer request
- no bulk eval
- no load test
- no private documents

It writes a local sanitized summary to:

```text
.tmp/manual-live-rag-smoke/summary.json
```

`.tmp` outputs must not be committed.

## Verification Commands

```bash
corepack pnpm vitest run tests/rag/manual-live-smoke.test.ts
corepack pnpm run smoke:manual-live-rag
```

Result:

- targeted tests: pass, 1 file / 5 tests
- no-confirm smoke command: expected refusal
- no live request was made

## Sanitization Checks

The helper records event-type summary information rather than raw evidence text.

It checks for:

- source ids returned in `sources`
- `answer_delta` count
- `done`
- `no_answer`
- `source_validation_failed`
- provider `error`
- leaked secret-like needles

## Not Claimed

- No Claude API call was made.
- No Workers AI request was made by this script.
- No Vectorize query was made by this script.
- No D1 read was made by this script.
- No deployed Worker URL was called.
- This does not prove general RAG quality.
- This does not prove provider-side cost reversal after abort.

## Next Step

Only run the manual live smoke after explicit cost approval and secret setup.
If it is run, create a separate dated evidence file from the sanitized summary and record the exact scope.
