# Retrieval Eval Evidence

## 日本語要約

このevidenceは、固定の架空corpusに対するmock lexical retrieval evalのpoint-in-timeログです。

- 確認したこと: 20件のanswerable fixtureと5件のno-answer fixtureでmock retrieval scorerが期待chunkを返すか
- 結果: hit@5とno-answer accuracyは1.000、hit@1は0.900、MRRは0.950
- 読み方: retrieval評価の枠組みとno-answer制御の確認であり、provider品質の測定ではありません
- このログで主張しないこと: Workers AI + Vectorize品質、Claude回答品質、production RAG品質、held-out benchmark品質

詳細なmetric名、fixture table、failed case tableは、証拠性と再現性を保つため英語表記のまま残しています。

Generated at: 2026-04-30T10:03:24.505Z
Check type: mock retrieval eval
Method: runRetrievalEval() against the fixed fictional corpus
External calls: none

**This is a fixed mock lexical fixture evaluation. It does not evaluate Workers AI + Vectorize retrieval quality, Claude answer quality, or production RAG quality.**

## Scope

This evidence checks the local retrieval fixture set before connecting Workers AI or Vectorize.
It is not a claim that the later production Vectorize index has the same quality.

## Fixture Summary

| Type | Count |
|---|---:|
| Answerable questions | 20 |
| No-answer questions | 5 |
| Total | 25 |

## Acceptance Target

| Metric | Target | Actual |
|---|---:|---:|
| hit@5 | >= 0.800 | 1.000 |
| no-answer accuracy | >= 0.800 | 1.000 |
| failed cases | 0 | 0 |

MRR is recorded as a diagnostic metric. It is not a hard gate for this small fixture set.

## Result

| Metric | Value |
|---|---:|
| hit@1 | 0.900 |
| hit@3 | 1.000 |
| hit@5 | 1.000 |
| MRR | 0.950 |
| no-answer accuracy | 1.000 |

## Failed Cases

| ID | Reason | Expected chunks | Actual chunks | Question |
|---|---|---|---|---|
| - | - | - | - | - |


## Notes

- The corpus uses fictional documents only.
- This run does not call Claude, Workers AI, Vectorize, D1, or Cloudflare.
- The mock scorer is a development scaffold, not the final retrieval implementation.
- Real Vectorize evaluation must be recorded separately after the index is created.
- The 25 fictional fixtures were authored alongside the retrieval scaffold within the same project. They are not a held-out external benchmark. Perfect or near-perfect scores reflect scaffold-fixture co-design, not generalization.
