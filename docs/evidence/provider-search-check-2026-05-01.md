# provider search接続確認記録

生成日時: 2026-05-01T01:33:00+09:00
確認環境: ローカル実行
確認種別: Workers AI、Vectorize、D1をつなぐ内部Worker route確認
結果: 通過

この記録では、Claudeを呼ばずにguarded internal Worker route経由でprovider search接続を確認した結果を残す。
Workerが以下を実行できることを確認します。

- Workers AIでquery embeddingを作成する。
- active `indexVersion` と `category` filter付きでVectorizeへqueryする。
- `RAG_DB` 経由でremote D1から一致したchunk本文を取得する。
- 結果を根拠カード形式の検索出力へ変換する。

この記録に含めない範囲:

- 公開 `/api/search` を実プロバイダー設定へ切り替えるものではありません。
- Claudeは呼び出しません。
- 回答生成品質を証明するものではありません。
- fixture set全体の検索品質を証明するものではありません。
- Workerはデプロイしません。

## 対象

追加したファイル:

- `src/worker/provider-search-check.ts`
- `tests/worker/provider-search-check.test.ts`
- `tests/worker/internal-provider-search-check.test.ts`

更新したファイル:

- `src/worker/app.ts`

内部route:

- `POST /api/internal/provider-search-check`

保護条件:

- `RAG_ENABLE_PROVIDER_CHECK=true` が必要。
- admin確認用キーが必要。
- provider checkが無効の場合は`404`を返す。
- admin確認用キーがない場合は`401`を返す。

## リモート確認

コマンド形:

```bash
corepack pnpm wrangler dev --remote --port 8792 --local-protocol http \
  --var RAG_ENABLE_PROVIDER_CHECK:true \
  --var RAG_ADMIN_ACCESS_KEY:<local-check-admin-key>
```

確認リクエスト:

```bash
POST http://127.0.0.1:8792/api/internal/provider-search-check
Authorization: Bearer <local-check-admin-key>
```

結果summary:

```json
{
  "ok": true,
  "model": "@cf/baai/bge-m3",
  "indexVersion": "rag-bge-m3-v1",
  "queryText": "リモート勤務の申請期限は？",
  "queryVectorDimensions": 1024,
  "vectorMatchCount": 1,
  "d1FoundCount": 1,
  "response": {
    "query": "リモート勤務の申請期限は？",
    "topK": 3,
    "indexVersion": "rag-bge-m3-v1",
    "noAnswerRecommended": false,
    "results": [
      {
        "sourceId": "1",
        "chunkId": "remote-work-policy__s1__c1",
        "documentSlug": "remote-work-policy",
        "documentTitle": "リモート勤務規程",
        "headingPath": ["対象と申請"],
        "category": "policy",
        "tags": ["policy", "remote", "attendance"],
        "score": 0.7043135
      }
    ]
  }
}
```

確認応答には、返却された根拠カード向けの架空fixture抜粋が含まれました。
この証跡には、確認用キー、cookie、provider raw error、secret値を記録していません。

## 確認コマンド

```bash
corepack pnpm run typecheck
corepack pnpm run lint
corepack pnpm run test -- tests/worker/provider-search-check.test.ts tests/worker/internal-provider-search-check.test.ts
```

結果:

- `typecheck`: 通過
- `lint`: 通過
- provider search connection checks: 通過、 27 files / 101 tests

## この記録に含めない範囲

- 公開`/api/search`は、この時点ではmock lexical retrievalを使っています。
- `vectorize-fixture-index-readiness-2026-05-01.md` にfull fixture Vectorize upsertを記録する前に取得した確認です。
- 後続のfull fixture upsertでは`vectorCount: 24`を確認していますが、この確認はupsert後に再実行していません。
- 既知のquery pathを1件だけ確認しています。
- Claudeは呼び出さず、回答生成も行いません。
- provider接続確認記録であり、検索品質の記録ではありません。
