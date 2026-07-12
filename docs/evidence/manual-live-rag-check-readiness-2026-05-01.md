# 手動の実API RAG確認の準備記録

生成日時: 2026-05-01T09:47:23+09:00
確認環境: ローカル実行
確認種別: 手動の実API確認の準備確認
結果: 部分的に成功

この記録では、手動の実API確認ヘルパーとチェックリストを残す。
Claude、Workers AI、Vectorize、D1、デプロイ済みWorker経路は呼び出していません。

## 対象

追加したファイル:

- `src/rag/manual-live-check.ts`
- `tests/rag/manual-live-check.test.ts`
- `scripts/manual-live-rag-check.mjs`

更新したファイル:

- `package.json`
- `docs/MANUAL-LIVE-CHECK.md`
- `README.md`
- `docs/verification.md`

## 挙動

`check:manual-live-rag` は、明示的なコスト承認後に使う手動専用スクリプトです。

確認フラグがない場合、スクリプトは実行を拒否します。

```bash
--confirm-manual-live-rag-check
```

必要な実行時環境変数:

- `RAG_LIVE_CHECK_URL`
- `RAG_ACCESS_KEY`

スクリプトの対象は意図的に以下へ絞っています。

- 回答できる質問1件
- 回答しない質問1件
- 一括評価なし
- 負荷確認なし
- 機密文書なし

サニタイズ済みのローカル要約を以下へ書き出します。

```text
.tmp/manual-live-rag-check/summary.json
```

`.tmp` の出力はcommitしません。

## 確認コマンド

```bash
corepack pnpm vitest run tests/rag/manual-live-check.test.ts
corepack pnpm run check:manual-live-rag
```

結果:

- 対象テスト: 成功、1 file / 5 tests
- 確認フラグなしの確認コマンド: 想定どおり拒否
- 実APIリクエストは実行していません

## sanitization確認

ヘルパーは検証記録本文ではなく、event typeの要約情報を記録します。

確認する内容:

- `sources` で返された根拠ID
- `answer_delta` count
- `done`
- `no_answer`
- `source_validation_failed`
- provider `error`
- 漏えいした可能性のある機密値らしい文字列

## この記録に含めない範囲

- Claude API呼び出しは実行していません。
- このスクリプトからWorkers AIリクエストは実行していません。
- このスクリプトからVectorize queryは実行していません。
- このスクリプトからD1 readは実行していません。
- デプロイ済みWorker URLは呼び出していません。
- 一般的なRAG品質を証明するものではありません。
- abort後のprovider側コスト取り消しを証明するものではありません。

## 次の作業

手動の実API確認は、コスト発生の明示承認とsecret設定の後だけ実行します。
実行する場合は、sanitize済みsummaryから日付付きの別証跡ファイルを作り、対象範囲を明記します。
