# D1 Remote Setup Evidence

Generated at: 2026-05-01T00:36:00+09:00
Generated from: local worktree
Check type: manual Cloudflare D1 setup and migration
Result: pass

This evidence records the remote D1 setup for the RAG source-of-truth layer.

Not claimed:

- This does not switch public `/api/search` to provider mode.
- This does not query D1 from an application route.
- This does not seed fixture documents or chunks into D1.
- This does not call Workers AI, Vectorize, or Claude.
- This does not prove full RAG retrieval quality.
- This does not deploy the Worker.

## Scope

- Database name: `rag-knowledge-assistant-db`
- Binding name: `RAG_DB`
- Region hint: `APAC`
- Migrations applied:
  - `0001_initial.sql`
  - `0002_chunk_record_id.sql`
- Wrangler config updated: yes
- Remote D1 query performed: table-list read only

## D1 Create

Command:

```bash
corepack pnpm wrangler d1 create rag-knowledge-assistant-db --location apac
```

Result summary:

```json
{
  "database_name": "rag-knowledge-assistant-db",
  "database_id": "7a9b54db-b72a-4bf6-bc3d-f56537ad50fa",
  "region": "APAC"
}
```

## Migration Apply

Command:

```bash
corepack pnpm wrangler d1 migrations apply RAG_DB --remote
```

Result summary:

```json
{
  "migrations": ["0001_initial.sql", "0002_chunk_record_id.sql"],
  "status": "pass",
  "commandsExecuted": [7, 6]
}
```

## Schema Verification

Command:

```bash
corepack pnpm wrangler d1 execute RAG_DB --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

Output summary:

```json
{
  "success": true,
  "tables": [
    "_cf_KV",
    "chunks",
    "d1_migrations",
    "documents",
    "index_runs",
    "sqlite_sequence"
  ],
  "served_by_region": "APAC",
  "rows_written": 0
}
```

Chunk schema verification:

```json
{
  "chunkPrimaryKey": "chunk_record_id",
  "chunkIdColumn": "chunk_id",
  "uniqueChunkVersionIndex": true,
  "activeVersionIndex": "idx_chunks_active_version",
  "documentVersionIndex": "idx_chunks_document_version",
  "chunkIdIndex": "idx_chunks_chunk_id"
}
```

## Pass Criteria

- Remote D1 database was created: pass.
- Wrangler config contains a `RAG_DB` binding: pass.
- Initial migration applied to the remote database: pass.
- Reindex-oriented chunk record migration applied to the remote database: pass.
- Expected application tables exist: pass.
- `chunks` can store versioned chunk records through `chunk_record_id` and `UNIQUE(chunk_id, index_version)`: pass.
- Verification query was read-only and wrote 0 rows: pass.
- Evidence does not include access keys, cookies, or provider secrets: pass.

## Known Limitations

- D1 currently contains schema only; fixture data has not been seeded.
- D1-backed source retrieval has local unit tests but no live Worker route query yet.
- `/api/search` still uses mock lexical retrieval.
- No deployment has been performed.
