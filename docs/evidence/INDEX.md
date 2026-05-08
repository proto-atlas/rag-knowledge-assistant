# Evidence Index

Updated: 2026-05-05
Scope: public reviewer navigation

Evidence filesはpoint-in-time logsです。以後のcommit、deployment、provider設定でも同じ結果になるという主張ではありません。

Current local hardening pass totals: 224 unit tests and 9 E2E tests. 古いreadiness evidenceには、変更時点で追加・実行した件数だけが記録されている場合があります。

## Status Legend

- `[deployed]`: 公開URLで挙動を観測できるevidence。対応するWorker versionはDeployment Timelineで管理します。
- `[merged-only]`: コードやdocsには反映済みですが、公開URLで直接観測できないevidence。
- `[guarded-or-manual]`: guarded internal smoke、local eval、manual checklistのいずれか。

## Deployment Timeline

| Date | Worker version | Commit | Evidence | Notes |
|---|---|---|---|---|
| 2026-05-01 | recorded in evidence | recorded in evidence | `deployment-smoke-2026-05-01.md` | original mock-only deployment smoke |
| 2026-05-02 | `5f9ba783-b039-4c07-976c-56d4f9605a91` | `de9588f` | `deployment-sanity-2026-05-02.md` | previous public runtime evidence |
| 2026-05-03 | `2fcfd549-311f-4723-a801-d0f9bbeaeaa5` | `368f6d7` | `deployment-smoke-2026-05-03.md` | current public runtime evidence |
| 2026-05-04 | `08400d4d-3fca-4d9d-ae94-c1a1268e4ad4` | `6110857` | `manual-live-rag-smoke-2026-05-04.md` | temporary access-key live known-answer smoke |
| 2026-05-04 | `a9af6129-8ab9-4c38-9ad4-e3914ae67d77` | `6110857` | `manual-live-rag-smoke-2026-05-04.md` | restored public default to mock-only |
| 2026-05-05 | `16fb7705-3098-48e8-bf2b-d5360260322c` | `5bd3eef` | `manual-live-rag-smoke-2026-05-05.md` | limited live code deploy |
| 2026-05-05 | `89c540e9-f754-47ca-b0af-9d2e7d6e0ed8` | `5bd3eef` | `manual-live-rag-smoke-2026-05-05.md` | Anthropic secret update active during smoke |

README、docs、evidenceの更新commitは、公開URLのWorker versionを必ず更新するものではありません。公開runtimeの対応関係はこのDeployment Timelineを参照してください。

## Start Here

- `[guarded-or-manual]` `retrieval-eval-2026-04-30.md` — local mock retrieval fixture eval。
- `[guarded-or-manual]` `provider-retrieval-eval-2026-05-02.md` — 同じ固定fixture corpusに対するguarded provider-mode retrieval eval。
- `[guarded-or-manual]` `external-benchmark-eval-2026-05-03.md` — Mr. TyDi Japanese dev subsetに対するlocal lexical baseline。公式full-corpus scoreではありません。
- `[deployed]` `ui-screenshots-2026-04-30.md` — top page、answer UI、citation focusのスクリーンショット。
- `[guarded-or-manual]` `provider-mode-search-readiness-2026-05-01.md` — 明示的な `/api/search` provider-mode readiness。
- `[guarded-or-manual]` `anthropic-answer-provider-readiness-2026-05-01.md` — fake-fetch testsによるAnthropic answer-provider readiness。
- `[deployed]` `manual-live-rag-smoke-2026-05-05.md` — access key付き限定live設定でknown-answer 1件とno-answer 1件を確認。
- `[guarded-or-manual]` `manual-live-rag-smoke-2026-05-04.md` — access key付きmanual live設定でknown-answer 1件を確認。
- `[deployed]` `deployment-smoke-2026-05-03.md` — previous mock-only Cloudflare deployment smoke。
- `[deployed]` `deployment-smoke-2026-05-01.md` — earlier mock-only Cloudflare deployment smoke。
- `[deployed]` `deployment-sanity-2026-05-02.md` — post-deploy public route sanity check。
- `[merged-only]` `dependency-audit-2026-05-02.md` — dependency audit。
- `[merged-only]` `a11y-review-2026-05-02.md` — source-level accessibility review。
- `[merged-only]` `axe-a11y-2026-05-02.md` — local mock-only UI statesのaxe-core check。
- `[guarded-or-manual]` `screen-reader-manual-a11y-2026-05-03.md` — Windows Narrator + Chromeで主要7状態を手動確認したscreen reader smoke。
- `[deployed]` `lighthouse-2026-05-02.md` — public mock-only deploymentのLighthouse lab measurement。
- `[merged-only]` `bundle-size-2026-05-02.md` — local production build bundle-size measurement。
- `[merged-only]` `sse-latency-2026-05-02.md` — in-process mock `/api/ask` SSE latency measurement。
- `[merged-only]` `runtime-hardening-2026-05-02.md` — access-key comparison、structured error logs、public-status parsing、Anthropic max-token configuration。
- `[merged-only]` `ci-hardening-2026-05-02.md` — GitHub Actions quality workflow hardening。
- `[merged-only]` `ip-rate-limit-cost-guard-2026-05-03.md` — `/api/search` と `/api/ask` のIP-based cost guard rate limit。

## Retrieval And Indexing

- `../adr/0001-index-version-policy.md`
- `../adr/0002-no-answer-threshold.md`
- `workers-ai-dimension-probe-2026-04-30.md`
- `vectorize-index-setup-2026-04-30.md`
- `vectorize-smoke-2026-04-30.md`
- `worker-binding-vectorize-smoke-2026-05-01.md`
- `vectorize-fixture-index-readiness-2026-05-01.md`
- `provider-search-smoke-2026-05-01.md`
- `provider-retrieval-eval-2026-05-02.md`
- `../adr/0004-external-benchmark-subset-policy.md`
- `external-benchmark-eval-2026-05-03.md`

## D1 Source Of Truth

- `d1-source-of-truth-readiness-2026-05-01.md`
- `d1-remote-setup-2026-05-01.md`
- `d1-seed-sql-readiness-2026-05-01.md`
- `d1-worker-smoke-2026-05-01.md`

## Answer Streaming

- `../adr/0003-provider-mode-boundary.md`
- `../adr/0005-limited-live-demo-boundary.md`
- `ask-streaming-mock-readiness-2026-05-01.md`
- `anthropic-stream-adapter-readiness-2026-05-01.md`
- `answer-provider-mode-readiness-2026-05-01.md`
- `anthropic-answer-provider-readiness-2026-05-01.md`
- `manual-live-rag-smoke-readiness-2026-05-01.md`
- `manual-live-rag-smoke-2026-05-04.md`
- `sse-latency-2026-05-02.md`

## Deployment

- `deployment-readiness-2026-05-01.md`
- `deployment-smoke-2026-05-03.md`
- `deployment-smoke-2026-05-01.md`
- `deployment-sanity-2026-05-02.md`
- `ci-hardening-2026-05-02.md`

## Dependency And Runtime Safety

- `dependency-audit-2026-05-02.md`
- `runtime-hardening-2026-05-02.md`
- `ip-rate-limit-cost-guard-2026-05-03.md`

## Frontend Accessibility

- `a11y-review-2026-05-02.md`
- `axe-a11y-2026-05-02.md`
- `screen-reader-manual-a11y-2026-05-03.md`

## Frontend Performance

- `lighthouse-2026-05-02.md`
- `bundle-size-2026-05-02.md`
- `sse-latency-2026-05-02.md`
