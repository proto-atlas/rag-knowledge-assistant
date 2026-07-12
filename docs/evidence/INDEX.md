# 検証記録の一覧

更新日: 2026-05-05
対象: 公開している検証記録の案内

各検証記録は特定時点のログです。以後のcommit、deployment、provider設定でも同じ結果になるという主張ではありません。

現在のローカル設定では、unit test 228件が成功し、E2E test 12件を収集できます。古い準備確認記録には、変更時点で追加・実行した件数だけが記録されている場合があります。

## 状態ラベル

- `公開URL確認`: 公開URLで挙動を観測できる記録。対応するWorker versionはDeployment Timelineで管理します。
- `反映済み`: コードやdocsには反映済みですが、公開URLで直接観測できない記録。
- `手動またはローカル確認`: 内部APIの確認、ローカル評価、手動チェックリストのいずれか。

## 壊れやすいケースと扱い

| ケース | 実装上の扱い | 見える結果 |
|---|---|---|
| 根拠が弱い質問 | 回答しない状態として扱い、回答生成へ進めない | 無理に答えない状態をUIで確認できる |
| 存在しない引用ID | 生成後に引用IDを検証し、通常回答として扱わない | 引用ID検証失敗の境界をdocsで追える |
| provider設定がない | fail closedにし、通常回答へ進めない | サーバー設定エラーとして扱う |
| D1 / Vectorizeのindex世代がずれる | `indexVersion` で同じ世代のchunkだけを扱う | 検索結果と本文の対応を保つ |
| 実プロバイダーの利用量が増える | 確認用キーとIP単位の制限を通す | 未認証トップページからproviderを呼ばない |

## デプロイ履歴

| 日付 | Worker version | commit | 検証記録 | 補足 |
|---|---|---|---|---|
| 2026-07-13 | `e126fa1a-c893-4e01-bd51-81c0d3750995` | `13d6e8b` | `wrangler deploy` | 公開URLのトップページがHTTP 200 |
| 2026-05-01 | 検証記録内に記載 | 検証記録内に記載 | `deployment-check-2026-05-01.md` | 初回のモック応答デプロイ確認 |
| 2026-05-02 | `5f9ba783-b039-4c07-976c-56d4f9605a91` | `de9588f` | `deployment-sanity-2026-05-02.md` | 以前の公開runtime確認 |
| 2026-05-03 | `2fcfd549-311f-4723-a801-d0f9bbeaeaa5` | `368f6d7` | `deployment-check-2026-05-03.md` | 公開runtime確認 |
| 2026-05-04 | `08400d4d-3fca-4d9d-ae94-c1a1268e4ad4` | `6110857` | `manual-live-rag-check-2026-05-04.md` | 確認用キー付きの回答できる質問確認 |
| 2026-05-04 | `a9af6129-8ab9-4c38-9ad4-e3914ae67d77` | `6110857` | `manual-live-rag-check-2026-05-04.md` | 公開既定をモック応答設定に戻した確認 |
| 2026-05-05 | `16fb7705-3098-48e8-bf2b-d5360260322c` | `5bd3eef` | `manual-live-rag-check-2026-05-05.md` | 限定的な実API設定のデプロイ |
| 2026-05-05 | `89c540e9-f754-47ca-b0af-9d2e7d6e0ed8` | `5bd3eef` | `manual-live-rag-check-2026-05-05.md` | Anthropic secret更新後の確認 |

README、docs、evidenceの更新commitは、公開URLのWorker versionを必ず更新するものではありません。公開runtimeの対応関係はこのDeployment Timelineを参照してください。

## まず見る記録

- `手動またはローカル確認` `retrieval-eval-2026-04-30.md`: ローカルの固定データ検索評価。
- `手動またはローカル確認` `provider-retrieval-eval-2026-05-02.md`: 同じ固定データに対する実プロバイダー検索評価。
- `手動またはローカル確認` `external-benchmark-eval-2026-05-03.md`: Mr. TyDi Japanese dev subsetに対するローカル語彙検索の基準値。公式full-corpus scoreではありません。
- `公開URL確認` `ui-screenshots-2026-04-30.md`: top page、answer UI、citation focusのスクリーンショット。
- `手動またはローカル確認` `provider-mode-search-readiness-2026-05-01.md`: `/api/search` 実プロバイダー経路の準備確認。
- `手動またはローカル確認` `anthropic-answer-provider-readiness-2026-05-01.md`: fake-fetch testsによるAnthropic answer-providerの準備確認。
- `公開URL確認` `manual-live-rag-check-2026-05-05.md`: 確認用キー付き実API設定で回答できる質問1件と回答しない質問1件を確認。
- `手動またはローカル確認` `manual-live-rag-check-2026-05-04.md`: 確認用キー付きの手動確認で回答できる質問1件を確認。
- `公開URL確認` `deployment-check-2026-05-03.md`: モック応答のCloudflare deployment check。
- `公開URL確認` `deployment-check-2026-05-01.md`: 以前のモック応答Cloudflare deployment check。
- `公開URL確認` `deployment-sanity-2026-05-02.md`: deploy後のpublic route sanity check。
- `反映済み` `dependency-audit-2026-05-02.md`: dependency audit。
- `反映済み` `a11y-review-2026-05-02.md`: source-level accessibility review。
- `反映済み` `axe-a11y-2026-05-02.md`: ローカルのモック応答UI statesに対するaxe-core check。
- `手動またはローカル確認` `screen-reader-manual-a11y-2026-05-03.md`: Windows Narrator + Chromeで主要7状態を確認したscreen reader check。
- `公開URL確認` `lighthouse-2026-05-02.md`: モック応答deploymentのLighthouse lab measurement。
- `反映済み` `bundle-size-2026-05-02.md`: local production build bundle-size measurement。
- `反映済み` `sse-latency-2026-05-02.md`: in-process mock `/api/ask` SSE latency measurement。
- `反映済み` `runtime-settings-check-2026-05-02.md`: 確認用キー比較、structured error logs、public-status parsing、Anthropic max-token configuration。
- `反映済み` `ci-settings-check-2026-05-02.md`: GitHub Actions quality workflow settings check。
- `反映済み` `ip-rate-limit-boundary-2026-05-03.md`: `/api/search` と `/api/ask` のIP単位のAPI呼び出し制限。

## 検索とindexing

- `../adr/0001-index-version-policy.md`
- `../adr/0002-no-answer-threshold.md`
- `workers-ai-dimension-probe-2026-04-30.md`
- `vectorize-index-setup-2026-04-30.md`
- `vectorize-check-2026-04-30.md`
- `worker-binding-vectorize-check-2026-05-01.md`
- `vectorize-fixture-index-readiness-2026-05-01.md`
- `provider-search-check-2026-05-01.md`
- `provider-retrieval-eval-2026-05-02.md`
- `../adr/0004-external-benchmark-subset-policy.md`
- `external-benchmark-eval-2026-05-03.md`

## D1をsource of truthにする境界

- `d1-source-of-truth-readiness-2026-05-01.md`
- `d1-remote-setup-2026-05-01.md`
- `d1-seed-sql-readiness-2026-05-01.md`
- `d1-worker-check-2026-05-01.md`

## 回答streaming

- `../adr/0003-provider-mode-boundary.md`
- `../adr/0005-limited-provider-boundary.md`
- `ask-streaming-mock-readiness-2026-05-01.md`
- `anthropic-stream-adapter-readiness-2026-05-01.md`
- `answer-provider-mode-readiness-2026-05-01.md`
- `anthropic-answer-provider-readiness-2026-05-01.md`
- `manual-live-rag-check-readiness-2026-05-01.md`
- `manual-live-rag-check-2026-05-04.md`
- `sse-latency-2026-05-02.md`

## デプロイ

- `deployment-readiness-2026-05-01.md`
- `deployment-check-2026-05-03.md`
- `deployment-check-2026-05-01.md`
- `deployment-sanity-2026-05-02.md`
- `ci-settings-check-2026-05-02.md`

## 依存関係とruntime安全性

- `dependency-audit-2026-05-02.md`
- `runtime-settings-check-2026-05-02.md`
- `ip-rate-limit-boundary-2026-05-03.md`

## frontend accessibility確認

- `a11y-review-2026-05-02.md`
- `axe-a11y-2026-05-02.md`
- `screen-reader-manual-a11y-2026-05-03.md`

## frontend performance確認

- `lighthouse-2026-05-02.md`
- `bundle-size-2026-05-02.md`
- `sse-latency-2026-05-02.md`
