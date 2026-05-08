# Provider-mode Search Readiness Evidence

Generated at: 2026-05-01T08:30:00+09:00
Generated from: local worktree
Check type: provider-mode `/api/search` implementation readiness
Result: partial pass

This evidence records the local implementation step that lets `POST /api/search` use Workers AI, Vectorize, and D1 only when the explicit environment flag is enabled.

## Scope

Added files:

- `src/worker/search-provider.ts`
- `tests/worker/search-provider.test.ts`

Updated files:

- `src/worker/app.ts`
- `src/worker/types.ts`
- `src/worker/provider-search-smoke.ts`
- `tests/worker/search.test.ts`

## Behavior

Default behavior:

- `POST /api/search` continues to use mock lexical retrieval.
- The default path does not require Workers AI, Vectorize, or D1 bindings.

Provider mode:

- Enabled only when `RAG_SEARCH_PROVIDER_MODE=vectorize-d1`.
- Requires `AI`, `RAG_VECTOR_INDEX`, `RAG_DB`, and `RAG_ACTIVE_INDEX_VERSION`.
- Creates the query embedding with `@cf/baai/bge-m3`.
- Queries Vectorize with active `indexVersion` metadata filter and optional `category` filter.
- Reads matched chunk text from D1 by chunk id and active index version.
- Converts the joined results into the existing source-card-shaped `SearchResponse`.
- Returns a sanitized `server_misconfigured` error if provider bindings or provider responses are unavailable.

## Verification Commands

```bash
corepack pnpm run typecheck
corepack pnpm vitest run tests/worker/search-provider.test.ts tests/worker/search.test.ts tests/worker/internal-provider-search-smoke.test.ts
```

Result:

- `typecheck`: pass
- targeted tests: pass, 3 files / 13 tests

## Not Claimed

- This does not call Claude.
- This does not prove a deployed public `/api/search` provider-mode request.
- This does not prove production Cloudflare routing.
- This does not rerun the guarded provider search smoke after the full 24-vector upsert.
- This does not make provider mode the default behavior.

## Known Limitations

- `wrangler dev --remote` hit Cloudflare edge-preview authentication/permission errors in this session, so the provider-mode public route was not re-smoked through remote preview after the 24-vector upsert.
- Full local quality gates still need to be rerun after this documentation update.
