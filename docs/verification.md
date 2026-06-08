# 確認ガイド

このプロジェクトは、架空文書を使ったRAG確認画面です。主な確認対象は、検索設計、評価、回答しない判定、引用元ID検証、SSE UI、フロントエンドの状態管理です。

このアプリは、確認用キーで検索・回答APIの利用量を抑えています。未認証トップページでは外部プロバイダーを呼ばず、確認用キー付きの検索と回答生成でWorkers AI、Vectorize、D1、Anthropicを呼びます。本番認証、非公開文書運用、一般化されたRAG品質は主張しません。

## 最初に見る場所

1. 公開UI
   - 架空文書一覧
   - RAGの流れ
   - 索引状態
   - 検索評価の要約
   - 確認用キー付き検索フォーム
2. 検索評価の記録
   - `docs/evidence/retrieval-eval-2026-04-30.md`
   - `docs/evidence/provider-retrieval-eval-2026-05-02.md`
   - `docs/evidence/external-benchmark-eval-2026-05-03.md`
3. UIスクリーンショット
   - `docs/evidence/ui-screenshots-2026-04-30.md`
4. フロントエンドのアクセシビリティ記録
   - `docs/evidence/a11y-review-2026-05-02.md`
   - `docs/evidence/axe-a11y-2026-05-02.md`
   - `docs/evidence/screen-reader-manual-a11y-2026-05-03.md`
5. 検証記録の索引
   - `docs/evidence/INDEX.md`
6. アーキテクチャ
   - `docs/ARCHITECTURE.md`
7. 実プロバイダー連携の設計
   - `docs/PROVIDER-BINDINGS.md`
   - `docs/MANUAL-LIVE-CHECK.md`
   - `docs/DEPLOYMENT.md`
8. 実装境界
   - `src/rag/mock-search.ts`
   - `src/rag/provider-search.ts`
   - `src/rag/retrieval-eval.ts`
   - `src/client/App.tsx`
   - `src/client/ask-api.ts`
   - `src/worker/app.ts`

## 現在の実装境界

確認済み:

- 動的検索は確認用キーで保護しています。
- 確認用キーはコスト保護用であり、本番認証ではありません。
- Clientの根拠だけを検索するUIは `POST /api/search` を呼びます。
- 回答生成UIは `POST /api/ask` を直接呼び、プロジェクト独自のRAG SSE eventsを受け取ります。
- `/api/ask` はsourcesをanswer deltasより先に送るため、通常の回答の流れで事前に `/api/search` を呼ぶ必要はありません。
- 検索評価の記録は固定の架空fixtureに基づきます。
- 実プロバイダー準備用の補助処理は、Workers AIの埋め込み出力、Vectorizeのquery options、Vectorizeの検索結果変換を扱います。
- Vectorize index `rag-bge-m3-v1` は24件の架空chunkを持ちます。
- Vectorize metadata indexesは `indexVersion` と `category` を対象にしています。
- `wrangler.jsonc` はWorkers AI、Vectorize、D1 bindingsを含みます。
- Remote D1 database `rag-knowledge-assistant-db` には8件の架空文書と24件のseed済みchunkがあります。
- 実プロバイダー検索評価は、25件の固定架空fixtureに対して確認用キー付き実プロバイダー経路で記録済みです。
- External benchmark subset evalはMr. TyDi Japanese dev subsetに対するローカル字句検索の基準値として記録済みです。公式Mr. TyDi full-corpus scoreや実プロバイダー経路の品質ではありません。
- Windows Narratorによる手動確認は主要7状態の公開UI導線に対する記録です。完全なWCAG監査や製品別比較ではありません。
- IP単位のAPI呼び出し制限は `/api/search` と `/api/ask` に実装し、unit testで記録済みです。本番ユーザー認証、ユーザー別上限、キー別上限ではありません。
- `/api/search` は実API確認用のデプロイ設定で `RAG_SEARCH_PROVIDER_MODE=vectorize-d1` を使います。
- `/api/ask` は実API確認用のデプロイ設定で `RAG_ANSWER_PROVIDER_MODE=anthropic` と `RAG_ENABLE_ANTHROPIC_LIVE=true` を使います。
- Anthropic回答プロバイダーはfake-fetch testsで境界確認しています。
- 確認用キー付きの手動確認で、回答できる質問1件のWorkers AI / Vectorize / D1 / Anthropicストリーミング経路を確認済みです。
- 手動確認チェックリストに沿って、回答できる質問1件と回答しない質問1件の実API確認を記録済みです。
- 過去のモック応答だけのCloudflare Workers deploymentは検証記録に保存しています。

この節に含めない範囲:

- 反復的なClaude API実API評価を実行済みとは主張しません。
- Claude実APIの回答品質を一般化して主張しません。
- Anthropic raw SSE eventをfrontendへforwardしません。
- Anthropic準備記録はfake provider streamsのみです。
- 手動の実API RAG確認は回答できる質問1件と回答しない質問1件のみの特定時点の記録です。
- 本番認証、WAF、監査ログ、ユーザー別上限、キー別上限は未実装です。
- `wrangler.jsonc` はWorkers AI、Vectorize、D1 bindingsを含みますが、Claude provider secret値はリポジトリに含めません。

## 確認用キーを要求する理由

確認用キーは公開URLのコスト保護用です。ユーザー認証ではありません。

実プロバイダー経路では、検索だけのrequestでも質問の埋め込みやベクトル検索が発生し、コストや大量送信リスクを持ちます。そのため動的検索と回答生成は保護しています。

本番化する場合は、ユーザー認証、キー更新、ユーザー別のAPI呼び出し制限、監査ログ、不正利用監視、文書単位のアクセス制御が必要です。

## 検証記録の方針

各検証記録は特定時点の記録です。以後のcommit、deployment、プロバイダー設定でも同じ結果になるという主張ではありません。

各検証記録には、時刻、確認種別、方法、範囲、結果、既知の制約を含めます。secretや端末固有の絶対パスは含めません。

## RAG評価メモ

固定fixtureの検索評価:

| 指標 | 値 |
|---|---:|
| 回答できるfixture | 20 |
| 回答しないfixture | 5 |
| hit@1 | 0.900 |
| hit@3 | 1.000 |
| hit@5 | 1.000 |
| MRR | 0.950 |
| 回答しない判定の正解率 | 1.000 |
| 失敗ケース | 0 |

この値はローカルのモック検索だけを測ったものです。Workers AI + Vectorizeの検索品質、Claude回答品質、本番RAG品質ではありません。

実プロバイダー検索評価も同じ25件の固定架空fixtureに対する小規模な検索専用検証です。Claude回答品質、公開デプロイ済みの実プロバイダー経路、大規模コーパスでのRAG品質は測っていません。

25件の架空fixtureは検索評価用の構成と同じプロジェクト内で作成されています。未学習データを使った外部ベンチマークではありません。

External benchmark subset evalはMr. TyDi Japanese dev split由来のquery/gold document idを使う別ログです。正解文書とサンプリングした非正解文書を含む候補subsetに対するローカル字句検索の基準値であり、実プロバイダー経路のVectorize検索や公式Mr. TyDi full-corpus scoreではありません。

## 確認できる範囲

このプロジェクトで確認できること:

- この公開画面は確認用キーで利用を制限しています。
- RAGのUI、根拠カード、サーバー側SSE、回答しない判定、引用ID検証、検証記録設計を確認できます。
- 実プロバイダー経路はWorkers AI / Vectorize / D1 / Anthropic境界として実装し、限定した実プロバイダー設定で有効化します。
- 外部dataset由来の小規模subset baselineも記録していますが、実プロバイダー経路の品質や本番RAG品質とは分けて扱っています。
- 確認用キーはAPI呼び出し制限であり、本番認証ではありません。
- IP単位のAPI呼び出し制限は確認用キーと並列のAPI呼び出し制限であり、本番認証、ユーザー別上限、キー別上限ではありません。
- 手動の実API確認は日時と件数を限定した検証です。

補足:

- Anthropic実APIモードでは、引用元ID検証を回答生成後に行います。ストリーミング中に `answer_delta` を受け取り、ストリーム完了後に引用IDを検証します。
- そのため「不正な引用回答を表示前に完全遮断」とは主張しません。引用ID検証失敗を検出し、通常回答として扱わないUI状態へ落とす境界として説明します。

このプロジェクトで扱わない範囲:

- 本番RAG SaaSと言うこと。
- Claude実APIの回答品質を一般化して検証済みと言うこと。
- 実プロバイダー検索評価を一般的なRAG品質ベンチマークとして扱うこと。
- external benchmark subset evalを公式full-corpus scoreとして扱うこと。
- 確認用キーを本番認証と呼ぶこと。
