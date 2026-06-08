# D1 source-of-truth確認記録

生成日時: 2026-05-01T00:31:00+09:00
確認環境: ローカル実行
確認種別: ローカルD1 source-of-truth境界確認
結果: 通過

この記録では、D1をsource of truthとして使うための最初の準備確認を残す。
D1 rowsから有効なchunk本文を読み取り、実プロバイダー経路の検索用の根拠カードへ変換する型付き境界を追加した。

実装前に確認した公式docs:

- 参照: Cloudflare D1 Workers Binding API: https://developers.cloudflare.com/d1/worker-api/
- 参照: Cloudflare D1 prepared statements: https://developers.cloudflare.com/d1/worker-api/prepared-statements/
- 参照: Cloudflare D1 migrations: https://developers.cloudflare.com/d1/reference/migrations/

この記録で確認していないこと:

- remote D1 databaseは作成しません。
- D1 migrationは実行しません。
- live D1 bindingはqueryしません。
- 公開 `/api/search` を実プロバイダー設定へ切り替えるものではありません。
- Claude APIは呼び出しません。
- RAG検索品質全体を証明するものではありません。

## 対象

追加したファイル:

- `src/rag/d1-source.ts`
- `tests/rag/d1-source.test.ts`

既存schema:

- `migrations/0001_initial.sql`

新しいboundaryでは、`activeIndexVersion` と `chunkIds` にprepared-statement placeholderとbound valueを使う。
SQL placeholder数は正規化済みchunk id数から決め、chunk id値そのものをSQL文字列へ埋め込まない。

## 確認した挙動

- D1 rowsを `SearchCorpusChunk` objectへ変換する。
- 不正なdocument categoryを拒否する。
- 不正な `metadata_json` shapeを拒否する。
- 不正な `heading_path` shapeを拒否する。
- 空または重複したchunk idはquery前に正規化する。
- 空のchunk id inputではqueryをprepareせず、空のmapを返す。
- 空のactive `indexVersion` を拒否する。
- query constructionにはactive `indexVersion` とchunk id filterを含める。

## コマンド

```bash
corepack pnpm run typecheck
corepack pnpm run lint
corepack pnpm run test -- tests/rag/d1-source.test.ts tests/rag/provider-search.test.ts
```

結果:

- `typecheck`: 通過
- `lint`: 通過
- related unit tests: 通過、 22 files / 86 tests

## この記録に含めない範囲

- これはfake D1 objectを使ったローカルboundary testである。
- remote D1 database作成とmigrationは、この時点では未実施である。
- D1 bindingはこの時点では `wrangler.jsonc` へ追加していない。
- D1-backed source retrievalはこの時点では `/api/search` へ接続していない。
- 古いVectorize vectorはmetadata filter設計で除外する。物理削除は今後の保守作業として残す。
