# Manual Live RAG Smoke Evidence

Generated at: 2026-05-04T12:58:30+09:00
Generated from: 611085747bfe56dafce92c2f456aa394a7890782
Generated from note: smoke実行時点のrepository commitです。このevidence fileは後続commitで追加されています。
Public URL: https://rag-knowledge-assistant.atlas-lab.workers.dev
Check type: manual live provider smoke
Result: known-answer pass; no-answer not executed

## 日本語要約

このevidenceは、access key付きの短時間manual live設定で、known-answer 1件がWorkers AI / Vectorize / D1 / Anthropic streaming answerまで通ったことを示すpoint-in-timeログです。

- 確認したこと: known-answer 1件でlive provider pathがSSE `answer_delta` を返すこと
- 結果: HTTP 200、`answer_delta` 9件、provider errorなし、source validation失敗なし、secret漏れ検出なし
- 読み方: 公開defaultはこの後mock-onlyへ戻しています。常時live provider公開ではありません
- このログで主張しないこと: no-answer live smoke完了、general RAG品質、production authentication、private document運用、provider-side cost reversal

詳細なevent名、HTTP status、Worker version IDは、証拠性と再現性を保つため原文のまま残しています。

## Scope

- Known-answer requests: 1
- No-answer requests: 0
- Bulk eval: false
- Load test: false
- Private documents: false

## Configuration

- Search provider mode: `vectorize-d1`
- Answer provider mode: `anthropic`
- Active index version: `rag-bge-m3-v1`
- Claude model: `claude-sonnet-4-6`
- Max tokens: `256`
- D1 fixture rows: 8 fictional documents / 24 chunks
- Vectorize vector count: 24 fixture vectors

## Worker Versions

| State | Worker Version ID | Notes |
|---|---|---|
| temporary live smoke | `08400d4d-3fca-4d9d-ae94-c1a1268e4ad4` | live provider vars and Anthropic secret were enabled for this smoke |
| restored public default | `a9af6129-8ab9-4c38-9ad4-e3914ae67d77` | public default restored to mock-only config |

## Results

| Case | HTTP | Result | Event types | Notes |
|---|---:|---|---|---|
| known-answer | 200 | pass | `retrieval_start`, `sources`, `generation_start`, `answer_delta`, `done` | `answerDeltaCount=9`, `hasProviderError=false`, `hasSourceValidationFailed=false`, `leakedSecretCount=0` |

## Restore Checks

- Public default restored to mock-only Worker config: yes
- Worker `RAG_ANTHROPIC_API_KEY` secret deleted: yes
- Worker secret list after cleanup included only `RAG_ACCESS_KEY`: yes
- Repository file changes from smoke execution itself: no tracked diff
- Provider key lifecycle after Worker deletion: managed outside this repository

## Sanitization

- API key recorded: no
- Cookies recorded: no
- Raw provider response recorded: no
- Prompt recorded: no
- Stack trace recorded: no
- Local absolute path recorded: no
- Script leaked-needle check scope: access key only. Anthropic API key is not passed to the smoke script; its non-recording boundary is handled by Worker-side sanitization and secret cleanup.

## Not Claimed

- This is not a bulk eval.
- This is not a load test.
- This does not prove general RAG quality.
- This does not prove production authentication.
- This does not prove private document isolation.
- This does not prove provider-side cost reversal after abort.
- This does not claim public default is live provider mode.
- This does not claim no-answer live smoke has passed.
