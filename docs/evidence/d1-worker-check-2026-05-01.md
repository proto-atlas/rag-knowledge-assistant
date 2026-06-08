# D1 Worker接続確認記録

生成日時: 2026-05-01T01:25:00+09:00
確認環境: ローカル実行
確認種別: binding経由でremote D1を読む内部Worker route確認
結果: 通過

この記録では、Claudeを呼ばずにguarded internal Worker route経由でD1接続を確認した結果を残す。
Workerが `RAG_DB` binding経由でremote D1からseed済みfixture chunkを読めることを確認した。

この記録で確認していないこと:

- 公開 `/api/search` を実プロバイダー設定へ切り替えるものではありません。
- Workers AI、Vectorize、Claudeは呼び出しません。
- RAG検索品質全体を証明するものではありません。
- Workerはデプロイしません。
- 通常の公開運用で内部routeは露出しません。provider確認を明示的に有効化した場合だけ使います。

## 対象

追加したファイル:

- `src/worker/d1-check.ts`
- `tests/worker/d1-check.test.ts`
- `tests/worker/internal-d1-check.test.ts`

更新したファイル:

- `src/worker/app.ts`
- `src/worker/types.ts`

内部route:

- `POST /api/internal/d1-check`

guards:

- `RAG_ENABLE_PROVIDER_CHECK=true` を要求する。
- 管理用確認キーを要求する。
- provider checkが無効な場合は `404` を返す。
- 管理用確認キーがない場合は `401` を返す。

## リモート確認

コマンド形:

```bash
corepack pnpm wrangler dev --remote --port 8791 --local-protocol http \
  --var RAG_ENABLE_PROVIDER_CHECK:true \
  --var RAG_ADMIN_ACCESS_KEY:<local-check-admin-key>
```

確認リクエスト:

```bash
POST http://127.0.0.1:8791/api/internal/d1-check
Authorization: Bearer <local-check-admin-key>
```

結果要約:

```json
{
  "ok": true,
  "indexVersion": "rag-bge-m3-v1",
  "requestedChunkIds": [
    "remote-work-policy__s1__c1",
    "security-handbook__s3__c1",
    "release-process__s1__c1"
  ],
  "foundCount": 3,
  "chunkSummaries": [
    {
      "chunkId": "remote-work-policy__s1__c1",
      "documentSlug": "remote-work-policy",
      "documentTitle": "リモート勤務規程",
      "category": "policy",
      "headingPath": ["対象と申請"],
      "indexVersion": "rag-bge-m3-v1",
      "contentLength": 172
    },
    {
      "chunkId": "security-handbook__s3__c1",
      "documentSlug": "security-handbook",
      "documentTitle": "セキュリティハンドブック",
      "category": "security",
      "headingPath": ["外部共有"],
      "indexVersion": "rag-bge-m3-v1",
      "contentLength": 136
    },
    {
      "chunkId": "release-process__s1__c1",
      "documentSlug": "release-process",
      "documentTitle": "リリース手順",
      "category": "release",
      "headingPath": ["リリース判定"],
      "indexVersion": "rag-bge-m3-v1",
      "contentLength": 164
    }
  ]
}
```

確認responseには架空fixture textの短いpreviewだけを含めた。
確認用キー、cookie、provider raw error、secret値はこのevidenceに記録していない。

## 確認コマンド

```bash
corepack pnpm run typecheck
corepack pnpm run lint
corepack pnpm run test -- tests/worker/d1-check.test.ts tests/worker/internal-d1-check.test.ts
```

結果:

- `typecheck`: 通過
- `lint`: 通過
- D1 connection checks: 通過、 25 files / 96 tests

## この記録に含めない範囲

- 公開 `/api/search` はこの時点ではmock lexical retrievalを使う。
- 固定chunk idだけを読みます。
- Vectorize matchとD1 chunkのjoinは行いません。
- Claudeは呼び出しません。
- setup確認記録であり、検索品質の記録ではありません。
