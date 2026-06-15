# RAG Knowledge Assistant

[![品質確認](https://github.com/proto-atlas/rag-knowledge-assistant/actions/workflows/quality.yml/badge.svg)](https://github.com/proto-atlas/rag-knowledge-assistant/actions/workflows/quality.yml)

RAG Knowledge Assistantは、架空文書コーパスを使ったRAG確認画面です。React / TypeScript / Hono / Cloudflare Workers上で、検索、根拠カード、回答しない判定、SSEによる回答表示、生成後の引用ID検証を確認できます。

トップページ、架空文書、RAGフロー、評価サマリー、機能対応表、検証記録は確認用キーなしで見られます。実際にWorkers AI、Vectorize、D1、Anthropicを呼ぶ検索・回答APIは、利用量を抑えるため確認用キーで制限しています。このキーはユーザー認証ではありません。

## 公開URL

- 公開URL: https://rag-knowledge-assistant.atlas-lab.workers.dev
- GitHub: https://github.com/proto-atlas/rag-knowledge-assistant

## 短時間レビューガイド

30秒で見る場合は、公開URLのトップページから、架空文書、RAGフロー、評価サマリー、機能対応表を確認してください。この範囲では確認用キーは不要です。

検索と回答のAPIは確認用キーで制限しています。`/api/search` はWorkers AI、Vectorize、D1を使う検索、`/api/ask` は検索結果をもとにAnthropic APIで回答を少しずつ返す経路です。確認用キーはAPI呼び出しを抑えるためのもので、本番認証ではありません。

実装を見る場合は、まず [確認ガイド](./docs/verification.md)、[アーキテクチャ](./docs/ARCHITECTURE.md)、[検証記録の一覧](./docs/evidence/INDEX.md) を見てください。コードでは `src/rag/provider-search.ts`、`src/rag/retrieval-eval.ts`、`src/worker/app.ts` が入口になります。

## 主な流れ

- 架空文書をchunkに分け、D1 とVectorizeに保存する。
- 質問をWorkers AIでembeddingし、Vectorizeで近いchunkを探す。
- D1 から本文とmetadataを読み直し、根拠カードとして表示する。
- 根拠が足りない場合は回答しない状態として扱い、回答生成へ進めない。
- 回答生成後に引用IDを検証し、存在しない引用を通常回答として扱わない。

## 用語

- RAG: Retrieval-Augmented Generation。検索した根拠を使って回答を生成する構成。
- 根拠カード: 検索で見つけた根拠文書をUIに表示するカード。
- 回答しない判定: 検索根拠が足りない場合など、回答しないことを選ぶ状態。
- 確認用キー: 検索・回答APIの利用量を抑えるためのキー。ユーザーアカウントや権限管理ではありません。
- indexVersion: D1 とVectorizeのchunkを同じ世代として扱うための識別子。

## 画面

![UI挙動紹介](docs/images/rag-knowledge-assistant-streaming-ui-demo.gif)

このGIFは、質問入力、根拠カード表示、SSEによる回答表示、引用番号の表示を短く確認するためのものです。

| トップページ | 検索と回答 | 引用表示 |
| --- | --- | --- |
| ![トップページ](docs/evidence/screenshots/ui-top-2026-04-30.png) | ![検索と回答](docs/evidence/screenshots/ui-search-answer-2026-04-30.png) | ![引用表示](docs/evidence/screenshots/ui-citation-focus-2026-04-30.png) |

## ドキュメント

- [確認ガイド](./docs/verification.md)
- [アーキテクチャ](./docs/ARCHITECTURE.md)
- [検証記録の一覧](./docs/evidence/INDEX.md)
- [実プロバイダー連携の設計](./docs/PROVIDER-BINDINGS.md)
- [デプロイ確認手順](./docs/DEPLOYMENT.md)
- [手動の実API確認チェックリスト](./docs/MANUAL-LIVE-CHECK.md)

## 検証記録

主な検証記録は [docs/evidence/INDEX.md](./docs/evidence/INDEX.md) から確認できます。

- `corepack pnpm run test`: 41 files / 224 tests通過
- `corepack pnpm run test:e2e`: 9 tests通過
- 固定fixtureを使った検索評価: hit@1 0.900、hit@5 1.000、MRR 0.950。用意した質問で期待する根拠が上位に出るかを測った値です。
- Workers AI / Vectorize / D1 の接続確認
- 実プロバイダー検索評価: 25件の固定fixtureに対する検索だけの確認。Claudeの回答品質は測っていません。
- Mr. TyDi Japanese dev subsetを使ったローカル字句検索の基準値。公式のfull-corpus scoreではありません。
- 確認用キーとIP-based rate limit
- Lighthouse、axe-core、bundle size、SSE latency
- 画面スクリーンショットと手動の外部サービス接続確認

各検証は、その時点の構成と対象データに対する結果です。一般的なRAG品質、任意の文書集合への性能、Claude回答品質、本番認証を示すものではありません。

## ローカル実行

Node 24 とcorepackを使います。

```powershell
corepack pnpm install
corepack pnpm run dev
```

品質確認:

```powershell
corepack pnpm run typecheck
corepack pnpm run lint
corepack pnpm run test
corepack pnpm run build
corepack pnpm run build:worker
corepack pnpm run test:e2e
```

## 現在入れていないもの

- 本番運用向けのユーザー認証
- WAF、bot protection、ユーザー別または組織別のquota
- 任意ファイルアップロード
- PDF登録 / OCR
- 非公開文書や任意コーパスに対する実用RAG品質の評価
- 文書単位のアクセス制御

## ライセンス

MIT License。詳細は [LICENSE](LICENSE) を参照してください。
