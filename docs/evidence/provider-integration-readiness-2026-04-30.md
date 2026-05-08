# Provider Integration Readiness

Generated at: 2026-04-30T20:20:00+09:00
Generated from: local worktree
Check type: provider integration planning / no live API call
Result: partial

## Scope

This note records the provider-facing assumptions used before adding real Workers AI, Vectorize, or Claude API calls.

No live Workers AI, Vectorize, D1, Claude API, Cloudflare deploy, secret lookup, or rate-limit test was run for this evidence.

## Confirmed Official Documentation

- Cloudflare Workers AI binding: Workers AI is exposed through an `AI` binding, and Worker code calls `env.AI.run(model, input)`.
- Cloudflare Workers AI bge-m3 model: `@cf/baai/bge-m3` accepts `text` as a string or array of strings and returns embedding arrays in documented output shapes.
- Cloudflare Vectorize Worker binding: Vectorize indexes are bound to Workers and queried with `env.<BINDING>.query(vector, options)`.
- Cloudflare Vectorize query options: `topK` defaults to 5, `returnMetadata: "all"` is supported, and metadata filtering is available.
- Cloudflare Vectorize metadata filtering: metadata is limited and filters should be explicit. The RAG app keeps chunk body text in D1 / fixture chunk storage, not in Vectorize metadata.
- Anthropic Messages streaming: streaming uses SSE events such as `message_start`, `content_block_delta`, `message_delta`, and `message_stop`; unknown event types must be handled gracefully.

## Local Implementation Added

- Added local provider boundary types for Workers AI and Vectorize bindings.
- Added `createVectorizeQueryOptions()` so provider search always includes active `indexVersion` in the metadata filter.
- Added `parseFirstWorkersAiEmbeddingVector()` to validate Workers AI embedding output before Vectorize query use.
- Added `parseVectorizeMatches()` to validate Vectorize match shape before converting to UI source cards.
- Added `createSearchResponseFromVectorMatches()` to convert provider matches into the existing `SearchResponse` shape without exposing provider raw output to the client.

## Current Non-Claims

- This does not prove the configured Vectorize index exists.
- This does not prove `@cf/baai/bge-m3` dimension, metric, or preset in this account.
- This does not prove Cloudflare binding names are configured in production.
- This does not prove Claude API streaming behavior in this app.
- This does not change `/api/search`; the current route still uses mock lexical retrieval.

## Next Real Provider Step

Before real provider mode is enabled:

1. Add Wrangler bindings for Workers AI and Vectorize.
2. Confirm Vectorize index dimension / metric / preset with official docs and a controlled probe.
3. Add a no-Claude Vectorize smoke that embeds one question, queries a tiny indexed fixture set, and retrieves chunk bodies from D1 or the fixture chunk source.
4. Keep all live provider checks manual and outside normal CI.
