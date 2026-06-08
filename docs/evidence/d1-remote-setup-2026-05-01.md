# D1 remote setup確認記録

生成日時: 2026-05-01T00:36:00+09:00
確認環境: ローカル実行
確認種別: Cloudflare D1の手動setupとmigration確認
結果: 通過

この記録では、RAGのsource of truth層で使うremote D1設定を残す。

この記録で確認していないこと:

- 公開 `/api/search` を実プロバイダー設定へ切り替えるものではありません。
- アプリケーションrouteからD1をqueryしません。
- fixture documentsやchunksをD1へseedしません。
- Workers AI、Vectorize、Claudeは呼び出しません。
- RAG検索品質全体を証明するものではありません。
- Workerはデプロイしません。

## 対象

- Database name: `rag-knowledge-assistant-db`
- Binding name: `RAG_DB`
- Region hint: `APAC`
- Migrations applied:
  - `0001_initial.sql`
  - `0002_chunk_record_id.sql`
- Wrangler config updated: yes
- remote D1 queryはtable一覧の読み取りだけを実行した

## D1作成

コマンド:

```bash
corepack pnpm wrangler d1 create rag-knowledge-assistant-db --location apac
```

結果要約:

```json
{
  "database_name": "rag-knowledge-assistant-db",
  "database_id": "7a9b54db-b72a-4bf6-bc3d-f56537ad50fa",
  "region": "APAC"
}
```

## migration適用

Command:

```bash
corepack pnpm wrangler d1 migrations apply RAG_DB --remote
```

結果要約:

```json
{
  "migrations": ["0001_initial.sql", "0002_chunk_record_id.sql"],
  "status": "通過",
  "commandsExecuted": [7, 6]
}
```

## schema確認

Command:

```bash
corepack pnpm wrangler d1 execute RAG_DB --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

出力要約:

| 項目 | 結果 |
| --- | --- |
| 実行結果 | 成功 |
| table一覧 | `_cf_KV`, `chunks`, `d1_migrations`, `documents`, `index_runs`, `sqlite_sequence` |
| served_by_region | `APAC` |
| rows_written | `0` |

chunk schema確認:

```json
{
  "chunkPrimaryKey": "chunk_record_id",
  "chunkIdColumn": "chunk_id",
  "uniqueChunkVersionIndex": true,
  "activeVersionIndex": "idx_chunks_active_version",
  "documentVersionIndex": "idx_chunks_document_version",
  "chunkIdIndex": "idx_chunks_chunk_id"
}
```

## pass基準

- remote D1 database作成: 通過。
- Wrangler config contains a `RAG_DB` binding: 通過。
- 初期migrationをremote databaseへ適用: 通過。
- reindex向けchunk record migrationをremote databaseへ適用: 通過。
- 期待するapplication tableの存在: 通過。
- `chunks` can store versioned chunk records through `chunk_record_id` and `UNIQUE(chunk_id, index_version)`: 通過。
- 確認用queryは読み取り専用で、書き込み行数は0: 通過。
- この記録には含めていません: 確認用キー、cookie、provider secret: 通過。

## この記録に含めない範囲

- D1にはこの時点ではschemaだけがあり、fixture dataはseedしていない。
- D1-backed source retrievalはローカルunit testのみで確認し、live Worker route queryはまだ実行していない。
- `/api/search` still uses mock lexical retrieval.
- deploymentはまだ実行していない。
