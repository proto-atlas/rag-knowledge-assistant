# D1 Worker Smoke Evidence

Generated at: 2026-05-01T01:25:00+09:00
Generated from: local worktree
Check type: guarded internal Worker route reading remote D1 through binding
Result: pass

This evidence records a no-Claude D1 smoke test through a guarded internal Worker route.
It verifies that the Worker can read seeded fixture chunks from remote D1 through the `RAG_DB` binding.

Not claimed:

- This does not switch public `/api/search` to provider mode.
- This does not call Workers AI, Vectorize, or Claude.
- This does not prove full RAG retrieval quality.
- This does not deploy the Worker.
- This does not expose the internal route in normal public operation; the route is hidden unless provider smoke is explicitly enabled.

## Scope

Added files:

- `src/worker/d1-smoke.ts`
- `tests/worker/d1-smoke.test.ts`
- `tests/worker/internal-d1-smoke.test.ts`

Updated files:

- `src/worker/app.ts`
- `src/worker/types.ts`

Internal route:

- `POST /api/internal/d1-smoke`

Guards:

- Requires `RAG_ENABLE_PROVIDER_SMOKE=true`.
- Requires admin access key.
- Returns `404` when provider smoke is disabled.
- Returns `401` without the admin access key.

## Remote Smoke

Command shape:

```bash
corepack pnpm wrangler dev --remote --port 8791 --local-protocol http \
  --var RAG_ENABLE_PROVIDER_SMOKE:true \
  --var RAG_ADMIN_ACCESS_KEY:<local-smoke-admin-key>
```

Smoke request:

```bash
POST http://127.0.0.1:8791/api/internal/d1-smoke
Authorization: Bearer <local-smoke-admin-key>
```

Result summary:

```json
{
  "ok": true,
  "indexVersion": "rag-bge-m3-v1",
  "requestedChunkIds": [
    "remote-work-policy__s1__c1",
    "security-handbook__s3__c1",
    "release-process__s1__c1"
  ],
  "foundCount": 3,
  "chunkSummaries": [
    {
      "chunkId": "remote-work-policy__s1__c1",
      "documentSlug": "remote-work-policy",
      "documentTitle": "リモート勤務規程",
      "category": "policy",
      "headingPath": ["対象と申請"],
      "indexVersion": "rag-bge-m3-v1",
      "contentLength": 172
    },
    {
      "chunkId": "security-handbook__s3__c1",
      "documentSlug": "security-handbook",
      "documentTitle": "セキュリティハンドブック",
      "category": "security",
      "headingPath": ["外部共有"],
      "indexVersion": "rag-bge-m3-v1",
      "contentLength": 136
    },
    {
      "chunkId": "release-process__s1__c1",
      "documentSlug": "release-process",
      "documentTitle": "リリース手順",
      "category": "release",
      "headingPath": ["リリース判定"],
      "indexVersion": "rag-bge-m3-v1",
      "contentLength": 164
    }
  ]
}
```

The smoke response included short content previews from fictional fixture text only.
No access key, cookie, provider raw error, or secret value is recorded in this evidence.

## Verification Commands

```bash
corepack pnpm run typecheck
corepack pnpm run lint
corepack pnpm run test -- tests/worker/d1-smoke.test.ts tests/worker/internal-d1-smoke.test.ts
```

Result:

- `typecheck`: pass
- `lint`: pass
- D1 smoke tests: pass, 25 files / 96 tests

## Known Limitations

- Public `/api/search` still uses mock lexical retrieval.
- This smoke reads fixed chunk ids only.
- This smoke does not join Vectorize matches to D1 chunks.
- This smoke does not call Claude.
- This smoke is setup evidence, not retrieval-quality evidence.
