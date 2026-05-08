# ADR 0004: External Benchmark Subset Policy

Status: accepted
Date: 2026-05-03

## 日本語要約

25件fixtureのprovider evalは、retrieval scaffoldとfixtureを同じプロジェクト内で作っているため、一般化性能の根拠にはしません。このADRでは、外部データセット由来のquery/gold document idを使った小規模subset評価を別evidenceとして追加し、既存fixture evalと混同しない方針を記録します。

## Context

The existing provider retrieval eval intentionally uses 25 fictional fixtures. It is useful for checking the Workers AI + Vectorize + D1 retrieval path against this portfolio corpus, but it is not a held-out external benchmark.

An additional external-subset baseline helps show how the retrieval scaffold behaves outside the hand-authored fixture set, without claiming production RAG quality.

Candidate review:

- First candidate: `castorini/mr-tydi` Japanese dev split with `castorini/mr-tydi-corpus`.
- License: Apache-2.0 on the Hugging Face dataset pages checked for both query and corpus datasets.
- JaCWIR was not selected in this phase because the license was not confirmed from the review path.

## Decision

Add a separate external benchmark subset evidence file using Mr. TyDi Japanese dev rows.

The evidence is a local lexical baseline over a candidate subset:

- Query/gold document ids come from the Mr. TyDi Japanese dev split.
- Candidate documents are built from the gold documents plus sampled non-gold corpus documents.
- The script records an input hash and raw result JSON.
- The score is not an official Mr. TyDi full-corpus benchmark score.
- The score does not evaluate Workers AI, Vectorize, D1, Claude, or provider-mode `/api/search`.

The default target size is 50 queries. This stays inside the project’s portfolio evidence scope and avoids presenting a large benchmark as if it were production-quality evaluation.

## Consequences

Benefits:

- The 25-fixture `1.000` metrics are no longer the only retrieval evaluation visible in the repo.
- Low external-subset scores can be published with failure categories instead of hidden.
- External evaluation and fixture evaluation remain separately named and separately interpreted.

Tradeoffs:

- This still does not replace a full held-out benchmark over the official full corpus.
- Lexical ranking is a baseline, not the provider vector retrieval path.
- The corpus file is large, so regeneration may be slow and should use the script cache under `.tmp`.

## Recalibration Triggers

Re-run or replace this evidence if any of the following changes:

- benchmark dataset version, license, or source URL
- query limit or candidate-document construction
- ranking/scoring function
- normalization or tokenization logic
- provider-mode evaluation scope changes enough that this baseline is no longer a useful comparison point
