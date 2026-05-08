# Vectorize Smoke Evidence

Generated at: 2026-04-30T23:45:00+09:00
Generated from: local worktree
Check type: manual Workers AI + Vectorize smoke
Result: partial pass

This evidence records the first no-Claude Vectorize smoke.
It verifies that a small set of fictional chunks can be embedded with Workers AI, upserted into Vectorize, and queried by vector id.

Not claimed:

- This does not prove full RAG retrieval quality.
- This does not prove D1 source-of-truth behavior.
- This does not prove Claude answer generation.
- This does not prove metadata-filter behavior through the Worker binding.
- This does not include raw embedding vectors.

## Scope

- Embedding model: `@cf/baai/bge-m3`
- Vectorize index: `rag-bge-m3-v1`
- Dimensions: `1024`
- Metric: `cosine`
- Chunks upserted: `3`
- Query method: `vector-id`
- Claude API call: no
- D1 migration/query: no
- Cloudflare deploy: no

## Smoke Input Summary

Workers AI smoke embedding output:

```json
{
  "ok": true,
  "generatedAt": "2026-04-30T14:36:25.278Z",
  "model": "@cf/baai/bge-m3",
  "summary": {
    "smokeRunId": "vectorize-smoke-2026-04-30T14-36-24-883Z",
    "indexVersion": "rag-bge-m3-v1",
    "chunkIds": [
      "remote-work-policy__s1__c1",
      "security-handbook__s3__c1",
      "release-process__s1__c1"
    ],
    "vectorCount": 3,
    "queryText": "リモート勤務の申請期限は？",
    "queryVectorDimensions": 1024
  }
}
```

Notes:

- The local output directory was intentionally not copied into this evidence.
- Raw vectors were written only to `.tmp/vectorize-smoke/` and were not copied into docs.

## Upsert

Command:

```bash
corepack pnpm wrangler vectorize upsert rag-bge-m3-v1 --file .tmp/vectorize-smoke/embeddings.ndjson --json
```

Output:

```json
{
  "index": "rag-bge-m3-v1",
  "count": 3
}
```

## Query

Command:

```bash
corepack pnpm wrangler vectorize query rag-bge-m3-v1 --vector-id remote-work-policy__s1__c1 --top-k 3 --return-metadata all
```

Output summary:

```json
{
  "count": 3,
  "matches": [
    {
      "id": "remote-work-policy__s1__c1",
      "score": 0.9999987,
      "metadata": {
        "category": "policy",
        "chunkId": "remote-work-policy__s1__c1",
        "documentSlug": "remote-work-policy",
        "documentTitle": "リモート勤務規程",
        "headingPath": ["対象と申請"],
        "indexVersion": "rag-bge-m3-v1",
        "smokeRunId": "vectorize-smoke-2026-04-30T14-36-24-883Z",
        "tags": ["policy", "remote", "attendance"]
      }
    },
    {
      "id": "release-process__s1__c1",
      "score": 0.51515996,
      "metadata": {
        "category": "release",
        "chunkId": "release-process__s1__c1",
        "documentSlug": "release-process",
        "documentTitle": "リリース手順",
        "headingPath": ["リリース判定"],
        "indexVersion": "rag-bge-m3-v1",
        "smokeRunId": "vectorize-smoke-2026-04-30T14-36-24-883Z",
        "tags": ["release", "quality", "test"]
      }
    },
    {
      "id": "security-handbook__s3__c1",
      "score": 0.49507526,
      "metadata": {
        "category": "security",
        "chunkId": "security-handbook__s3__c1",
        "documentSlug": "security-handbook",
        "documentTitle": "セキュリティハンドブック",
        "headingPath": ["外部共有"],
        "indexVersion": "rag-bge-m3-v1",
        "smokeRunId": "vectorize-smoke-2026-04-30T14-36-24-883Z",
        "tags": ["security", "sharing", "repository"]
      }
    }
  ]
}
```

## Index Info After Upsert

Command:

```bash
corepack pnpm wrangler vectorize info rag-bge-m3-v1 --json
```

Output:

```json
{
  "dimensions": 1024,
  "vectorCount": 3,
  "processedUpToDatetime": "2026-04-30T14:37:30.115Z",
  "processedUpToMutation": "722ddfdd-4d80-45b7-ae5d-eeec7c9fbab4"
}
```

## Filter Note

A CLI query with metadata filter returned results, but Wrangler printed an `Invalid query filter` warning.
For that reason, this smoke uses the warning-free basic `vector-id` query as the pass result.

Follow-up:

- Verify metadata filtering through the Worker binding before claiming active `indexVersion` filter behavior in provider mode.
- Keep provider code filtering expectations covered by unit tests until live binding smoke confirms the exact runtime behavior.

## Pass Criteria

- Workers AI embedding smoke generated 1024-dimensional vectors: pass.
- Vectorize upsert accepted 3 vectors: pass.
- Vectorize query by vector id returned the expected vector as the top match: pass.
- Vectorize index info showed `vectorCount: 3` after upsert: pass.
- Evidence does not include secrets, cookies, raw vectors, or full local paths: pass.

## Known Limitations

- This is a smoke test, not a retrieval eval.
- Query used an existing vector id, not the generated natural-language query vector.
- Only 3 fictional chunks were inserted.
- Full provider-mode search still needs D1-backed source retrieval and Worker binding integration.
