# runtime設定確認の検証記録

## 日本語要約

この記録は、公開URL境界のruntime settings checkを記録した特定時点ログです。

- 確認したこと: 確認用キー比較、構造化error log、PublicStatus runtime guard、`RAG_ANTHROPIC_MAX_TOKENS`のcheck-only cap
- 結果: 対象テスト、typecheck、lint、build、E2Eがpass
- 読み方: settings checkの実装とテスト固定の証跡であり、production認証や本番運用監視の完成を示すものではありません
- この記録に含めない範囲: 本番認証、rate limit / WAF、Claude実API品質、provider cost reversal

詳細なコマンド名、テスト名、技術API名は、証拠性と再現性を保つため原文のまま残しています。

生成日時: 2026-05-02
確認環境: ローカル実行
確認種別: runtime境界設定確認
結果: 通過

## 対象

この記録は、既存の公開境界に対するruntime設定確認を記録します。

変更内容:

- 確認用キーとadmin keyの比較では、両方の値をSHA-256でhash化し、利用可能な場合は固定長hashを`crypto.subtle.timingSafeEqual`で比較します。
- Worker routeの失敗時は、sanitize済み`server_misconfigured` responseを返す前に、route単位の構造化error metadataを記録します。
- React appがPublic status JSONを受け入れる前に、runtime validationを行います。
- Anthropic answer modeでは、確認用のoutput capとして任意の`RAG_ANTHROPIC_MAX_TOKENS`を読めます。

## 参照

- Cloudflare Workers Web Crypto documentation recommends `crypto.subtle.timingSafeEqual` for secret comparisons and fixed-length hashing before comparison: `https://developers.cloudflare.com/workers/examples/protect-against-timing-attacks/`

## 検証

実行したコマンド:

```bash
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm build
corepack pnpm build:worker
corepack pnpm test:e2e
git diff --check
```

観測結果:

- TypeScript typecheck: 通過。
- Lint: 通過。
- 全体Vitestファイル: 39件passed。
- 全体test: 201件passed。
- Production build: 通過。
- Worker dry-run build: 通過。
- E2E tests: 9 passed.
- Git diff whitespace check: 通過。line-ending warningのみ。

この設定確認で追加したregression coverage:

- 確認用キー比較の境界caseとして、先頭byte不一致、末尾byte不一致、短い入力、長い入力、未定義入力を含めています。
- `logAndReturn500`、`normalizeLoggedError`、`truncateLogMessage`は、`src/worker/error-response.ts`の直接unit testで確認しています。
- `PublicStatus` runtime guardの境界testでは、field不足、不正なfield型、null、array、primitive値を確認しています。
- `RAG_ANTHROPIC_MAX_TOKENS`のtestでは、parse layerと最終Anthropic request body layerを分けています。未設定時の経路は、request body layerで`max_tokens: 512`として確認しています。
- `RAG_MIN_PROVIDER_VECTOR_SCORE`のtestでは、`0..1` validationをこの固定データ検証環境のthreshold方針として扱い、一般的なVectorize score不変条件とは扱いません。

## この記録に含めない範囲

- 本番利用者認証を証明するものではありません。
- key rotation、user別quota、WAF rule、bot protectionは追加していません。
- client abort後のprovider側コスト取り消しを証明するものではありません。
- Claude、Workers AI、Vectorize、D1の実プロバイダーtrafficは実行していません。
- 実プロバイダー経路retrieval evaluationを置き換えるものではありません。
