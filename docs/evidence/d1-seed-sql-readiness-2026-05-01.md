# D1 Seed SQL Readiness Evidence

Generated at: 2026-05-01T00:48:00+09:00
Generated from: local worktree
Check type: local D1 fixture seed SQL generation and remote D1 seed
Result: pass

This evidence records the D1 fixture seed SQL preparation step.
It verifies that the fictional fixture corpus can be converted into an idempotent SQL seed file for the remote D1 schema.

Not claimed:

- This does not switch public `/api/search` to provider mode.
- This does not query D1 from an application route.
- This does not call Workers AI, Vectorize, or Claude.
- This does not deploy the Worker.

## Scope

Added files:

- `src/rag/d1-seed-sql.ts`
- `tests/rag/d1-seed-sql.test.ts`
- `scripts/create-d1-seed-sql.mjs`

Updated files:

- `package.json`

Generated local file:

- `.tmp/d1-seed/seed.sql`

Seed summary:

```json
{
  "indexRunId": "seed-rag-bge-m3-v1",
  "indexVersion": "rag-bge-m3-v1",
  "embeddingModel": "@cf/baai/bge-m3",
  "vectorizeIndexName": "rag-bge-m3-v1",
  "documentCount": 8,
  "chunkCount": 24
}
```

## Verified Behavior

- Seed SQL does not include `BEGIN TRANSACTION`, `COMMIT`, or `SAVEPOINT`.
- Existing chunks for the same `indexVersion` are deleted before inserting replacement chunks.
- `index_runs` uses upsert semantics.
- `documents` uses update-in-place upsert semantics instead of `INSERT OR REPLACE`.
- `chunks` inserts versioned `chunk_record_id` rows.
- SQL string literals escape single quotes.
- Non-finite numeric values are rejected.

## Commands

```bash
corepack pnpm run typecheck
corepack pnpm run lint
corepack pnpm run test -- tests/rag/d1-seed-sql.test.ts tests/rag/index-plan.test.ts tests/rag/d1-schema.test.ts
corepack pnpm run seed:d1-sql
```

Result:

- `typecheck`: pass
- `lint`: pass
- related unit tests: pass, 23 files / 91 tests
- `seed:d1-sql`: pass

## D1 Import Compatibility Note

The first generated seed file included explicit transaction statements.
Cloudflare D1 rejected that import with:

```text
To execute a transaction, please use the state.storage.transaction() or state.storage.transactionSync() APIs instead of the SQL BEGIN TRANSACTION or SAVEPOINT statements.
```

Cloudflare's D1 import/export guidance says to remove `BEGIN TRANSACTION` and `COMMIT` from dumped SQL when import errors occur.
The seed generator was updated to omit explicit transaction statements.

## Remote Seed

Command:

```bash
corepack pnpm wrangler d1 execute RAG_DB --remote --file .tmp/d1-seed/seed.sql --yes
```

Result:

- pass
- processed 34 queries
- rows read: 2
- rows written: 179
- final bookmark: `00000004-0000000f-0000505d-3f0aa6604098b0095c6b9d9b291d2cb0`

Remote row-count verification:

```json
{
  "documents": 8,
  "chunks": 24,
  "indexRuns": [
    {
      "index_run_id": "seed-rag-bge-m3-v1",
      "index_version": "rag-bge-m3-v1",
      "status": "succeeded"
    }
  ]
}
```

Verified commands:

```bash
corepack pnpm wrangler d1 execute RAG_DB --remote --command "SELECT COUNT(*) AS document_count FROM documents;" --json
corepack pnpm wrangler d1 execute RAG_DB --remote --command "SELECT COUNT(*) AS chunk_count FROM chunks;" --json
corepack pnpm wrangler d1 execute RAG_DB --remote --command "SELECT index_run_id, index_version, status FROM index_runs;" --json
```

## Known Limitations

- The local seed SQL file is generated under `.tmp/` and is not public evidence.
- D1-backed source retrieval is not connected to `/api/search` yet.
- No live Worker route has queried D1 yet.
- Remote D1 now contains fixture corpus rows, but this evidence does not prove application-route retrieval.
