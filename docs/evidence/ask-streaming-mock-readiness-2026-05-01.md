# ask streaming mock確認記録

生成日時: 2026-05-01T08:36:00+09:00
確認環境: ローカル実行
確認種別: `/api/ask` のモックSSEストリーム確認
結果: 部分的に成功

この記録では、server-side RAG answer streamingの最初の境界を残す。
この時点ではモック回答providerを使い、Claudeは呼び出していません。

## 公式API文脈の確認

Anthropic Messages streaming docsでは、`stream: true` がserver-sent eventsを返し、streamには `message_start`、`content_block_delta`、`message_delta`、`message_stop`、`ping`、`error` eventsが含まれると説明されています。また、未知のevent typeが追加される可能性があり、gracefullyに扱うべきとされています。

設計判断:

- WorkerはAnthropicのraw SSE eventsをfrontendへ直接転送しない。
- provider eventsはserver-sideで、このプロジェクトが管理するRAG stream eventsへ正規化してからUIで扱う。

## 対象

追加したファイル:

- `src/worker/rag-stream.ts`
- `src/worker/search-request.ts`
- `tests/worker/rag-stream.test.ts`
- `tests/worker/ask.test.ts`

更新したファイル:

- `src/worker/app.ts`
- `src/client/App.tsx`
- `src/client/ask-api.ts`
- `tests/client/ask-api.test.ts`
- `tests/e2e/top-page.spec.ts`
- `tests/evidence/ui-screenshots.spec.ts`

削除したファイル:

- `src/client/mock-answer-stream.ts`
- `tests/client/mock-answer-stream.test.ts`

## 挙動

`POST /api/ask`:

- `POST /api/search` と同じ確認用キー検証を要求する。
- searchと同じrequest shapeを検証する。
- 現在のsearch provider境界を通す。
- `text/event-stream` を返す。
- このプロジェクトで定義したeventを送る。
  - `retrieval_start`
  - `sources`
  - `generation_start`
  - `answer_delta`
  - `no_answer`
  - `source_validation_failed`
  - `done`

モック応答の制限:

- Claudeは呼び出しません。
- Anthropic raw SSEはparseしません。
- 本番streaming挙動を証明するものではありません。
- 実プロバイダー経路を既定の挙動にはしません。

## client統合

ブラウザUIは、client-onlyのモックhelperでanswer deltaを生成するのではなく、`/api/ask` をSSE streamとして読みます。

client側の挙動:

- `src/client/ask-api.ts` で `text/event-stream` frameをparseする。
- UIは `answer_delta` eventから回答本文を更新する。
- UIは `sources` eventから根拠カードを更新する。
- `source_validation_failed` は回答なしの状態として表示する。
- 確認用キーはReact stateだけに保持し、localStorageやsessionStorageには保存しない。

## 確認コマンド

```bash
corepack pnpm run typecheck
corepack pnpm vitest run tests/worker/rag-stream.test.ts tests/worker/ask.test.ts tests/worker/search.test.ts
corepack pnpm vitest run tests/client/ask-api.test.ts
corepack pnpm run test:e2e
```

結果:

- `typecheck`: 成功
- 対象テスト: 成功、3 files / 13 tests
- client SSE parser tests: 成功
- E2E tests: 成功、5 tests

## この記録に含めない範囲

- `/api/ask` はこの時点では、取得した根拠カードからモックのanswer deltaを生成します。
- Claude adapter統合は後続作業です。
- abortはclientの `/api/ask` request signal経由で渡す設計。ただし、server-side remote abortの挙動はこの時点では未確認。
- 実プロバイダー経路の `/api/ask` remote checkは未確認です。
