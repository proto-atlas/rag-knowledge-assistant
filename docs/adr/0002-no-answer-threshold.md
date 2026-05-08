# ADR 0002: No-Answer Threshold Policy

Status: accepted
Date: 2026-05-02

## 日本語要約

このデモでは、根拠が弱い質問に対して無理に回答を作らないことを優先します。provider modeの `MIN_PROVIDER_VECTOR_SCORE = 0.55` は、このportfolio demoの25件fixtureに合わせた初期値であり、任意corpusやVectorize一般に通用するproduction thresholdではありません。

## Context

The demo should avoid presenting unsupported answers as if they were grounded in the fictional corpus. The public mock path and the provider path use different scoring systems, so their thresholds must not be treated as interchangeable.

## Decision

Use a retrieval-side no-answer gate before answer generation, and keep provider-mode threshold calibration explicit.

Current provider default:

- `MIN_PROVIDER_VECTOR_SCORE = 0.55`
- optional override: `RAG_MIN_PROVIDER_VECTOR_SCORE`

The default is calibrated for the fictional 25-fixture provider retrieval eval. It is not a production-calibrated threshold for arbitrary corpora. Provider-mode hit@k and no-answer accuracy must be re-measured before making broader provider quality claims.

## Consequences

Benefits:

- Weak retrieval can stop before answer generation.
- No-answer behavior can be tested separately from answer style.
- The threshold can be adjusted without changing code.

Tradeoffs:

- A score threshold alone does not prove answer correctness.
- Provider-mode retrieval eval is still required before treating the default threshold as calibrated.
