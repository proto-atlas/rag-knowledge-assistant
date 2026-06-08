# Anthropic answer provider確認記録

生成日時: 2026-05-01T09:22:47+09:00
確認環境: ローカル実行
確認種別: Anthropic回答providerの境界確認
結果: 部分的に成功

この記録では、`/api/ask` で使うAnthropic answer providerの保護付き実装を残す。
Claudeは呼び出していません。

## 対象

追加したファイル:

- `src/worker/anthropic-answer-provider.ts`
- `tests/worker/anthropic-answer-provider.test.ts`

更新したファイル:

- `src/worker/answer-provider.ts`
- `src/worker/app.ts`
- `src/worker/types.ts`
- `src/worker/rag-stream.ts`
- `tests/worker/answer-provider.test.ts`

## 公式API前提の確認

実装前にAnthropic Messages API documentationを確認した。
直接API連携では、以下を使います。

- `POST https://api.anthropic.com/v1/messages`
- `x-api-key`
- `anthropic-version: 2023-06-01`
- `content-type: application/json`
- `model`、`max_tokens`、`messages`、`stream: true` を含むrequest body
- `content_block_delta`、`message_stop`、`ping`、provider `error` などのstreaming events

Workerはraw provider eventsをfrontendへ直接転送しません。
provider eventsを、このプロジェクトが管理するRAG stream eventsへ正規化します。

## 挙動

`RAG_ANSWER_PROVIDER_MODE=anthropic` は、明示的な実APIガードの背後に実装しています。

必要な設定:

- `RAG_ANSWER_PROVIDER_MODE=anthropic`
- `RAG_ENABLE_ANTHROPIC_LIVE=true`
- `RAG_ANTHROPIC_API_KEY`
- `RAG_CLAUDE_MODEL`

いずれかの実APIガードが欠けている場合、`/api/ask` はsanitizeした `server_misconfigured` responseで失敗します。

testで確認しているruntime behavior:

- 回答しない検索結果ではプロバイダー呼び出しを行わない
- 既存の根拠IDを持つ有効なtext deltaを回答ストリームイベントに変換する
- 根拠IDがない応答は `source_validation_failed` にする
- 未知の根拠IDを持つ応答は `source_validation_failed` にする
- provider HTTP 529はsanitizeした `overloaded` として扱う
- provider stream errorはsanitizeしたproject `error` eventにする
- 不正なprovider JSONはprovider errorとしてsanitizeする
- 確認用キーをrequest bodyやstream eventに含めない

## 確認コマンド

```bash
corepack pnpm run typecheck
corepack pnpm vitest run tests/worker/anthropic-answer-provider.test.ts tests/worker/answer-provider.test.ts tests/worker/ask.test.ts
```

結果:

- `typecheck`: 成功
- 対象テスト: 成功、3 files / 19 tests

## この記録に含めない範囲

- Claude API callは実行していません。
- 実プロバイダーstreamは消費していません。
- CloudflareにAnthropic secret bindingは設定していません。
- デプロイ済み `/api/ask` の実プロバイダー確認は実行していません。
- abortは `Request.signal` 経由で渡す設計。ただし、provider側の課金取り消しまで証明するものではない。

## 次の作業

明示的なコスト承認とsecret設定後にだけ、手動の実API確認を実行します。
最初の実API確認は、回答できるfixture 1件と回答しないfixture 1件に絞り、サニタイズ済みの結果だけを記録します。
