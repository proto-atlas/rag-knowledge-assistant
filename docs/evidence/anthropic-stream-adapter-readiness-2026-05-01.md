# Anthropic stream adapter確認記録

生成日時: 2026-05-01T08:57:00+09:00
確認環境: ローカル実行
確認種別: Anthropic raw stream event adapterの確認
結果: 部分的に成功

この記録では、Claude streaming連携を後で差し込むためのadapter境界を残す。
Claudeは呼び出していません。

## 公式API文脈の確認

Anthropic Messages streaming documentationでは、`message_start`、`content_block_delta`、`message_delta`、`message_stop`、`ping`、`error` などのSSE event flowが説明されています。
また、未知のevent typeが追加される可能性があり、gracefullyに扱うべきとされています。

設計判断:

- raw Anthropic stream eventsをfrontendへ直接転送しない。
- provider eventsを、このプロジェクトが管理するRAG stream eventsへ正規化する。
- 将来adapterが明示対応するまでは、未知のprovider eventsを無視する。
- provider errorの詳細はUIへ届く前にsanitizeする。

## 対象

追加したファイル:

- `src/worker/anthropic-stream-adapter.ts`
- `tests/worker/anthropic-stream-adapter.test.ts`

更新したファイル:

- `src/worker/rag-stream.ts`
- `src/worker/app.ts`
- `src/client/ask-api.ts`
- `src/client/App.tsx`
- `tests/worker/rag-stream.test.ts`
- `tests/client/ask-api.test.ts`

## 挙動

pure adapterで実装した挙動:

- `content_block_delta` with `text_delta` -> `answer_delta`
- `message_stop` -> `done`
- provider `error` -> sanitized project `error`
- `ping` and unknown provider events -> ignored

abort連携:

- `/api/ask` passes `Request.signal` to the SSE response helper.
- signalがすでにabort済みなら、helperはeventを出さない。

## 確認コマンド

```bash
corepack pnpm run typecheck
corepack pnpm vitest run tests/worker/anthropic-stream-adapter.test.ts tests/worker/rag-stream.test.ts tests/client/ask-api.test.ts tests/worker/ask.test.ts
```

結果:

- `typecheck`: 成功
- 対象テスト: 成功、4 files / 19 tests

## この記録で証明していないこと

- Claudeは呼び出しません。
- remote Anthropicの実SSE streamはparseしていません。
- provider側のabortやコスト取り消しを証明するものではありません。
- 回答主張と検索chunkの照合を検証するものではありません。

## 既知の制約

- 根拠IDの存在確認は、主張単位の事実性検証とは別です。
- UIがrequestをabortしても、provider側ではtoken costが既に発生している可能性があります。
