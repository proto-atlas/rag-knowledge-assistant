# 手動の実API RAG接続確認記録

生成日時: 2026-05-05T05:01:35.269Z
公開URL: https://rag-knowledge-assistant.atlas-lab.workers.dev
Worker version: `89c540e9-f754-47ca-b0af-9d2e7d6e0ed8`
code deploy version: `16fb7705-3098-48e8-bf2b-d5360260322c`
Commit: `5bd3eef`
確認種別: 実プロバイダー接続確認
結果: 通過

## 日本語要約

この記録は、確認用キーで利用を制限した確認用の実プロバイダー構成で、Workers AI、Vectorize、D1、Anthropicストリーミング回答の最小確認を実行した特定時点ログです。

- 確認したこと: 回答できる質問1件と回答しない質問1件の制限付き実プロバイダー経路
- 結果: 2件とも通過
- 読み方: 確認用の実プロバイダー構成の代表経路が、指定時点の公開Workerで動いたことを示します
- この記録に含めない範囲: 本番認証、機密文書運用、一般化されたRAG品質、中断後のプロバイダー側コスト取り消し

## 対象

- 回答できる質問: 1件
- 回答しない質問: 1件
- 一括評価: false
- 負荷確認: false
- 機密文書: false

## 設定

- 検索プロバイダー設定: `vectorize-d1`
- 回答プロバイダー設定: `anthropic`
- 有効な索引バージョン: `rag-bge-m3-v1`
- Claudeモデル: `claude-sonnet-4-6`
- 最大トークン数: 256
- D1 fixture rows: document 8件 / chunk 24件
- Vectorize vector count: fixture vector 24件

## 結果

| ケース | HTTP | 結果 | event types | 補足 |
|---|---:|---|---|---|
| 回答できる質問 | 200 | 通過 | `retrieval_start`, `sources`, `generation_start`, `answer_delta`, `done` | `answerDeltaCount=9`, `hasSources=true`, `hasDone=true`, `hasProviderError=false`, `hasSourceValidationFailed=false`, `sourceIds=1,2,3,4,5` |
| 回答しない質問 | 200 | 通過 | `retrieval_start`, `sources`, `no_answer`, `done` | `answerDeltaCount=0`, `hasNoAnswer=true`, `hasProviderError=false`, `hasSourceValidationFailed=false`, `sourceIds=1,2,3,4,5` |

## 記録しない情報

- Cookieの記録: なし
- 確認用キーの記録: なし
- Anthropic API keyの記録: なし
- 実プロバイダーの応答本文は記録していません。
- プロンプトの記録: なし
- スタックトレースの記録: なし

確認スクリプトは、スクリプト自身が送信する確認用キーだけを漏えい検査の対象にします。Anthropic API keyは確認スクリプトへ渡さず、Worker secretとして保持します。

## この記録に含めない範囲

- これはbulk evalではありません。
- これはload testではありません。
- 一般的なRAG品質を証明するものではありません。
- 本番利用者認証を証明するものではありません。
- abort後のprovider側コスト取り消しを証明するものではありません。
