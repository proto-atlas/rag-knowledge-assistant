# 実プロバイダー検索の準備確認記録

生成日時: 2026-05-01T08:30:00+09:00
確認環境: ローカル実行
確認種別: 実プロバイダー経路の `/api/search` 実装確認
結果: 部分的に成功

この記録では、明示的な環境flagが有効な場合だけ `POST /api/search` がWorkers AI、Vectorize、D1 を使う実装手順を残す。

## 対象

追加したファイル:

- `src/worker/search-provider.ts`
- `tests/worker/search-provider.test.ts`

更新したファイル:

- `src/worker/app.ts`
- `src/worker/types.ts`
- `src/worker/provider-search-check.ts`
- `tests/worker/search.test.ts`

## 挙動

既定の挙動:

- `POST /api/search` は引き続きモック検索を使います。
- 既定の経路ではWorkers AI、Vectorize、D1 bindingsを必要としません。

実プロバイダー経路:

- `RAG_SEARCH_PROVIDER_MODE=vectorize-d1` の場合だけ有効。
- `AI`、`RAG_VECTOR_INDEX`、`RAG_DB`、`RAG_ACTIVE_INDEX_VERSION` を必要とする。
- `@cf/baai/bge-m3` でquery embeddingを作成する。
- 有効な `indexVersion` metadata filterと任意の `category` filterでVectorizeを検索する。
- 一致したchunk textを、chunk idと有効なindex versionでD1から読む。
- joinした結果を、既存の根拠カード形式の `SearchResponse` に変換する。
- provider bindingやprovider responseを利用できない場合は、sanitizeした `server_misconfigured` errorを返す。

## 確認コマンド

```bash
corepack pnpm run typecheck
corepack pnpm vitest run tests/worker/search-provider.test.ts tests/worker/search.test.ts tests/worker/internal-provider-search-check.test.ts
```

結果:

- `typecheck`: 成功
- 対象テスト: 成功、3 files / 13 tests

## この記録で証明していないこと

- Claudeは呼び出しません。
- デプロイ済み公開 `/api/search` の実プロバイダーrequestを証明するものではありません。
- 本番Cloudflare routingを証明するものではありません。
- 24-vector全件upsert後のguarded provider search checkは再実行していません。
- 実プロバイダー経路を既定の挙動にはしていません。

## 既知の制約

- この確認時点では `wrangler dev --remote` がCloudflare edge-previewのauthentication / permission errorで止まったため、24-vector upsert後の実プロバイダー公開routeはremote preview経由で再確認していません。
- この文書更新後に、ローカル品質確認一式を再実行する必要があります。
