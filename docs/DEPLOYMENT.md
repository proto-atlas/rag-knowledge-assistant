# Deployment Checklist

Updated: 2026-05-05
Status: deployment checklist and smoke-reference document

この文書は、access key付き限定live portfolio deploymentと、manual live provider smokeを扱います。secret値はcommitしません。

Deployment status: 過去のmock-only public deploymentは `docs/evidence/deployment-smoke-2026-05-01.md` に記録済みです。限定live deployment後は、新しいdeployment smokeとmanual live smoke evidenceを追加します。

## Limited Live Portfolio Deployment

通常の公開トップページは未認証で閲覧できます。dynamic searchとanswer generationは、課金と乱用防止のためaccess keyで保護します。

Recommended default:

- public top pageはaccess keyなしで見える。
- dynamic searchとaskは `RAG_ACCESS_KEY` を要求する。
- dynamic searchとaskはIP-based cost guard rate limitも通る。`RAG_DISABLE_RATE_LIMIT=true` はtest/dev bypass用で、production deploymentでは設定しない。
- `/api/search` は `RAG_SEARCH_PROVIDER_MODE=vectorize-d1` でWorkers AI / Vectorize / D1を使う。
- `/api/ask` は `RAG_ANSWER_PROVIDER_MODE=anthropic` と `RAG_ENABLE_ANTHROPIC_LIVE=true` でAnthropic streaming answerを使う。
- no-answer判定時はClaude APIへ進まない。

Required Cloudflare resources:

- D1 database: `rag-knowledge-assistant-db`
- D1 binding: `RAG_DB`
- Vectorize index: `rag-bge-m3-v1`
- Vectorize binding: `RAG_VECTOR_INDEX`
- Workers AI binding: `AI`
- Assets binding: `ASSETS`
- active index version var: `RAG_ACTIVE_INDEX_VERSION=rag-bge-m3-v1`

Required secret:

```bash
corepack pnpm wrangler secret put RAG_ACCESS_KEY
corepack pnpm wrangler secret put RAG_ANTHROPIC_API_KEY
```

Optional admin secret for internal smoke routes:

```bash
corepack pnpm wrangler secret put RAG_ADMIN_ACCESS_KEY
```

Normal deploy preflight:

```bash
corepack pnpm run typecheck
corepack pnpm run lint
corepack pnpm run test
corepack pnpm run build
corepack pnpm run build:worker
corepack pnpm run test:e2e
```

Deploy command:

```bash
corepack pnpm wrangler deploy
```

Required vars in `wrangler.jsonc`:

- `RAG_SEARCH_PROVIDER_MODE=vectorize-d1`
- `RAG_ANSWER_PROVIDER_MODE=anthropic`
- `RAG_ENABLE_ANTHROPIC_LIVE=true`
- `RAG_CLAUDE_MODEL=claude-sonnet-4-6`
- `RAG_ANTHROPIC_MAX_TOKENS=256`
- `RAG_MIN_PROVIDER_VECTOR_SCORE=0.55`
- `RAG_RATE_LIMIT_MAX_REQUESTS=12`
- `RAG_RATE_LIMIT_WINDOW_SECONDS=60`

Anthropic model idは実装直前に公式docsで再確認します。2026-05-05時点では公式model overview（https://docs.anthropic.com/en/docs/about-claude/models/overview）で `claude-sonnet-4-6` を確認済みです。

実施前に、Anthropic Console側のhard spend limitを確認します。Worker側のtoken capやrate limitだけでは、providerへ直接到達したcallの上限にはなりません。

限定live期間は、freshな `RAG_ACCESS_KEY` を使います。過去に配ったkeyを使い回すと、意図しない相手が限定live期間にアクセスできるため避けます。

## Manual Live Provider Smoke

Manual live provider smokeは、限定live deployment後に最小件数で行います。通常CIには含めません。

Manual smoke command after deploy:

```bash
corepack pnpm run smoke:manual-live-rag -- --confirm-manual-live-rag-smoke
```

Required local environment variables for the smoke command:

- `RAG_LIVE_SMOKE_URL`
- `RAG_ACCESS_KEY`

Emergency rollback order:

1. Anthropic Consoleで使用keyをrevokeする
2. `RAG_ANSWER_PROVIDER_MODE=mock` または `RAG_ENABLE_ANTHROPIC_LIVE=false` のrollback configをdeployする
3. `RAG_ANTHROPIC_API_KEY` Worker secretを削除する
4. `wrangler secret list` でAnthropic secretがないことを確認する
5. access key付き `/api/ask` がAnthropic providerへ進まないことを確認する
6. `git status --short` で意図しないtracked diffがないことを確認する

## Claims Still Requiring Separate Evidence

対応するevidenceが存在するまで、以下は主張しません。

- limited live deployment smoke
- repeated live Claude answer generation
- deployed production rate-limit behavior

過去のmock-only public URLは `docs/evidence/deployment-smoke-2026-05-01.md` に記録しています。限定live deploy後は新しいevidenceを追加します。

## Evidence After Deploy

Suggested evidence files:

- `docs/evidence/deployment-smoke-YYYY-MM-DD.md`
- `docs/evidence/manual-live-rag-smoke-YYYY-MM-DD.md`

Evidence must not contain:

- access keys
- Anthropic API key
- cookies
- raw provider response
- stack trace
- hidden operational detailsを含むprompt text

## Redeploy SOP

Redeploy時は、新しいdate-suffixed deployment smokeを作成します。同日に複数回実施する場合はsuffixを付けます。README Capability MatrixのPublic UI / Public `/api/search` / Public `/api/ask` の3行だけを最新smokeへ更新します。旧smokeは削除せず、必要ならタイトル直下に `Superseded by ...` を追加します。Worker versionとcommitの対応は `docs/evidence/INDEX.md` のDeployment Timelineで管理します。
