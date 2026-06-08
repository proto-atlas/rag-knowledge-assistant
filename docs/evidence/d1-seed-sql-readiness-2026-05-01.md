# D1 seed SQL確認記録

生成日時: 2026-05-01T00:48:00+09:00
確認環境: ローカル実行
確認種別: ローカルD1 seed SQL生成とremote D1 seed確認
結果: 通過

この記録では、D1 fixture seed SQLの準備手順を残す。
架空fixture corpusをremote D1 schema向けの冪等なSQL seed fileへ変換できることを確認した。

この記録で確認していないこと:

- 公開 `/api/search` を実プロバイダー設定へ切り替えるものではありません。
- アプリケーションrouteからD1をqueryしません。
- Workers AI、Vectorize、Claudeは呼び出しません。
- Workerはデプロイしません。

## 対象

追加したファイル:

- `src/rag/d1-seed-sql.ts`
- `tests/rag/d1-seed-sql.test.ts`
- `scripts/create-d1-seed-sql.mjs`

更新したファイル:

- `package.json`

生成したlocal file:

- `.tmp/d1-seed/seed.sql`

seed summary:

```json
{
  "indexRunId": "seed-rag-bge-m3-v1",
  "indexVersion": "rag-bge-m3-v1",
  "embeddingModel": "@cf/baai/bge-m3",
  "vectorizeIndexName": "rag-bge-m3-v1",
  "documentCount": 8,
  "chunkCount": 24
}
```

## 確認した挙動

- seed SQLは `BEGIN TRANSACTION`、`COMMIT`、`SAVEPOINT` を含まない。
- 同じ `indexVersion` の既存chunkを削除してから、置き換え用chunkを挿入する。
- `index_runs` uses upsert semantics.
- `documents` uses update-in-place upsert semantics instead of `INSERT OR REPLACE`.
- `chunks` inserts versioned `chunk_record_id` rows.
- SQL string literalではsingle quoteをescapeする。
- 有限でない数値は拒否する。

## コマンド

```bash
corepack pnpm run typecheck
corepack pnpm run lint
corepack pnpm run test -- tests/rag/d1-seed-sql.test.ts tests/rag/index-plan.test.ts tests/rag/d1-schema.test.ts
corepack pnpm run seed:d1-sql
```

結果:

- `typecheck`: 通過
- `lint`: 通過
- related unit tests: 通過、 23 files / 91 tests
- `seed:d1-sql`: 通過

## D1 import互換性メモ

最初に生成したseed fileには、明示的なtransaction statementが含まれていた。
Cloudflare D1は、このimportを次の内容で拒否しました:

```text
エラー本文: `To execute a transaction, please use the state.storage.transaction() or state.storage.transactionSync() APIs instead of the SQL BEGIN TRANSACTION or SAVEPOINT statements.`
```

CloudflareのD1 import/export guidanceでは、import errorが起きる場合にdumped SQLから `BEGIN TRANSACTION` と `COMMIT` を取り除くよう説明している。
seed generatorを更新し、明示的なtransaction statementを出力しないようにした。

## remote seed

コマンド:

```bash
corepack pnpm wrangler d1 execute RAG_DB --remote --file .tmp/d1-seed/seed.sql --yes
```

結果:

- 通過
- processed 34 queries
- rows read: 2
- rows written: 179
- final bookmark: `00000004-0000000f-0000505d-3f0aa6604098b0095c6b9d9b291d2cb0`

remote row-count確認:

```json
{
  "documents": 8,
  "chunks": 24,
  "indexRuns": [
    {
      "index_run_id": "seed-rag-bge-m3-v1",
      "index_version": "rag-bge-m3-v1",
      "status": "succeeded"
    }
  ]
}
```

確認したコマンド:

```bash
corepack pnpm wrangler d1 execute RAG_DB --remote --command "SELECT COUNT(*) AS document_count FROM documents;" --json
corepack pnpm wrangler d1 execute RAG_DB --remote --command "SELECT COUNT(*) AS chunk_count FROM chunks;" --json
corepack pnpm wrangler d1 execute RAG_DB --remote --command "SELECT index_run_id, index_version, status FROM index_runs;" --json
```

## この記録に含めない範囲

- ローカルのseed SQL fileは `.tmp/` 配下に生成し、公開evidenceには含めない。
- D1-backed source retrievalはこの時点では `/api/search` へ接続していない。
- live Worker routeからD1へのqueryはまだ実行していない。
- remote D1にはfixture corpus rowsが入っているが、この記録はapplication route retrievalの証明ではない。
