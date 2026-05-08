# Runtime Hardening Evidence

## 日本語要約

このevidenceは、公開demo境界のruntime hardeningを記録したpoint-in-timeログです。

- 確認したこと: access key比較、構造化error log、PublicStatus runtime guard、`RAG_ANTHROPIC_MAX_TOKENS`のsmoke-only cap
- 結果: 対象テスト、typecheck、lint、build、E2Eがpass
- 読み方: hardeningの実装とテスト固定の証跡であり、production認証や本番運用監視の完成を示すものではありません
- このログで主張しないこと: production authentication、rate limit / WAF、live Claude品質、provider cost reversal

詳細なコマンド名、テスト名、技術API名は、証拠性と再現性を保つため原文のまま残しています。

Generated at: 2026-05-02
Generated from: local public repository worktree
Check type: runtime boundary hardening
Result: pass

## Scope

This evidence records a small runtime-hardening pass for existing public-demo boundaries.

Changed:

- Access-key and admin-key comparisons now hash both values with SHA-256 and compare the fixed-length hashes with `crypto.subtle.timingSafeEqual` when available.
- Worker route failures now log route-scoped structured error metadata before returning sanitized `server_misconfigured` responses.
- Public status JSON is runtime-validated before the React app accepts it.
- Anthropic answer mode can read `RAG_ANTHROPIC_MAX_TOKENS` as an optional smoke-only output cap.

## References

- Cloudflare Workers Web Crypto documentation recommends `crypto.subtle.timingSafeEqual` for secret comparisons and fixed-length hashing before comparison: `https://developers.cloudflare.com/workers/examples/protect-against-timing-attacks/`

## Verification

Commands run:

```bash
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm build
corepack pnpm build:worker
corepack pnpm test:e2e
git diff --check
```

Observed result:

- TypeScript typecheck: passed.
- Lint: passed.
- Full Vitest files: 39 passed.
- Full Vitest tests: 201 passed.
- Production build: passed.
- Worker dry-run build: passed.
- E2E tests: 9 passed.
- Git diff whitespace check: passed with line-ending warnings only.

Additional regression coverage added in this hardening pass:

- Access-key comparison boundary cases include first-byte mismatch, last-byte mismatch, shorter supplied key, longer supplied key, and undefined supplied key.
- `logAndReturn500`, `normalizeLoggedError`, and `truncateLogMessage` are covered by direct unit tests through `src/worker/error-response.ts`.
- `PublicStatus` runtime guard boundary tests cover missing fields, invalid field types, null, arrays, and primitive values.
- `RAG_ANTHROPIC_MAX_TOKENS` tests separate the parse layer from the final Anthropic request body layer. The unset env path is verified at the request body layer as `max_tokens: 512`.
- `RAG_MIN_PROVIDER_VECTOR_SCORE` tests treat `0..1` validation as this portfolio demo's threshold policy, not as a general Vectorize score invariant.

## Not Claimed

- This does not prove production user authentication.
- This does not add key rotation, per-user quotas, WAF rules, or bot protection.
- This does not prove provider-side cost reversal after client abort.
- This does not run Claude, Workers AI, Vectorize, or D1 live provider traffic.
- This does not replace provider-mode retrieval evaluation.
