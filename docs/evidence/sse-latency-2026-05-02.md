# SSE Latency Evidence

## 日本語要約

このevidenceは、mock `/api/ask` SSE経路のlocal in-process latencyを測ったpoint-in-timeログです。

- 確認したこと: Hono appをprocess内で呼び、mock SSEのresponse ready / first chunk / answer_delta / doneまでの時間を測定
- 結果: 200 samples、10 warm-up discard後のlocal mock pipelineでp50 / p95を記録
- 読み方: project-owned SSE event処理の局所的な測定であり、Cloudflare edgeや外部provider latencyではありません
- このログで主張しないこと: production latency SLO、Workers AI / Vectorize / D1 / Anthropic streamingの性能

詳細なmetric名、生sample、JSON evidenceは、証拠性と再現性を保つため原文のまま残しています。

Generated at: 2026-05-02T07:22:36.406Z
Check type: mock-sse-latency
Result: pass

This evidence measures the project-owned mock `/api/ask` SSE path by calling the Hono app in-process. It does not call Claude, Workers AI, Vectorize, D1, or Cloudflare.

Interpretation note: this is a 200-sample in-process mock measurement after 10 warm-up calls. The p95 column is valid only for this local mock pipeline. It is not a production latency percentile or SLO for Cloudflare edge, Workers AI, Vectorize, D1, or Anthropic streaming.

## Scope

- Sample count: 200
- Warm-up calls discarded: 10
- Route: `POST /api/ask`
- Provider mode: default mock search and mock answer stream
- Question fixture: known-answer remote-work policy question
- Access key value: synthetic local evidence key, not printed in response

## Summary

| Metric | Count | p50 | p95 | Min | Max | Average |
|---|---:|---:|---:|---:|---:|---:|
| Response ready | 200 | 1.35 ms | 2.19 ms | 0.83 ms | 3.10 ms | 1.44 ms |
| First chunk | 200 | 1.40 ms | 2.26 ms | 0.85 ms | 3.16 ms | 1.48 ms |
| First answer_delta | 200 | 1.46 ms | 2.32 ms | 0.87 ms | 3.22 ms | 1.52 ms |
| Done | 200 | 1.52 ms | 2.42 ms | 0.91 ms | 3.29 ms | 1.58 ms |

## Samples

The table shows the first 20 samples. The full 200-sample dataset is written to the adjacent JSON evidence file.

| Sample | Status | Response ready | First chunk | First answer_delta | Done | Events |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 200 | 1.07 ms | 1.10 ms | 1.13 ms | 1.20 ms | 14 |
| 2 | 200 | 1.02 ms | 1.05 ms | 1.08 ms | 1.18 ms | 14 |
| 3 | 200 | 1.04 ms | 1.06 ms | 1.09 ms | 1.19 ms | 14 |
| 4 | 200 | 1.09 ms | 1.12 ms | 1.15 ms | 1.23 ms | 14 |
| 5 | 200 | 2.18 ms | 2.26 ms | 2.32 ms | 2.39 ms | 14 |
| 6 | 200 | 1.40 ms | 1.44 ms | 1.49 ms | 1.56 ms | 14 |
| 7 | 200 | 1.40 ms | 1.46 ms | 1.51 ms | 1.59 ms | 14 |
| 8 | 200 | 1.30 ms | 1.41 ms | 1.45 ms | 1.52 ms | 14 |
| 9 | 200 | 1.26 ms | 1.30 ms | 1.35 ms | 1.41 ms | 14 |
| 10 | 200 | 1.26 ms | 1.30 ms | 1.34 ms | 1.40 ms | 14 |
| 11 | 200 | 1.16 ms | 1.19 ms | 1.28 ms | 1.35 ms | 14 |
| 12 | 200 | 1.28 ms | 1.31 ms | 1.35 ms | 1.41 ms | 14 |
| 13 | 200 | 1.11 ms | 1.14 ms | 1.17 ms | 1.22 ms | 14 |
| 14 | 200 | 0.95 ms | 0.97 ms | 1.00 ms | 1.06 ms | 14 |
| 15 | 200 | 1.63 ms | 1.69 ms | 1.73 ms | 1.79 ms | 14 |
| 16 | 200 | 1.30 ms | 1.35 ms | 1.40 ms | 1.49 ms | 14 |
| 17 | 200 | 1.54 ms | 1.59 ms | 1.73 ms | 1.83 ms | 14 |
| 18 | 200 | 1.64 ms | 1.69 ms | 1.75 ms | 1.82 ms | 14 |
| 19 | 200 | 1.37 ms | 1.41 ms | 1.46 ms | 1.53 ms | 14 |
| 20 | 200 | 1.25 ms | 1.35 ms | 1.40 ms | 1.52 ms | 14 |

## Event Sequence

Observed event names across samples:

```text
retrieval_start -> sources -> generation_start -> answer_delta -> answer_delta -> answer_delta -> answer_delta -> answer_delta -> answer_delta -> answer_delta -> answer_delta -> answer_delta -> answer_delta -> done
```

## Not Claimed

- This is not live Claude latency.
- This is not Workers AI, Vectorize, D1, or Cloudflare edge latency.
- This does not measure large-corpus RAG performance.
- This does not prove provider-mode answer quality.
- This does not establish a production SLO.
