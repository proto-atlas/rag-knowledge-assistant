# Deployment Smoke Evidence

Note: filename reflects the original deploy date. This evidence file was refreshed at 2026-05-02T10:44:04+09:00.

## 日本語要約

このevidenceは、mock-only公開デプロイ後のsmoke checkを記録したpoint-in-timeログです。

- 確認したこと: 公開URL、主要route、mock `/api/search`、mock `/api/ask` SSE event sequence
- 結果: mock-only公開デプロイの基本routeとmock動作はpass
- 読み方: 公開demoがmock-onlyで見えることの確認であり、provider-modeやlive Claudeの公開動作確認ではありません
- このログで主張しないこと: live Claude回答品質、public provider-mode RAG品質、production authentication、負荷耐性

詳細なroute名、Wrangler出力、HTTP status、SSE event名は、証拠性と再現性を保つため原文のまま残しています。

Generated at: 2026-05-02T10:44:04+09:00
Generated from: local worktree
Check type: mock-only Cloudflare Workers deployment smoke
Result: pass

This evidence records a mock-only deployment smoke after `wrangler deploy`.
It was refreshed after adding public first-impression fallback metadata.

No access key, Cloudflare API token, Anthropic API key, cookie, raw provider response, or local-only internal note is included.

## Deployment

- Public URL: https://rag-knowledge-assistant.atlas-lab.workers.dev
- Worker name: `rag-knowledge-assistant`
- Version ID: `93ab6515-a304-4dc6-916d-cd0a38f78ed0`
- Answer provider mode: default mock mode
- Claude live mode: not enabled
- Anthropic secret binding: not configured for this smoke

## Wrangler Deploy Output Summary

Observed from `corepack pnpm wrangler deploy`:

- Upload: success
- Assets uploaded or reused: `/index.html`, `/assets/index-BTYO-xeE.js`
- Worker bindings shown:
  - `RAG_DB`
  - `RAG_VECTOR_INDEX`
  - `AI`
  - `ASSETS`
  - `RAG_ACTIVE_INDEX_VERSION`
- Public route:
  - `https://rag-knowledge-assistant.atlas-lab.workers.dev`

Wrangler warnings:

- `workers_dev` is enabled by default because it is not explicitly set in `wrangler.jsonc`.
- Preview URLs are enabled by default because `preview_urls` is not explicitly set in `wrangler.jsonc`.

These warnings did not block the mock-only deployment.
They reflect this evidence generation point. The repository `wrangler.jsonc` now explicitly sets `workers_dev` and `preview_urls`.

## Smoke Checks

Commands used HTTP status checks only. No access key was sent.

| Check | Method | Expected | Observed |
|---|---|---:|---:|
| `/` | GET | 200 | 200 |
| `/api/health` | GET | 200 | 200 |
| `/api/public/status` | GET | 200 | 200 |
| `/api/search` without access key | POST | 401 | 401 |
| `/api/ask` without access key | POST | 401 | 401 |

Additional `/` HTML checks:

- response contained `<noscript>`
- response contained `name="description"`
- response contained `property="og:title"`
- response contained initial `<h1>RAG Knowledge Assistant</h1>` before React hydration

## Authenticated Mock Smoke

The project owner then ran authenticated mock requests with the portfolio access key.
The access key value is not recorded here.

### `/api/search`

Request body:

```json
{"question":"リモート勤務の申請期限は？","topK":5}
```

Observed sanitized result:

- response contained `query: "リモート勤務の申請期限は？"`
- response contained `topK: 5`
- response contained `indexVersion: "fixture-corpus-v1"`
- response contained `noAnswerRecommended: false`
- response contained 5 source results
- first result was `リモート勤務規程 / 対象と申請`
- no Claude API call was made

### `/api/ask`

Request body:

```json
{"question":"リモート勤務の申請期限は？","topK":5}
```

Observed SSE event sequence:

```text
retrieval_start
sources
generation_start
answer_delta
answer_delta
answer_delta
answer_delta
answer_delta
answer_delta
answer_delta
answer_delta
answer_delta
answer_delta
done
```

This confirms the deployed mock answer route emits sources before answer deltas and terminates with `done`.

## Not Claimed

- This smoke did not call Claude.
- This smoke did not call the Anthropic Messages API.
- This smoke did not run manual live RAG smoke.
- This smoke verified authenticated mock `/api/search` behavior only.
- This smoke did not verify provider-mode Workers AI + Vectorize + D1 retrieval through the public route.
- This smoke did not verify Cloudflare WAF or rate-limit rules.
- This smoke does not prove general RAG quality.
