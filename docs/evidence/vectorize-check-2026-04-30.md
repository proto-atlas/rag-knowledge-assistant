# Vectorize接続確認記録

生成日時: 2026-04-30T23:45:00+09:00
確認環境: ローカル実行
確認種別: Workers AI + Vectorize手動確認
結果: 部分的に成功

この記録では、Claudeを呼ばない最初のVectorize確認を残す。
少数の架空chunkをWorkers AIでembeddingし、Vectorizeへupsertし、vector idでqueryできることを確認しました。

この記録に含めない範囲:

- RAG検索品質全体を証明するものではありません。
- D1 source-of-truth挙動を証明するものではありません。
- Claudeによる回答生成を証明するものではありません。
- Worker binding経由のmetadata filter挙動を証明するものではありません。
- 生のembedding vectorは含めません。

## 対象

- embedding model: `@cf/baai/bge-m3`
- Vectorize index: `rag-bge-m3-v1`
- dimensions: `1024`
- metric: `cosine`
- upsertしたchunk数: `3`
- query method: `vector-id`
- Claude API call: no
- D1 migration / query: no
- Cloudflare deploy: no

## 確認入力の要約

Workers AI embedding確認の出力:

```json
{
  "ok": true,
  "generatedAt": "2026-04-30T14:36:25.278Z",
  "model": "@cf/baai/bge-m3",
  "summary": {
    "checkRunId": "vectorize-check-2026-04-30T14-36-24-883Z",
    "indexVersion": "rag-bge-m3-v1",
    "chunkIds": [
      "remote-work-policy__s1__c1",
      "security-handbook__s3__c1",
      "release-process__s1__c1"
    ],
    "vectorCount": 3,
    "queryText": "リモート勤務の申請期限は？",
    "queryVectorDimensions": 1024
  }
}
```

補足:

- local output directoryは、この証跡へ意図的にコピーしていません。
- raw vectorは`.tmp/vectorize-check/`だけへ書き込み、docsへコピーしていません。

## upsert

コマンド:

```bash
corepack pnpm wrangler vectorize upsert rag-bge-m3-v1 --file .tmp/vectorize-check/embeddings.ndjson --json
```

出力:

```json
{
  "index": "rag-bge-m3-v1",
  "count": 3
}
```

## query

コマンド:

```bash
corepack pnpm wrangler vectorize query rag-bge-m3-v1 --vector-id remote-work-policy__s1__c1 --top-k 3 --return-metadata all
```

出力summary:

```json
{
  "count": 3,
  "matches": [
    {
      "id": "remote-work-policy__s1__c1",
      "score": 0.9999987,
      "metadata": {
        "category": "policy",
        "chunkId": "remote-work-policy__s1__c1",
        "documentSlug": "remote-work-policy",
        "documentTitle": "リモート勤務規程",
        "headingPath": ["対象と申請"],
        "indexVersion": "rag-bge-m3-v1",
        "checkRunId": "vectorize-check-2026-04-30T14-36-24-883Z",
        "tags": ["policy", "remote", "attendance"]
      }
    },
    {
      "id": "release-process__s1__c1",
      "score": 0.51515996,
      "metadata": {
        "category": "release",
        "chunkId": "release-process__s1__c1",
        "documentSlug": "release-process",
        "documentTitle": "リリース手順",
        "headingPath": ["リリース判定"],
        "indexVersion": "rag-bge-m3-v1",
        "checkRunId": "vectorize-check-2026-04-30T14-36-24-883Z",
        "tags": ["release", "quality", "test"]
      }
    },
    {
      "id": "security-handbook__s3__c1",
      "score": 0.49507526,
      "metadata": {
        "category": "security",
        "chunkId": "security-handbook__s3__c1",
        "documentSlug": "security-handbook",
        "documentTitle": "セキュリティハンドブック",
        "headingPath": ["外部共有"],
        "indexVersion": "rag-bge-m3-v1",
        "checkRunId": "vectorize-check-2026-04-30T14-36-24-883Z",
        "tags": ["security", "sharing", "repository"]
      }
    }
  ]
}
```

## upsert後のindex info

コマンド:

```bash
corepack pnpm wrangler vectorize info rag-bge-m3-v1 --json
```

出力:

```json
{
  "dimensions": 1024,
  "vectorCount": 3,
  "processedUpToDatetime": "2026-04-30T14:37:30.115Z",
  "processedUpToMutation": "722ddfdd-4d80-45b7-ae5d-eeec7c9fbab4"
}
```

## filter補足

metadata filter付きCLI queryは結果を返しましたが、Wranglerが`Invalid query filter` warningを出しました。
そのため、この確認ではwarningの出ない基本的な `vector-id` queryをpass結果として扱います。

次の確認:

- 実プロバイダー設定で有効な `indexVersion` filterの挙動を主張する前に、Worker binding経由でmetadata filteringを確認する。
- live binding checkで実runtime挙動を確認するまで、provider codeのfilter期待値はunit testで担保する。

## pass基準

- Workers AI embedding checkが1024次元のvectorを生成した: 通過。
- Vectorize upsertが3件のvectorを受け付けた: 通過。
- vector idによるVectorize queryが、期待vectorをtop matchとして返した: 通過。
- upsert後のVectorize index infoで`vectorCount: 3`を確認した: 通過。
- この記録にはsecret、cookie、raw vector、完全なlocal pathを含めていません: 通過。

## この記録に含めない範囲

- これは接続確認であり、retrieval evalではありません。
- queryには生成したnatural-language query vectorではなく、既存のvector idを使いました。
- 挿入したのは架空chunk 3件だけです。
- 実プロバイダー検索には、D1-backed source retrievalとWorker binding integrationがまだ必要です。
