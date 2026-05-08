# D1 Source-Of-Truth Readiness Evidence

Generated at: 2026-05-01T00:31:00+09:00
Generated from: local worktree
Check type: local D1 source-of-truth boundary test
Result: pass

This evidence records the first D1 source-of-truth readiness step.
It adds a typed boundary for reading active chunk text from D1 rows and converting those rows into source cards for provider-mode search.

Official docs checked before implementation:

- Cloudflare D1 Workers Binding API: https://developers.cloudflare.com/d1/worker-api/
- Cloudflare D1 prepared statements: https://developers.cloudflare.com/d1/worker-api/prepared-statements/
- Cloudflare D1 migrations: https://developers.cloudflare.com/d1/reference/migrations/

Not claimed:

- This does not create a remote D1 database.
- This does not run a D1 migration.
- This does not query a live D1 binding.
- This does not switch public `/api/search` to provider mode.
- This does not call Claude API.
- This does not prove full RAG retrieval quality.

## Scope

Added files:

- `src/rag/d1-source.ts`
- `tests/rag/d1-source.test.ts`

Existing schema:

- `migrations/0001_initial.sql`

The new boundary uses prepared-statement placeholders and bound values for `activeIndexVersion` and `chunkIds`.
The SQL placeholder count is derived from the number of normalized chunk ids; the chunk id values themselves are not string-interpolated into SQL.

## Verified Behavior

- D1 rows are converted into `SearchCorpusChunk` objects.
- Invalid document category is rejected.
- Invalid `metadata_json` shape is rejected.
- Invalid `heading_path` shape is rejected.
- Empty or duplicate chunk ids are normalized before querying.
- Empty chunk id input returns an empty map without preparing a query.
- Empty active `indexVersion` is rejected.
- Query construction includes active `indexVersion` and chunk id filters.

## Commands

```bash
corepack pnpm run typecheck
corepack pnpm run lint
corepack pnpm run test -- tests/rag/d1-source.test.ts tests/rag/provider-search.test.ts
```

Result:

- `typecheck`: pass
- `lint`: pass
- related unit tests: pass, 22 files / 86 tests

## Known Limitations

- This is a local boundary test with a fake D1 object.
- Remote D1 database creation and migration are still future steps.
- D1 binding has not been added to `wrangler.jsonc` yet.
- D1-backed source retrieval is not connected to `/api/search` yet.
- Old Vectorize vectors are still excluded by metadata filter design; physical cleanup remains a future maintenance task.
