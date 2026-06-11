# Worker binding経由のVectorize確認記録

生成日時: 2026-05-01T00:21:16+09:00
確認環境: ローカル実行
確認種別: Worker runtime binding手動確認
結果: 通過

この記録では、Claudeを呼ばずにWorker runtime上のprovider bindingを確認した結果を残す。
制限付きの内部Worker routeが、Workers AIでquery embeddingを作成し、metadata filter付きでVectorizeへqueryできることを確認しました。

この記録に含めない範囲:

- RAG検索品質全体を証明するものではありません。
- D1 source-of-truth挙動を証明するものではありません。
- Claudeによる回答生成を証明するものではありません。
- Cloudflare deploymentを証明するものではありません。
- 公開 `/api/search` を実プロバイダー設定へ切り替えるものではありません。
- 生vector、確認用キー、cookie、provider secretは記録対象外です。

## 対象

- Route: `POST /api/internal/vectorize-check`
- Route exposure: `RAG_ENABLE_PROVIDER_CHECK=true` でない限り無効
- Route auth: admin確認用キーが必要
- Embedding model: `@cf/baai/bge-m3`
- Vectorize index: `rag-bge-m3-v1`
- Active index version: `rag-bge-m3-v1`
- Query text: `リモート勤務の申請期限は？`
- Query vector dimensions: `1024`
- Metadata filter:
  - `indexVersion = rag-bge-m3-v1`
  - `category = policy`
- Claude API call: no
- D1 migration/query: no
- Cloudflare deploy: no

## 結果

秘匿値を含まないresponse summary:

```json
{
  "ok": true,
  "model": "@cf/baai/bge-m3",
  "indexVersion": "rag-bge-m3-v1",
  "queryText": "リモート勤務の申請期限は？",
  "queryVectorDimensions": 1024,
  "filter": {
    "indexVersion": "rag-bge-m3-v1",
    "category": "policy"
  },
  "count": 1,
  "matches": [
    {
      "id": "remote-work-policy__s1__c1",
      "score": 0.7043135,
      "metadata": {
        "chunkId": "remote-work-policy__s1__c1",
        "documentSlug": "remote-work-policy",
        "category": "policy",
        "indexVersion": "rag-bge-m3-v1",
        "checkRunId": "vectorize-check-2026-04-30T14-36-24-883Z"
      }
    }
  ]
}
```

## pass基準

- `RAG_ENABLE_PROVIDER_CHECK=true` でない限りWorker routeが隠れることを、route実装とunit testで確認しました。
- 内部確認routeではadmin確認用キーが必要でした。unit testと手動確認でpassを確認しています。
- Worker実行環境がWorkers AIを呼び、1024次元のquery vectorを生成した: 通過。
- Worker実行環境が`RAG_VECTOR_INDEX` binding経由でVectorizeへqueryした: 通過。
- Metadata filterがactive index versionの期待`policy` chunkだけを返した: 通過。
- この記録にはsecret、cookie、raw vector、完全なlocal path、確認用キーを含めていません: 通過。

## この記録に含めない範囲

- provider binding確認であり、検索評価ではありません。
- natural-language queryは1件だけ確認しました。
- Vectorize indexには3-vectorの確認用corpusだけが存在していました。
- このrouteは意図的に内部確認用であり、通常の公開運用では有効にしません。
- `/api/search` をモック検索から切り替える前に、実プロバイダー検索にはD1-backed source retrievalがまだ必要です。
