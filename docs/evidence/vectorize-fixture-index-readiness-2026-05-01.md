# Vectorize確認用データ索引の確認記録

生成日時: 2026-05-01T01:38:00+09:00
確認環境: ローカル実行
確認種別: 全fixtureのVectorize file生成とupsert確認
結果: 通過

この記録では、全fixtureの埋め込みファイル生成、Vectorize upsert、`vectorCount: 24` の準備状態を確認する。実プロバイダー経路のhit@k、MRR、回答しない判定の品質、Claude回答品質は評価しない。

この記録では、架空fixture chunkをVectorizeへindexingするための準備手順を残す。
remote D1 seedと同じindex planからVectorize upsert用NDJSONを作るscriptを追加しました。

この記録に含めない範囲:

- Claudeは呼び出しません。
- 公開 `/api/search` を実プロバイダー設定へ切り替えるものではありません。
- Workerはデプロイしません。
- `wrangler vectorize info` はlocal command環境ではなく、project ownerの認証済みshellから取得しました。

## 対象

追加したファイル:

- `src/rag/vectorize-index-files.ts`
- `tests/rag/vectorize-index-files.test.ts`
- `scripts/create-vectorize-fixture-files.mjs`

更新したファイル:

- `package.json`

追加したscript:

```bash
corepack pnpm run vectorize:fixtures -- --confirm-live-vectorize-fixture-embedding
```

scriptの処理:

- D1 seedで使うものと同じ8件の架空Markdown fixture documentを読む。
- 同じ`rag-bge-m3-v1` index planを作る。
- 明示的な確認flagがある場合だけ、24件のchunk textをWorkers AIへ送る。
- `.tmp/vectorize-fixtures/embeddings.ndjson` を書き出す。
- `.tmp/vectorize-fixtures/summary.json` を書き出す。

## 確認コマンド

```bash
corepack pnpm run typecheck
corepack pnpm run lint
corepack pnpm run test -- tests/rag/vectorize-index-files.test.ts
```

結果:

- `typecheck`: 通過
- `lint`: 通過
- vectorize fixture generation tests: 通過、 28 files / 107 tests

## 実API fixture embeddingとupsert

Command:

```bash
corepack pnpm run vectorize:fixtures -- --confirm-live-vectorize-fixture-embedding
```

結果:

- 通過
- model: `@cf/baai/bge-m3`
- vectorCount: 24
- outputDir: `.tmp/vectorize-fixtures`
- generatedAt: `2026-04-30T23:08:57.412Z`

Upsert command:

```bash
corepack pnpm wrangler vectorize upsert rag-bge-m3-v1 --file .tmp/vectorize-fixtures/embeddings.ndjson --json
```

結果:

```json
{
  "index": "rag-bge-m3-v1",
  "count": 24
}
```

Generated summary:

```json
{
  "indexRunId": "seed-rag-bge-m3-v1",
  "indexVersion": "rag-bge-m3-v1",
  "vectorCount": 24,
  "chunkIds": [
    "remote-work-policy__s1__c1",
    "remote-work-policy__s2__c1",
    "remote-work-policy__s3__c1",
    "expense-policy__s1__c1",
    "expense-policy__s2__c1",
    "expense-policy__s3__c1",
    "security-handbook__s1__c1",
    "security-handbook__s2__c1",
    "security-handbook__s3__c1",
    "incident-response__s1__c1",
    "incident-response__s2__c1",
    "incident-response__s3__c1",
    "onboarding-guide__s1__c1",
    "onboarding-guide__s2__c1",
    "onboarding-guide__s3__c1",
    "product-faq__s1__c1",
    "product-faq__s2__c1",
    "product-faq__s3__c1",
    "support-escalation__s1__c1",
    "support-escalation__s2__c1",
    "support-escalation__s3__c1",
    "release-process__s1__c1",
    "release-process__s2__c1",
    "release-process__s3__c1"
  ]
}
```

## upsert後のinfo確認

Command:

```bash
corepack pnpm wrangler vectorize info rag-bge-m3-v1 --json
```

結果:

```json
{
  "dimensions": 1024,
  "vectorCount": 24,
  "processedUpToDatetime": "2026-04-30T23:08:57.423Z",
  "processedUpToMutation": "b4ef6c9b-1a84-433a-bec6-4e9098717329"
}
```

## この記録に含めない範囲

- 公開`/api/search`は、この時点ではmock lexical retrievalを使っています。
- 24-vectorすべてのupsert後にprovider search checkを再実行し、更新後の挙動を記録する必要があります。
