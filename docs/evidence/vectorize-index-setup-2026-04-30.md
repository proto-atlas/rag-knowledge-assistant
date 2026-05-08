# Vectorize Index Setup Evidence

Generated at: 2026-04-30T22:29:44.7288435+09:00
Generated from: local worktree
Check type: Cloudflare Vectorize setup
Result: pass / index created

This evidence is a point-in-time setup log for the first Vectorize index.
It proves the index and metadata indexes were created. It does not prove retrieval quality.

Confirmed setup:

- Vectorize index `rag-bge-m3-v1` exists.
- Index dimensions are `1024`.
- Index metric is `cosine`.
- Metadata indexes exist for `indexVersion` and `category`.
- `wrangler.jsonc` contains the `AI` binding, `RAG_VECTOR_INDEX` binding, and `RAG_ACTIVE_INDEX_VERSION` variable.

Not claimed:

- No vectors were upserted during this setup check.
- No Vectorize query was run.
- No D1 migration was run.
- No Claude API call was run.
- No Cloudflare deploy was run.

## Official Documentation Checked

- Cloudflare Vectorize Wrangler commands document `vectorize create`, including `--dimensions`, `--metric`, `--preset`, `--binding`, and `--update-config`.
- Cloudflare Vectorize create-index guidance states that dimensions and metric are fixed for an index.
- Cloudflare Vectorize metadata filtering requires explicit metadata indexes for filterable metadata properties.
- Cloudflare Workers AI binding exposes `env.AI.run()`.
- Local Wrangler help was checked on 2026-04-30. The installed Wrangler accepts `vectorize create --preset`, but the listed preset choices do not include `@cf/baai/bge-m3`.
- Local Wrangler help confirmed metadata index flags: `--propertyName` and `--type`.
- Cloudflare AI Search supported-model docs list `@cf/baai/bge-m3` as 1024 dimensions with `cosine` metric.

## Created Index

| Field | Value | Evidence |
|---|---|---|
| Index name | `rag-bge-m3-v1` | `wrangler vectorize create` output |
| Embedding model | `@cf/baai/bge-m3` | Workers AI dimension probe evidence |
| Binding name | `RAG_VECTOR_INDEX` | `wrangler.jsonc` |
| Active index version | `rag-bge-m3-v1` | `wrangler.jsonc` |
| Dimensions | 1024 | Workers AI probe and Vectorize info |
| Metric | cosine | Cloudflare AI Search docs and Vectorize create output |
| Metadata index: `indexVersion` | string | `wrangler vectorize list-metadata-index` output |
| Metadata index: `category` | string | `wrangler vectorize list-metadata-index` output |

## Commands Run

Index creation:

```bash
corepack pnpm wrangler vectorize create rag-bge-m3-v1 --dimensions 1024 --metric cosine --binding RAG_VECTOR_INDEX --json
```

Metadata indexes:

```bash
corepack pnpm wrangler vectorize create-metadata-index rag-bge-m3-v1 --propertyName indexVersion --type string
corepack pnpm wrangler vectorize create-metadata-index rag-bge-m3-v1 --propertyName category --type string
```

Verification:

```bash
corepack pnpm wrangler vectorize info rag-bge-m3-v1 --json
corepack pnpm wrangler vectorize list-metadata-index rag-bge-m3-v1 --json
```

## Index Creation Output

```json
{
  "created_on": "2026-04-30T13:24:56.907907Z",
  "modified_on": "2026-04-30T13:24:56.907907Z",
  "name": "rag-bge-m3-v1",
  "description": "",
  "config": {
    "dimensions": 1024,
    "metric": "cosine"
  }
}
```

## Index Info Output At Setup Time

Command:

```bash
corepack pnpm wrangler vectorize info rag-bge-m3-v1 --json
```

Output:

```json
{
  "dimensions": 1024,
  "vectorCount": 0,
  "processedUpToDatetime": "2026-04-30T13:25:38.147Z",
  "processedUpToMutation": "2c6be9e1-9e22-4fed-8229-60bf1a7686b8"
}
```

## Metadata Index Output

Command:

```bash
corepack pnpm wrangler vectorize list-metadata-index rag-bge-m3-v1 --json
```

Output:

```json
[
  {
    "propertyName": "indexVersion",
    "indexType": "String"
  },
  {
    "propertyName": "category",
    "indexType": "String"
  }
]
```

## `wrangler.jsonc` Binding Diff

Safe binding names and index names added:

```text
ai.binding = AI
vectorize[0].binding = RAG_VECTOR_INDEX
vectorize[0].index_name = rag-bge-m3-v1
vars.RAG_ACTIVE_INDEX_VERSION = rag-bge-m3-v1
```

Not added yet:

```text
RAG_ACCESS_KEY secret
RAG_ADMIN_ACCESS_KEY secret
RAG_ANTHROPIC_API_KEY secret
```

## Pass Criteria

- Vectorize index exists: pass.
- Created index uses intended dimensions and metric: pass.
- `RAG_VECTOR_INDEX` binding points to intended index: pass in `wrangler.jsonc`.
- `indexVersion` metadata index exists: pass.
- `category` metadata index exists: pass.
- `RAG_ACTIVE_INDEX_VERSION` matches active index version used in provider query filters: pass in `wrangler.jsonc`.
- Evidence does not contain secrets, cookies, local-only internal review notes, or provider raw errors: pass by manual review.

## Known Limitations

- `vectorCount` was `0` at setup time.
- Later smoke evidence may record a higher `vectorCount` after manual upsert.
- This setup evidence does not prove retrieval quality.
- Retrieval quality must be measured separately with a small real Vectorize smoke and retrieval eval evidence.
- Claude answer generation must be measured separately after retrieval is confirmed.
