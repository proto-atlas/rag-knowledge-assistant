# UI screenshot確認記録

生成日時: 2026-04-30
確認種別: ローカルUIスクリーンショット取得
方法: `corepack pnpm run evidence:ui`
外部呼び出し: なし

## 対象

この記録では、モック化した `/api/search` 応答を使ったローカルVite UIのスクリーンショットを残す。
Claude、Workers AI、Vectorize、D1、Cloudflareは呼び出していません。

## スクリーンショット

| 画面 | ファイル | 確認内容 |
|---|---|---|
| トップページ | `docs/evidence/screenshots/ui-top-2026-04-30.png` | 架空文書、RAGの流れ、索引状態、検索評価の要約を確認。 |
| 検索とモックSSE回答 | `docs/evidence/screenshots/ui-search-answer-2026-04-30.png` | モック化した `/api/search` 応答と `/api/ask` のSSE回答を確認。 |
| 引用番号から根拠カードへの移動 | `docs/evidence/screenshots/ui-citation-focus-2026-04-30.png` | 回答内の引用番号を押すと、対応する根拠カードへフォーカスが移ることを確認。 |

## 補足

- この取得で使った確認用キーはローカル確認用の値です。
- ブラウザテストで、確認用キーがlocalStorageやsessionStorageに保存されないことを確認しています。
- スクリーンショット取得では `/api/ask` をSSE応答としてモック化しています。Claudeは呼び出していません。
- このスクリーンショット記録は、実プロバイダー連携の証明ではありません。
