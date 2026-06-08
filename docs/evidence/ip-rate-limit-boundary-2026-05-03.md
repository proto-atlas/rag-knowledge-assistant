# IP単位のAPI呼び出し制限の検証記録

## 日本語要約

この記録は、公開URLのdynamic routeにIP単位のAPI呼び出し制限を追加した特定時点ログです。

- 確認したこと: `/api/search` と `/api/ask` で、確認用キー通過後に同一IP・同一route・同一windowのリクエスト数をD1で数えること
- 結果: 既定値は60 requests / 60 seconds。上限超過時はsanitized `rate_limited` responseとして429を返す
- 読み方: 確認用キーと並列のAPI呼び出し制限であり、本番認証や利用者別quotaではありません
- この記録に含めない範囲: WAF、bot protection、user authentication、per-user / per-org quota、デプロイ済み環境のrate limit挙動

詳細なroute名、env名、HTTP status、テスト名は、証拠性と再現性を保つため原文のまま残しています。

生成日時: 2026-05-03T15:55:39+09:00
確認種別: IP単位rate limit境界確認
結果: 通過

## 対象

変更内容:

- `src/worker/rate-limit.ts` を追加。
- `/api/search` と `/api/ask` で、確認用キー検証後に `enforceIpRateLimit` を呼ぶ。
- `CF-Connecting-IP` をtrimし、route名と組み合わせてSHA-256 hash化した値だけをD1へ保存する。raw IPは保存しない。
- `migrations/0003_request_rate_limits.sql` で `request_rate_limits` tableを追加する。
- `RAG_DISABLE_RATE_LIMIT=true` はtest/dev bypass用。本番デプロイでは設定しない。

## 方針

| 項目 | 値 |
|---|---|
| 既定の最大リクエスト数 | 60 |
| 既定のwindow | 60 seconds |
| 集計key | `route:client-ip` のSHA-256 |
| raw IPの保存 | no |
| 制限対象route | `/api/search`, `/api/ask` |
| 上限超過response | 429 `rate_limited` |
| bypass env | `RAG_DISABLE_RATE_LIMIT=true` |

## 参照

- Cloudflare `CF-Connecting-IP` は、Cloudflare edgeからorigin / Worker contextへ渡すclient IP address headerとして説明されている: `https://developers.cloudflare.com/fundamentals/reference/http-headers/#cf-connecting-ip`
- Cloudflare D1 Worker Binding APIは、`prepare()`によるprepared statementsと`bind()`によるbound parametersに対応している: `https://developers.cloudflare.com/d1/worker-api/`
- Cloudflare D1 prepared statementsのドキュメントでは、`bind()`とresult methodsが説明されている: `https://developers.cloudflare.com/d1/worker-api/prepared-statements/`

## 検証

実行したコマンド:

```bash
corepack pnpm vitest run tests/worker/rate-limit.test.ts tests/worker/search.test.ts tests/worker/ask.test.ts
corepack pnpm run typecheck
corepack pnpm run lint
corepack pnpm run test
corepack pnpm run build
corepack pnpm run build:worker
corepack pnpm run test:e2e
git diff --check
```

観測結果:

- 対象Vitestファイル: 3件通過。
- 対象test: 17件passed。
- TypeScript typecheck: 通過。
- Lint: 通過。
- 全体Vitestファイル: 41件passed。
- 全体test: 214件passed。
- Production build: 通過。
- Worker dry-run build: 通過。
- E2E tests: 9 passed.
- Git diff whitespace check: 通過。line-ending warningのみ。

追加したcoverage:

- `RAG_DISABLE_RATE_LIMIT=true` の場合、testではrate limitをbypassする。
- `RAG_DB` がない場合、sanitized `server_misconfigured` を返す。
- 同じIP、同じroute、同じwindowでは、設定上限を超えると429を返す。
- routeごとに別々のcounterを使う。
- max request envが不正な場合、sanitized `server_misconfigured` を返す。
- `CF-Connecting-IP` はtrimする。headerがない場合は`unknown-client`へfallbackする。

## この記録に含めない範囲

- これは本番向けのユーザー認証ではありません。
- これはユーザー別または組織別quotaではありません。
- これはWAF、bot対策、CAPTCHA、abuse monitoringではありません。
- デプロイ確認で記録するまでは、本番デプロイ後のrate limit挙動を証明するものではありません。
- Claude、Workers AI、Vectorize、実プロバイダーrouteは呼び出しません。
