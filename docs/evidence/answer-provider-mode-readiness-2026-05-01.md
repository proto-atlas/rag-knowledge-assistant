# 回答プロバイダー設定の確認記録

生成日時: 2026-05-01T09:13:00+09:00
確認環境: ローカル実行
確認種別: 回答プロバイダー設定の境界確認
結果: 部分的に成功

この記録では、回答生成providerの設定境界を残す。
Claudeは呼び出していません。

## 対象

追加したファイル:

- `src/worker/answer-provider.ts`
- `tests/worker/answer-provider.test.ts`

更新したファイル:

- `src/worker/app.ts`
- `src/worker/types.ts`
- `tests/worker/ask.test.ts`

## 挙動

`RAG_ANSWER_PROVIDER_MODE` で回答providerの境界を切り替えます。

対応する値:

- 未設定または `mock`: 既存のserver-sideモックSSE回答providerを使う。
- `anthropic`: Claude streaming統合用に予約する。

現在の安全側の挙動:

- `anthropic` modeは、この時点では意図的に未実装です。
- `anthropic` を選んだ場合、`/api/ask` はsanitizeした `server_misconfigured` responseを返します。
- 内部実装エラーの詳細と確認用キーは外部に返さない。

## 確認コマンド

```bash
corepack pnpm run typecheck
corepack pnpm vitest run tests/worker/answer-provider.test.ts tests/worker/ask.test.ts tests/worker/anthropic-stream-adapter.test.ts
```

結果:

- `typecheck`: 成功
- 対象テスト: 成功、3 files / 13 tests

## この記録に含めない範囲

- Claudeは呼び出しません。
- Anthropic secret bindingは設定していません。
- 本番運用向けのClaude streaming実装ではありません。
- 既定のmock providerは変更していません。

## 次の作業

`RAG_ANSWER_PROVIDER_MODE=anthropic` の背後にAnthropic client境界を実装し、明示的なコスト承認後に手動の実API確認で検証します。
