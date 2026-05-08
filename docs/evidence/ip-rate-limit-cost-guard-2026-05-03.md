# IP Rate Limit Cost Guard Evidence

## 日本語要約

このevidenceは、公開demoのdynamic routeにIP-based cost guardを追加したpoint-in-timeログです。

- 確認したこと: `/api/search` と `/api/ask` で、access key通過後に同一IP・同一route・同一windowのリクエスト数をD1で数えること
- 結果: 既定値は60 requests / 60 seconds。上限超過時はsanitized `rate_limited` responseとして429を返す
- 読み方: access keyと並列のcost guard強化であり、production user authenticationやper-user quotaではありません
- このログで主張しないこと: WAF、bot protection、user authentication、per-user / per-org quota、deployed production rate-limit behavior

詳細なroute名、env名、HTTP status、テスト名は、証拠性と再現性を保つため原文のまま残しています。

Generated at: 2026-05-03T15:55:39+09:00
Check type: ip-rate-limit-cost-guard
Result: pass

## Scope

Changed:

- `src/worker/rate-limit.ts` を追加。
- `/api/search` と `/api/ask` で、access key検証後に `enforceIpRateLimit` を呼ぶ。
- `CF-Connecting-IP` をtrimし、route名と組み合わせてSHA-256 hash化した値だけをD1へ保存する。raw IPは保存しない。
- `migrations/0003_request_rate_limits.sql` で `request_rate_limits` tableを追加する。
- `RAG_DISABLE_RATE_LIMIT=true` はtest/dev bypass用。production deploymentでは設定しない。

## Policy

| Item | Value |
|---|---|
| Default max requests | 60 |
| Default window | 60 seconds |
| Count key | SHA-256 of `route:client-ip` |
| Stored raw IP | no |
| Limited routes | `/api/search`, `/api/ask` |
| Over-limit response | 429 `rate_limited` |
| Bypass env | `RAG_DISABLE_RATE_LIMIT=true` |

## References

- Cloudflare `CF-Connecting-IP` documents the client IP address header from Cloudflare edge to the origin/Worker context: `https://developers.cloudflare.com/fundamentals/reference/http-headers/#cf-connecting-ip`
- Cloudflare D1 Worker Binding API supports prepared statements through `prepare()` and bound parameters through `bind()`: `https://developers.cloudflare.com/d1/worker-api/`
- Cloudflare D1 prepared statements document `bind()` and result methods: `https://developers.cloudflare.com/d1/worker-api/prepared-statements/`

## Verification

Commands run:

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

Observed result:

- Targeted Vitest files: 3 passed.
- Targeted tests: 17 passed.
- TypeScript typecheck: passed.
- Lint: passed.
- Full Vitest files: 41 passed.
- Full Vitest tests: 214 passed.
- Production build: passed.
- Worker dry-run build: passed.
- E2E tests: 9 passed.
- Git diff whitespace check: passed with line-ending warnings only.

Coverage added:

- `RAG_DISABLE_RATE_LIMIT=true` bypasses the cost guard for tests.
- Missing `RAG_DB` returns sanitized `server_misconfigured`.
- Same IP + same route + same window returns 429 after the configured limit.
- Different routes use separate counters.
- Invalid max request env returns sanitized `server_misconfigured`.
- `CF-Connecting-IP` is trimmed; missing header falls back to `unknown-client`.

## Not Claimed

- This is not production user authentication.
- This is not per-user or per-organization quota.
- This is not WAF, bot protection, CAPTCHA, or abuse monitoring.
- This does not prove deployed production rate-limit behavior until a deployment smoke records it.
- This does not call Claude, Workers AI, Vectorize, or provider-mode routes.
