# デプロイ後の公開route確認記録

生成日時: 2026-05-02T08:24:00Z
確認種別: デプロイ後の公開route確認
結果: 成功

## 対象

この記録では、モック応答デプロイ後の小さな確認結果を残します。

- 公開URL: `https://rag-knowledge-assistant.atlas-lab.workers.dev`
- デプロイしたWorker version ID: `5f9ba783-b039-4c07-976c-56d4f9605a91`
- deploy前に確認したapp code commit: `de9588f`
- 実プロバイダーmode: 無効
- Claude実API呼び出し: 未実行
- 確認用キーの記録: なし

## 確認結果

| 確認項目 | 期待値 | 観測値 |
|---|---|---|
| `GET /api/health` | 200 | 200, `{"ok":true,"service":"rag-knowledge-assistant"}` |
| `GET /` | 200 | 200, HTML contains `RAG Knowledge Assistant` and `mock-only` |
| unauthenticated `POST /api/search` | 401 | 401, `unauthorized` |

## 方法

`wrangler deploy` 後に、local Node.js HTTPS clientからコマンドを実行しました。

local環境ではPowerShell `Invoke-WebRequest` とWindows `curl.exe` がSchannel credential errorで失敗したため、公開route確認にはNode.js `fetch` を使いました。

## この記録に含めない範囲

- 認証付きのsearch/askの流れは確認していません。
- 公開route経由ではWorkers AI、Vectorize、D1、Claudeを呼び出しません。
- 実プロバイダー経路の検索品質や回答品質を証明するものではありません。
- `deployment-check-2026-05-01.md` のモック応答デプロイ確認記録を置き換えるものではありません。
