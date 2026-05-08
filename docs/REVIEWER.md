# Reviewer Guide

このプロジェクトは、架空文書を使ったRAGポートフォリオです。主な確認対象は、retrieval設計、評価、no-answer制御、source validation、SSE UI、frontend state handlingです。

公開デモはaccess key付き限定live demoです。未認証トップページでは外部providerを呼ばず、access key付きのdynamic search / answer generationでWorkers AI、Vectorize、D1、Anthropicを呼びます。本番認証、private document運用、一般化されたRAG品質は主張しません。

## 最初に見る場所

1. 公開UI
   - 架空文書一覧
   - RAG flow
   - index status
   - retrieval eval summary
   - access key付きdynamic search form
2. retrieval evidence
   - `docs/evidence/retrieval-eval-2026-04-30.md`
   - `docs/evidence/provider-retrieval-eval-2026-05-02.md`
   - `docs/evidence/external-benchmark-eval-2026-05-03.md`
3. UI screenshots
   - `docs/evidence/ui-screenshots-2026-04-30.md`
4. frontend accessibility evidence
   - `docs/evidence/a11y-review-2026-05-02.md`
   - `docs/evidence/axe-a11y-2026-05-02.md`
   - `docs/evidence/screen-reader-manual-a11y-2026-05-03.md`
5. evidence index
   - `docs/evidence/INDEX.md`
6. architecture
   - `docs/ARCHITECTURE.md`
7. provider binding design
   - `docs/PROVIDER-BINDINGS.md`
   - `docs/MANUAL-LIVE-SMOKE.md`
   - `docs/DEPLOYMENT.md`
8. 実装境界
   - `src/rag/mock-search.ts`
   - `src/rag/provider-search.ts`
   - `src/rag/retrieval-eval.ts`
   - `src/client/App.tsx`
   - `src/client/ask-api.ts`
   - `src/worker/app.ts`

## 現在の実装境界

確認済み:

- Dynamic searchはaccess keyで保護しています。
- access keyはcost guardであり、production user authenticationではありません。
- Clientのsource-only search UIは `POST /api/search` を呼びます。
- Answer generation UIは `POST /api/ask` を直接呼び、project-owned RAG SSE eventsを受け取ります。
- `/api/ask` はsourcesをanswer deltasより先に送るため、通常の回答flowで事前に `/api/search` を呼ぶ必要はありません。
- Retrieval evidenceは固定のfictional fixturesに基づきます。
- Provider-readiness helpersはWorkers AI embedding output、Vectorize query options、Vectorize match conversionを扱います。
- Vectorize index `rag-bge-m3-v1` は24 fictional chunksを持ちます。
- Vectorize metadata indexesは `indexVersion` と `category` を対象にしています。
- `wrangler.jsonc` はWorkers AI、Vectorize、D1 bindingsを含みます。
- Remote D1 database `rag-knowledge-assistant-db` には8 fictional documentsと24 seeded chunksがあります。
- Provider retrieval evalは25件の固定fictional fixturesに対してguarded provider-mode targetで記録済みです。
- External benchmark subset evalはMr. TyDi Japanese dev subsetに対するlocal lexical baselineとして記録済みです。公式Mr. TyDi full-corpus scoreやprovider-mode品質ではありません。
- Windows Narrator manual smokeは主要7状態の公開UI導線に対する手動確認として記録済みです。完全なWCAG監査やvendor matrixではありません。
- IP-based cost guard rate limitは `/api/search` と `/api/ask` に実装し、unit testで記録済みです。production user authentication、per-user quota、per-key request budgetではありません。
- `/api/search` は限定live deploy configで `RAG_SEARCH_PROVIDER_MODE=vectorize-d1` を使います。
- `/api/ask` は限定live deploy configで `RAG_ANSWER_PROVIDER_MODE=anthropic` と `RAG_ENABLE_ANTHROPIC_LIVE=true` を使います。
- Anthropic answer providerはfake-fetch testsで境界確認しています。
- access key付きmanual live設定で、known-answer 1件のWorkers AI / Vectorize / D1 / Anthropic streaming pathを確認済みです。
- Manual live smoke checklistに沿って、known-answer 1件とno-answer 1件の限定live smokeを記録済みです。
- 過去のmock-only Cloudflare Workers deploymentは `docs/evidence/deployment-smoke-2026-05-01.md` に記録済みです。

主張しないこと:

- 反復的なClaude API live evalを実行済みとは主張しません。
- live Claude回答品質を主張しません。
- Anthropic raw SSE eventをfrontendへforwardしません。
- Anthropic readiness evidenceはfake provider streamsのみです。
- Manual live RAG smokeはknown-answer 1件とno-answer 1件のみのpoint-in-time evidenceです。
- production authentication、WAF、audit log、per-user quota、per-key request budgetは未実装です。
- `wrangler.jsonc` はWorkers AI、Vectorize、D1 bindingsを含みますが、Claude provider secret値はリポジトリに含めません。

## Access keyを要求する理由

Access keyは公開ポートフォリオデモのcost guardです。ユーザー認証ではありません。

実provider経路では、search-only requestでもquery embeddingやvector searchが発生し、コストやabuse riskを持ちます。そのためdynamic searchとanswer generationは保護しています。

本番化する場合は、user authentication、key rotation、per-user rate limits、audit logs、abuse monitoring、document-level ACLが必要です。

## Evidence方針

Evidence filesはpoint-in-time logsです。以後のcommit、deployment、provider設定でも同じ結果になるという主張ではありません。

各evidenceには、timestamp、check type、method、scope、result、known limitationsを含めます。secretや端末固有の絶対パスは含めません。

## RAG Evaluation Notes

Mock retrieval fixture eval:

| Metric | Value |
|---|---:|
| answerable fixtures | 20 |
| no-answer fixtures | 5 |
| hit@1 | 0.900 |
| hit@3 | 1.000 |
| hit@5 | 1.000 |
| MRR | 0.950 |
| no-answer accuracy | 1.000 |
| failed cases | 0 |

この値はlocal mock retrieval scaffoldだけを測ったものです。Workers AI + Vectorize retrieval quality、Claude answer quality、production RAG qualityではありません。

Provider retrieval evalも同じ25件の固定fictional fixturesに対する小規模retrieval-only検証です。Claude answer quality、public deployed provider-mode route、大規模corpusでのRAG品質は測っていません。

25件のfictional fixturesはretrieval scaffoldと同じプロジェクト内で作成されています。held-out external benchmarkではありません。

External benchmark subset evalはMr. TyDi Japanese dev split由来のquery/gold document idを使う別ログです。gold documents + sampled non-gold documentsのcandidate subsetに対するlocal lexical baselineであり、provider-mode Vectorize検索や公式Mr. TyDi full-corpus scoreではありません。

## Claim Boundary

このプロジェクトで主張すること:

- 公開デモはaccess key付き限定live demoです。
- RAGのUI、source cards、server-side SSE、no-answer、source validation、evidence設計を確認できます。
- Provider modeはWorkers AI / Vectorize / D1 / Anthropic境界として実装し、限定live configで有効化します。
- 外部dataset由来の小規模subset baselineも記録していますが、provider-mode品質やproduction RAG品質とは分けて扱っています。
- access keyはcost guardであり、本番認証ではありません。
- IP-based rate limitはaccess keyと並列のcost guard強化であり、本番認証、per-user quota、per-key request budgetではありません。
- Manual live smokeは日時と件数を限定した検証です。

補足:

- Anthropic live modeのsource validationはpost-generationです。streaming中に `answer_delta` を受け取り、stream完了後にcitation idを検証します。
- そのため「不正citation回答を表示前に完全遮断」とは主張しません。source validation failureを検出し、通常回答として扱わないUI状態へ落とす境界として説明します。

このプロジェクトで主張しないこと:

- 本番RAG SaaSと言うこと。
- live Claude回答品質を一般化して検証済みと言うこと。
- provider retrieval evalを一般的なRAG品質benchmarkとして扱うこと。
- external benchmark subset evalを公式full-corpus scoreとして扱うこと。
- access keyをproduction authenticationと呼ぶこと。
