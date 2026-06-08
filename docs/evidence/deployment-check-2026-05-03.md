# デプロイ接続確認記録

## 日本語要約

この記録は、最新公開HEADをモック応答のままCloudflare Workersへ再デプロイした後の接続確認を記録した特定時点ログです。

- 確認したこと: 公開URL、`/api/health`、`/api/public/status`、未認証 `/api/search`、未認証 `/api/ask`
- 結果: 最新HTML titleと主要公開routeは期待どおり
- 読み方: GitHub HEAD `368f6d7` の公開URL反映確認であり、実プロバイダー経路やClaude実APIの公開動作確認ではありません
- この記録に含めない範囲: Claude実APIの回答品質、公開URLでの実プロバイダーRAG品質、本番認証、負荷耐性

詳細なroute名、HTTP status、Worker version IDは、証拠性と再現性を保つため原文のまま残しています。

生成日時: 2026-05-03T08:03:42+09:00
確認環境: ローカル実行
確認種別: モック応答のCloudflare Workersデプロイ確認
結果: 成功

## デプロイ

- 公開URL: `https://rag-knowledge-assistant.atlas-lab.workers.dev`
- Worker名: `rag-knowledge-assistant`
- Version ID: `2fcfd549-311f-4723-a801-d0f9bbeaeaa5`
- デプロイしたapp commit: `368f6d75cdb524fadaf2a704aa208d69cb712edd`
- 回答プロバイダー設定: 既定のモック応答
- Claude実API mode: 無効
- 確認用キーの記録: なし

## Wrangler deploy出力の要約

`corepack pnpm wrangler deploy` から確認した内容:

- Upload: 成功
- Static asset update: `/index.html`
- 公開route:
  - `https://rag-knowledge-assistant.atlas-lab.workers.dev`
- 現在のVersion ID:
  - `2fcfd549-311f-4723-a801-d0f9bbeaeaa5`

Wrangler warning:

- `workers.dev` subdomain is enabled while Preview URLs are disabled.

このwarningは、公開 `workers.dev` routeを有効にし、preview URLsを無効にしている現在のデプロイ設定と一致します。

## 接続確認

コマンドはHTTP statusだけを確認しました。確認用キーは送信していません。

| 確認項目 | Method | 期待値 | 観測値 |
|---|---|---:|---:|
| `/` | GET | 200 | 200 |
| `/api/health` | GET | 200 | 200 |
| `/api/public/status` | GET | 200 | 200 |
| `/api/search` without confirmation key | POST | 401 | 401 |
| `/api/ask` without confirmation key | POST | 401 | 401 |

追加の`/` HTML確認:

- response contained `RAG Knowledge Assistant`
- response contained `mock-only`
- response contained `RAG Knowledge Assistant — 架空文書RAGデモ`
- response contained built client asset `/assets/index-CkeV0tFL.js`

観測した`/api/health` response:

```json
{"ok":true,"service":"rag-knowledge-assistant"}
```

観測した`/api/public/status` response:

```json
{"documentCount":8,"chunkCount":24,"indexVersion":"fixture-corpus-v1","lastIndexedAt":null}
```

観測した未認証`/api/search`と`/api/ask` response:

```json
{"error":{"code":"unauthorized","message":"確認用キーが必要です。"}}
```

## この記録に含めない範囲

- この確認では確認用キーを送信していません。
- この確認ではClaudeを呼び出していません。
- この確認ではAnthropic Messages APIを呼び出していません。
- この確認では手動の実API RAG確認を実行していません。
- この確認では公開route経由のWorkers AI + Vectorize + D1検索を検証していません。
- この確認ではCloudflare WAFやrate-limit ruleを検証していません。
- 一般的なRAG品質を証明するものではありません。
