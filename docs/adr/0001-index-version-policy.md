# ADR 0001: Index Version Policy

Status: accepted
Date: 2026-05-02

## 日本語要約

mock検索とprovider検索は、同じ「検索」として見えてもindexの意味が違います。このADRでは、mock fixture用の `fixture-corpus-v1` と、Workers AI + Vectorize用の `rag-bge-m3-v1` を意図的に分け、provider検索ではactive index versionでfilterする方針を記録します。

## Context

The project has two retrieval paths:

- mock lexical retrieval for the public demo
- provider retrieval for Workers AI + Vectorize + D1 readiness

Provider retrieval can change when the embedding model, vector dimensions, metric, chunking strategy, or fixture corpus changes. Mixing incompatible vectors would make retrieval scores and citations difficult to reason about.

## Decision

Use explicit index versions and filter provider-mode retrieval by the active index version.

Current versions:

- `fixture-corpus-v1`: mock lexical fixture corpus
- `rag-bge-m3-v1`: provider Vectorize index for `@cf/baai/bge-m3`

Mock and provider index versions are intentionally separate. A new incompatible provider setup should create a new index version instead of mutating the meaning of an existing one.

## Consequences

Benefits:

- Old vectors can physically remain without being returned by normal provider search.
- Evidence can name the exact index version it measured.
- Reindex work can be staged before switching active traffic.

Tradeoffs:

- Maintenance cleanup is still required to remove stale vectors.
- Evidence must be explicit about whether it measured the mock corpus or the provider index.
