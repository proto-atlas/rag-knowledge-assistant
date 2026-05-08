# Manual Live RAG Smoke Evidence

Generated at: 2026-05-05T05:01:35.269Z
Public URL: https://rag-knowledge-assistant.atlas-lab.workers.dev
Worker version: `89c540e9-f754-47ca-b0af-9d2e7d6e0ed8`
Code deploy version: `16fb7705-3098-48e8-bf2b-d5360260322c`
Commit: `5bd3eef`
Check type: manual live provider smoke
Result: pass

## 日本語要約

このevidenceは、access key付き限定live demoでWorkers AI、Vectorize、D1、Anthropic streaming answerの最小smokeを実行したpoint-in-timeログです。

- 確認したこと: known-answer 1件とno-answer 1件のguarded provider path
- 結果: 2件ともpass
- 読み方: 限定live demoの代表経路が、指定時点の公開Workerで動いたことを示します
- このログで主張しないこと: production authentication、private document運用、一般化されたRAG品質、provider-side cost reversal after abort

## Scope

- Known-answer requests: 1
- No-answer requests: 1
- Bulk eval: false
- Load test: false
- Private documents: false

## Configuration

- Search provider mode: `vectorize-d1`
- Answer provider mode: `anthropic`
- Active index version: `rag-bge-m3-v1`
- Claude model: `claude-sonnet-4-6`
- Max tokens: 256
- D1 fixture rows: 8 documents / 24 chunks
- Vectorize vector count: 24 fixture vectors

## Results

| Case | HTTP | Result | Event types | Notes |
|---|---:|---|---|---|
| known-answer | 200 | pass | `retrieval_start`, `sources`, `generation_start`, `answer_delta`, `done` | `answerDeltaCount=9`, `hasSources=true`, `hasDone=true`, `hasProviderError=false`, `hasSourceValidationFailed=false`, `sourceIds=1,2,3,4,5` |
| no-answer | 200 | pass | `retrieval_start`, `sources`, `no_answer`, `done` | `answerDeltaCount=0`, `hasNoAnswer=true`, `hasProviderError=false`, `hasSourceValidationFailed=false`, `sourceIds=1,2,3,4,5` |

## Sanitization

- Cookies recorded: no
- Access key recorded: no
- Anthropic API key recorded: no
- Raw provider response recorded: no
- Prompt recorded: no
- Stack trace recorded: no

The smoke script checks the access key needle because that value is sent by the script. The Anthropic API key is not passed to the smoke script; it is held as a Worker secret.

## Not Claimed

- This is not a bulk eval.
- This is not a load test.
- This does not prove general RAG quality.
- This does not prove production authentication.
- This does not prove provider-side cost reversal after abort.
