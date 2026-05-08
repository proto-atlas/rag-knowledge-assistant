# Worker Binding Vectorize Smoke Evidence

Generated at: 2026-05-01T00:21:16+09:00
Generated from: local worktree
Check type: manual Worker runtime binding smoke
Result: pass

This evidence records a no-Claude Worker runtime smoke for the provider bindings.
It verifies that a guarded internal Worker route can call Workers AI for a query embedding and then query Vectorize with metadata filters.

Not claimed:

- This does not prove full RAG retrieval quality.
- This does not prove D1 source-of-truth behavior.
- This does not prove Claude answer generation.
- This does not prove Cloudflare deployment.
- This does not switch public `/api/search` to provider mode.
- This does not include raw vectors, access keys, cookies, or provider secrets.

## Scope

- Route: `POST /api/internal/vectorize-smoke`
- Route exposure: disabled unless `RAG_ENABLE_PROVIDER_SMOKE=true`
- Route auth: admin access key required
- Embedding model: `@cf/baai/bge-m3`
- Vectorize index: `rag-bge-m3-v1`
- Active index version: `rag-bge-m3-v1`
- Query text: `リモート勤務の申請期限は？`
- Query vector dimensions: `1024`
- Metadata filter:
  - `indexVersion = rag-bge-m3-v1`
  - `category = policy`
- Claude API call: no
- D1 migration/query: no
- Cloudflare deploy: no

## Result

Sanitized response summary:

```json
{
  "ok": true,
  "model": "@cf/baai/bge-m3",
  "indexVersion": "rag-bge-m3-v1",
  "queryText": "リモート勤務の申請期限は？",
  "queryVectorDimensions": 1024,
  "filter": {
    "indexVersion": "rag-bge-m3-v1",
    "category": "policy"
  },
  "count": 1,
  "matches": [
    {
      "id": "remote-work-policy__s1__c1",
      "score": 0.7043135,
      "metadata": {
        "chunkId": "remote-work-policy__s1__c1",
        "documentSlug": "remote-work-policy",
        "category": "policy",
        "indexVersion": "rag-bge-m3-v1",
        "smokeRunId": "vectorize-smoke-2026-04-30T14-36-24-883Z"
      }
    }
  ]
}
```

## Pass Criteria

- Worker route stayed hidden unless `RAG_ENABLE_PROVIDER_SMOKE=true`: pass by route implementation and unit test.
- Admin access key was required for the internal smoke route: pass by unit test and manual smoke.
- Worker runtime called Workers AI and produced a 1024-dimensional query vector: pass.
- Worker runtime queried Vectorize through the `RAG_VECTOR_INDEX` binding: pass.
- Metadata filter returned only the expected `policy` chunk for the active index version: pass.
- Evidence does not include secrets, cookies, raw vectors, full local paths, or access keys: pass.

## Known Limitations

- This is a provider binding smoke, not retrieval eval.
- Only one natural-language query was checked.
- Only the 3-vector smoke corpus was present in the Vectorize index.
- The route is intentionally internal and should not be enabled in normal public operation.
- Full provider-mode search still needs D1-backed source retrieval before `/api/search` can be switched away from mock retrieval.
