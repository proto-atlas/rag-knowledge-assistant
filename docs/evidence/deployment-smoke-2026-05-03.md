# Deployment Smoke Evidence

## 日本語要約

このevidenceは、最新公開HEADをmock-onlyのままCloudflare Workersへ再deployした後のsmoke checkを記録したpoint-in-timeログです。

- 確認したこと: 公開URL、`/api/health`、`/api/public/status`、未認証 `/api/search`、未認証 `/api/ask`
- 結果: 最新HTML titleと主要公開routeは期待どおり
- 読み方: GitHub HEAD `368f6d7` の公開URL反映確認であり、provider-modeやlive Claudeの公開動作確認ではありません
- このログで主張しないこと: live Claude回答品質、public provider-mode RAG品質、production authentication、負荷耐性

詳細なroute名、HTTP status、Worker version IDは、証拠性と再現性を保つため原文のまま残しています。

Generated at: 2026-05-03T08:03:42+09:00
Generated from: local public repository worktree
Check type: mock-only Cloudflare Workers deployment smoke
Result: pass

## Deployment

- Public URL: `https://rag-knowledge-assistant.atlas-lab.workers.dev`
- Worker name: `rag-knowledge-assistant`
- Version ID: `2fcfd549-311f-4723-a801-d0f9bbeaeaa5`
- Deployed app commit: `368f6d75cdb524fadaf2a704aa208d69cb712edd`
- Answer provider mode: default mock mode
- Claude live mode: not enabled
- Access key recorded: no

## Wrangler Deploy Output Summary

Observed from `corepack pnpm wrangler deploy`:

- Upload: success
- Static asset update: `/index.html`
- Public route:
  - `https://rag-knowledge-assistant.atlas-lab.workers.dev`
- Current Version ID:
  - `2fcfd549-311f-4723-a801-d0f9bbeaeaa5`

Wrangler warning:

- `workers.dev` subdomain is enabled while Preview URLs are disabled.

This warning matches the current portfolio deployment setting: public `workers.dev` route is enabled, preview URLs are disabled.

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

- response contained `RAG Knowledge Assistant`
- response contained `mock-only`
- response contained `RAG Knowledge Assistant — 架空文書RAGデモ`
- response contained built client asset `/assets/index-CkeV0tFL.js`

Observed `/api/health` response:

```json
{"ok":true,"service":"rag-knowledge-assistant"}
```

Observed `/api/public/status` response:

```json
{"documentCount":8,"chunkCount":24,"indexVersion":"fixture-corpus-v1","lastIndexedAt":null}
```

Observed unauthenticated `/api/search` and `/api/ask` response:

```json
{"error":{"code":"unauthorized","message":"access keyが必要です。"}}
```

## Not Claimed

- This smoke did not send an access key.
- This smoke did not call Claude.
- This smoke did not call the Anthropic Messages API.
- This smoke did not run manual live RAG smoke.
- This smoke did not verify provider-mode Workers AI + Vectorize + D1 retrieval through the public route.
- This smoke did not verify Cloudflare WAF or rate-limit rules.
- This smoke does not prove general RAG quality.
