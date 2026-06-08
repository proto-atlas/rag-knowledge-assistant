# デプロイ接続確認記録

補足: ファイル名は元のデプロイ日を残している。この記録は 2026-05-02T10:44:04+09:00 に更新した。

## 日本語要約

この記録は、モック応答の公開デプロイ後の接続確認を記録した特定時点ログです。

- 確認したこと: 公開URL、主要route、モック `/api/search`、モック `/api/ask` のSSE event sequence
- 結果: モック応答公開デプロイの基本routeとモック動作は成功
- 読み方: 公開URLがモック応答で見えることの確認であり、実プロバイダー経路やClaude実APIの公開動作確認ではありません
- この記録に含めない範囲: Claude実APIの回答品質、公開URLでの実プロバイダーRAG品質、本番認証、負荷耐性

詳細なroute名、Wrangler出力、HTTP status、SSE event名は、証拠性と再現性を保つため原文のまま残しています。

生成日時: 2026-05-02T10:44:04+09:00
確認環境: ローカル実行
確認種別: モック応答のCloudflare Workersデプロイ確認
結果: 成功

この記録では、`wrangler deploy` 後のモック応答デプロイ確認を残します。
公開URLの初回表示用metadataを追加した後に更新しました。

確認用キー、Cloudflare API token、Anthropic API key、cookie、raw provider response、ローカル専用メモは含めていません。

## デプロイ

- 公開URL: https://rag-knowledge-assistant.atlas-lab.workers.dev
- Worker名: `rag-knowledge-assistant`
- Version ID: `93ab6515-a304-4dc6-916d-cd0a38f78ed0`
- 回答プロバイダー設定: 既定のモック応答
- Claude実API mode: 無効
- Anthropic secret binding: この確認では未設定

## Wrangler deploy出力の要約

`corepack pnpm wrangler deploy` から確認した内容:

- Upload: 成功
- アップロードまたは再利用されたasset: `/index.html`, `/assets/index-BTYO-xeE.js`
- 表示されたWorker binding:
  - `RAG_DB`
  - `RAG_VECTOR_INDEX`
  - `AI`
  - `ASSETS`
  - `RAG_ACTIVE_INDEX_VERSION`
- 公開route:
  - `https://rag-knowledge-assistant.atlas-lab.workers.dev`

Wrangler warning:

- `wrangler.jsonc` で明示していないため、`workers_dev` が既定で有効。
- `wrangler.jsonc` で明示していないため、Preview URLsが既定で有効。

これらのwarningはモック応答デプロイをブロックしませんでした。
これはこの記録を作成した時点の状態です。現在のrepository `wrangler.jsonc` では `workers_dev` と `preview_urls` を明示設定しています。

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

- responseに`<noscript>`が含まれていた。
- responseに`name="description"`が含まれていた。
- responseに`property="og:title"`が含まれていた。
- React hydration前の初期HTMLに`<h1>RAG Knowledge Assistant</h1>`が含まれていた。

## 認証付きモック確認

確認者は、確認用キー付きでモック応答のrequestを実行しました。
確認用キーの値はこの記録に残していません。

### `/api/search`

Request body:

```json
{"question":"リモート勤務の申請期限は？","topK":5}
```

秘匿値を含まない観測結果:

- responseに`query: "リモート勤務の申請期限は？"`が含まれていた。
- responseに`topK: 5`が含まれていた。
- responseに`indexVersion: "fixture-corpus-v1"`が含まれていた。
- responseに`noAnswerRecommended: false`が含まれていた。
- responseにsource resultが5件含まれていた。
- first resultは`リモート勤務規程 / 対象と申請`だった。
- Claude APIは呼び出されませんでした。

### `/api/ask`

Request body:

```json
{"question":"リモート勤務の申請期限は？","topK":5}
```

観測したSSE event sequence:

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

デプロイ済みのモック回答routeが、answer deltaの前にsourcesを返し、最後に `done` で終了することを確認しました。

## この記録に含めない範囲

- この確認ではClaudeを呼び出していません。
- この確認ではAnthropic Messages APIを呼び出していません。
- この確認では手動の実API RAG確認を実行していません。
- 認証付きmock `/api/search` の挙動だけを確認しました。
- この確認では公開route経由のWorkers AI + Vectorize + D1 検索を検証していません。
- この確認ではCloudflare WAFやrate-limit ruleを検証していません。
- 一般的なRAG品質を証明するものではありません。
