# Provider Search Smoke Evidence

Generated at: 2026-05-01T01:33:00+09:00
Generated from: local worktree
Check type: guarded internal Worker route joining Workers AI, Vectorize, and D1
Result: pass

This evidence records a no-Claude provider search smoke test through a guarded internal Worker route.
It verifies that the Worker can:

- create a query embedding with Workers AI,
- query Vectorize with active `indexVersion` and `category` filters,
- fetch matched chunk text from remote D1 through `RAG_DB`,
- convert the result into source-card-shaped search output.

Not claimed:

- This does not switch public `/api/search` to provider mode.
- This does not call Claude.
- This does not prove answer generation quality.
- This does not prove full retrieval quality across the fixture set.
- This does not deploy the Worker.

## Scope

Added files:

- `src/worker/provider-search-smoke.ts`
- `tests/worker/provider-search-smoke.test.ts`
- `tests/worker/internal-provider-search-smoke.test.ts`

Updated files:

- `src/worker/app.ts`

Internal route:

- `POST /api/internal/provider-search-smoke`

Guards:

- Requires `RAG_ENABLE_PROVIDER_SMOKE=true`.
- Requires admin access key.
- Returns `404` when provider smoke is disabled.
- Returns `401` without the admin access key.

## Remote Smoke

Command shape:

```bash
corepack pnpm wrangler dev --remote --port 8792 --local-protocol http \
  --var RAG_ENABLE_PROVIDER_SMOKE:true \
  --var RAG_ADMIN_ACCESS_KEY:<local-smoke-admin-key>
```

Smoke request:

```bash
POST http://127.0.0.1:8792/api/internal/provider-search-smoke
Authorization: Bearer <local-smoke-admin-key>
```

Result summary:

```json
{
  "ok": true,
  "model": "@cf/baai/bge-m3",
  "indexVersion": "rag-bge-m3-v1",
  "queryText": "リモート勤務の申請期限は？",
  "queryVectorDimensions": 1024,
  "vectorMatchCount": 1,
  "d1FoundCount": 1,
  "response": {
    "query": "リモート勤務の申請期限は？",
    "topK": 3,
    "indexVersion": "rag-bge-m3-v1",
    "noAnswerRecommended": false,
    "results": [
      {
        "sourceId": "1",
        "chunkId": "remote-work-policy__s1__c1",
        "documentSlug": "remote-work-policy",
        "documentTitle": "リモート勤務規程",
        "headingPath": ["対象と申請"],
        "category": "policy",
        "tags": ["policy", "remote", "attendance"],
        "score": 0.7043135
      }
    ]
  }
}
```

The smoke response included the fictional fixture excerpt for the returned source card.
No access key, cookie, provider raw error, or secret value is recorded in this evidence.

## Verification Commands

```bash
corepack pnpm run typecheck
corepack pnpm run lint
corepack pnpm run test -- tests/worker/provider-search-smoke.test.ts tests/worker/internal-provider-search-smoke.test.ts
```

Result:

- `typecheck`: pass
- `lint`: pass
- provider search smoke tests: pass, 27 files / 101 tests

## Known Limitations

- Public `/api/search` still uses mock lexical retrieval.
- This smoke was captured before the later full fixture Vectorize upsert was recorded in `vectorize-fixture-index-readiness-2026-05-01.md`.
- The later full fixture upsert confirms `vectorCount: 24`, but this smoke was not rerun after that upsert.
- This smoke confirms one known query path only.
- This smoke does not call Claude and does not generate an answer.
- This smoke is provider wiring evidence, not retrieval-quality evidence.
