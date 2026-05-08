# Vectorize Fixture Index Readiness Evidence

Generated at: 2026-05-01T01:38:00+09:00
Generated from: local worktree
Check type: full fixture Vectorize file generation and upsert
Result: pass

This evidence proves full fixture embedding file generation, Vectorize upsert, and `vectorCount: 24` readiness. It does not evaluate provider-mode hit@k, MRR, no-answer quality, or Claude answer quality.

This evidence records the preparation step for indexing all fictional fixture chunks into Vectorize.
It adds a script that builds Vectorize upsert NDJSON from the same index plan used for remote D1 seed.

Not claimed:

- This does not call Claude.
- This does not switch public `/api/search` to provider mode.
- This does not deploy the Worker.
- `wrangler vectorize info` was captured from the project owner's authenticated shell, not from the local command environment.

## Scope

Added files:

- `src/rag/vectorize-index-files.ts`
- `tests/rag/vectorize-index-files.test.ts`
- `scripts/create-vectorize-fixture-files.mjs`

Updated files:

- `package.json`

New script:

```bash
corepack pnpm run vectorize:fixtures -- --confirm-live-vectorize-fixture-embedding
```

The script:

- reads the same 8 fictional Markdown fixture documents used by D1 seed,
- builds the same `rag-bge-m3-v1` index plan,
- sends the 24 chunk texts to Workers AI only when the explicit confirmation flag is present,
- writes `.tmp/vectorize-fixtures/embeddings.ndjson`,
- writes `.tmp/vectorize-fixtures/summary.json`.

## Verification Commands

```bash
corepack pnpm run typecheck
corepack pnpm run lint
corepack pnpm run test -- tests/rag/vectorize-index-files.test.ts
```

Result:

- `typecheck`: pass
- `lint`: pass
- vectorize fixture generation tests: pass, 28 files / 107 tests

## Live Fixture Embedding and Upsert

Command:

```bash
corepack pnpm run vectorize:fixtures -- --confirm-live-vectorize-fixture-embedding
```

Result:

- pass
- model: `@cf/baai/bge-m3`
- vectorCount: 24
- outputDir: `.tmp/vectorize-fixtures`
- generatedAt: `2026-04-30T23:08:57.412Z`

Upsert command:

```bash
corepack pnpm wrangler vectorize upsert rag-bge-m3-v1 --file .tmp/vectorize-fixtures/embeddings.ndjson --json
```

Result:

```json
{
  "index": "rag-bge-m3-v1",
  "count": 24
}
```

Generated summary:

```json
{
  "indexRunId": "seed-rag-bge-m3-v1",
  "indexVersion": "rag-bge-m3-v1",
  "vectorCount": 24,
  "chunkIds": [
    "remote-work-policy__s1__c1",
    "remote-work-policy__s2__c1",
    "remote-work-policy__s3__c1",
    "expense-policy__s1__c1",
    "expense-policy__s2__c1",
    "expense-policy__s3__c1",
    "security-handbook__s1__c1",
    "security-handbook__s2__c1",
    "security-handbook__s3__c1",
    "incident-response__s1__c1",
    "incident-response__s2__c1",
    "incident-response__s3__c1",
    "onboarding-guide__s1__c1",
    "onboarding-guide__s2__c1",
    "onboarding-guide__s3__c1",
    "product-faq__s1__c1",
    "product-faq__s2__c1",
    "product-faq__s3__c1",
    "support-escalation__s1__c1",
    "support-escalation__s2__c1",
    "support-escalation__s3__c1",
    "release-process__s1__c1",
    "release-process__s2__c1",
    "release-process__s3__c1"
  ]
}
```

## Post-upsert Info Check

Command:

```bash
corepack pnpm wrangler vectorize info rag-bge-m3-v1 --json
```

Result:

```json
{
  "dimensions": 1024,
  "vectorCount": 24,
  "processedUpToDatetime": "2026-04-30T23:08:57.423Z",
  "processedUpToMutation": "b4ef6c9b-1a84-433a-bec6-4e9098717329"
}
```

## Known Limitations

- Public `/api/search` still uses mock lexical retrieval.
- Provider search smoke should be rerun after the full 24-vector upsert to capture updated behavior.
