# 手動の実プロバイダー確認チェックリスト

このチェックリストは、明示的なコスト承認後にだけ行う小さな手動の実プロバイダー確認用です。通常CIでは実行しません。

## 目的

保護付きのprovider経路が実bindingsで動くかを、最小件数で確認します。

- Workers AIによるquery embedding
- Vectorize search
- D1 source-card read
- Anthropic Messagesのstreaming answer
- 生成後の引用ID検証

## 事前条件

以下をすべて満たす場合だけ実行します。

- 明示的なコスト承認がある
- Anthropic Console側の支出上限を確認済み
- 実API確認期間用に新しい`RAG_ACCESS_KEY`を設定し、過去に配ったkeyと使い回さない
- Anthropic API keyがsecretまたは一時shell environment variableとして設定されている
- secretをchat、docs、commit、screenshot、evidenceへ貼らない
- `RAG_ANSWER_PROVIDER_MODE=anthropic`
- `RAG_ENABLE_ANTHROPIC_LIVE=true`
- `RAG_CLAUDE_MODEL` にmodel idを設定済み
- 手動確認では `RAG_ANTHROPIC_MAX_TOKENS=256` を明示設定済み
- `RAG_SEARCH_PROVIDER_MODE=vectorize-d1`
- `RAG_ACCESS_KEY` を設定済み
- `RAG_ACTIVE_INDEX_VERSION=rag-bge-m3-v1`
- `RAG_RATE_LIMIT_MAX_REQUESTS` と `RAG_RATE_LIMIT_WINDOW_SECONDS` を手動確認向けに小さく設定済み
- D1に8 fixture documentsと24 chunksがある
- Vectorize index `rag-bge-m3-v1` に24 vectorsがある

## 確認範囲

最大件数:

- 回答できる質問: 1件
- 回答しない質問: 1件

実施しないこと:

- bulk eval
- load test
- 任意のユーザー入力
- 機密文書入力
- repeated regeneration

## 実行コマンド

scriptは明示的なconfirmation flagなしでは実行を拒否します。

必要なenvironment variables:

- `RAG_LIVE_CHECK_URL`
- `RAG_ACCESS_KEY`

コマンド:

```bash
corepack pnpm run check:manual-live-rag -- --confirm-manual-live-rag-check
```

sanitized local summaryの出力先:

```text
.tmp/manual-live-rag-check/summary.json
```

`.tmp` outputsはcommitしません。

## 記録しない値の境界

手動確認スクリプトの機密値らしい文字列検出は、スクリプトが実際にheaderへ入れる確認用キーだけを対象にします。Anthropic API keyはスクリプトへ渡さず、Worker secretとして扱います。そのためAnthropic API keyの不記録は、Worker側のサニタイズ済みエラー / event設計、Worker secret削除、Console側key revokeで扱います。

## 確認ケース

回答できる質問:

```text
リモート勤務の申請期限は？
```

期待する挙動:

- `retrieval_start` を返す
- `sources` を返す
- `generation_start` を返す
- 1件以上の `answer_delta` を返す
- `done` を返す
- 引用された根拠IDが返却済みsources内に存在する
- raw provider response、prompt、stack trace、cookie、secretが出ない

通過条件:

- `hasDone=true`
- `hasSources=true`
- `answerDeltaCount > 0`
- `hasProviderError=false`
- `hasSourceValidationFailed=false`
- `sourceIds.length > 0`
- `leakedNeedles.length === 0`

回答しない質問:

```text
天気予報を教えて
```

期待する挙動:

- 検索根拠が弱い場合、プロバイダー呼び出し前に `no_answer` を返す
- `answer_delta` を返さない
- fabricated document-grounded answerを出さない
- raw provider response、prompt、stack trace、cookie、secretが出ない

通過条件:

- `hasDone=true`
- `hasSources=true`
- `hasNoAnswer=true`
- `answerDeltaCount === 0`
- `hasProviderError=false`
- `hasSourceValidationFailed=false`
- `leakedNeedles.length === 0`

## 引用ID検証の境界

Anthropic実APIモードでは、引用元ID検証を回答生成後に行います。`answer_delta` をストリーミングしながら受け取り、ストリーム完了後に引用IDを検証します。そのため、現時点では「検証前に一切表示しない」方式ではありません。

公開説明では、以下のように表現します。

```text
引用ID検証失敗を検出し、通常回答として扱わないUI状態へ落とします。
```

以下のような表現は使いません。

```text
不正citationを検出した場合は、通常回答として扱わない状態へ落とします。
```

## 検証記録テンプレートの書式

手動確認が完了した後だけ、日付付きのevidence fileを作成します。

推奨path:

```text
docs/evidence/manual-live-rag-check-YYYY-MM-DD.md
```

推奨内容:

```text
# 手動の実RAG確認記録

確認日時:
確認対象:
確認メモ:
確認種別: 実プロバイダー接続確認
結果:

## 対象

- 回答できる質問:
- 回答しない質問:
- 一括評価:
- 負荷確認:
- 機密文書:

## 設定

- 検索プロバイダー設定:
- 回答プロバイダー設定:
- 有効な索引バージョン:
- Claude model:
- D1 fixture rows:
- Vectorize vector count:

## 結果

| ケース | 結果 | メモ |
|---|---|---|
| 回答できる質問 |  |  |
| 回答しない質問 |  |  |

## 記録しない値

- APIキーの記録:
- Cookieの記録:
- 実プロバイダー応答本文の記録:
- プロンプトの記録:
- スタックトレースの記録:

## この記録に含めない範囲

- bulk evalではない。
- load testではない。
- 一般的なRAG品質を証明するものではない。
- abort後にprovider側の課金が取り消されることを証明するものではない。
```

## 停止条件

以下が出たら即停止します。

- provider raw errorがUIに出る
- 機密値らしい文字列がUI、ログ、検証記録に出る
- first requestがサーバー設定エラーで失敗する
- rate limitやquota behaviorが不明
- first requestが想定より多いcallを消費する
- 回答できる質問で `answerDeltaCount` が0のまま終わる
- `hasProviderError=true`
- `hasSourceValidationFailed=true`

スクリプトはケースごとの失敗を検出した時点でループを止め、残りケースを実行しません。最初のリクエストが失敗した場合、回答しない質問のリクエストは送信しません。

## 緊急rollback手順

確認用の実プロバイダー構成でプロバイダーエラー、想定外の課金、機密値らしい文字列の露出、またはAPI呼び出し制限挙動の不明点が出た場合は、短い時間で失敗扱いに戻します。

1. Anthropic Consoleで使用したAPI keyをrevokeする
2. `RAG_ANSWER_PROVIDER_MODE=mock` または `RAG_ENABLE_ANTHROPIC_LIVE=false` のrollback configをdeployする
3. `corepack pnpm wrangler secret delete RAG_ANTHROPIC_API_KEY` でWorker secretを削除する
4. `corepack pnpm wrangler secret list` で `RAG_ANTHROPIC_API_KEY` がないことを確認する
5. 確認用キー付き `/api/ask` を1回だけ叩き、Anthropic providerへ進まないことを確認する
6. `git status --short` が空、または意図したdocs/code差分だけであることを確認する
