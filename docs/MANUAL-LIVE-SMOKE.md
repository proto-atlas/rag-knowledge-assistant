# Manual Live Smoke Checklist

このチェックリストは、明示的なコスト承認後にだけ行う小さなmanual live provider smoke用です。通常CIには含めません。

## 目的

guarded provider pathが実bindingsで動くかを、最小件数で確認します。

- Workers AI query embedding
- Vectorize search
- D1 source-card read
- Anthropic Messages streaming answer
- post-generation source id validation

## 事前条件

以下をすべて満たす場合だけ実行します。

- 明示的なコスト承認がある
- Anthropic Console側のhard spend limitを確認済み
- 限定live期間用にfreshな `RAG_ACCESS_KEY` を設定し、過去に配ったkeyと使い回さない
- Anthropic API keyがsecretまたは一時shell environment variableとして設定されている
- secretをchat、docs、commit、screenshot、evidenceへ貼らない
- `RAG_ANSWER_PROVIDER_MODE=anthropic`
- `RAG_ENABLE_ANTHROPIC_LIVE=true`
- `RAG_CLAUDE_MODEL` にmodel idを設定済み
- manual smokeでは `RAG_ANTHROPIC_MAX_TOKENS=256` を明示設定済み
- `RAG_SEARCH_PROVIDER_MODE=vectorize-d1`
- `RAG_ACCESS_KEY` を設定済み
- `RAG_ACTIVE_INDEX_VERSION=rag-bge-m3-v1`
- `RAG_RATE_LIMIT_MAX_REQUESTS` と `RAG_RATE_LIMIT_WINDOW_SECONDS` をmanual smoke向けに小さく設定済み
- D1に8 fixture documentsと24 chunksがある
- Vectorize index `rag-bge-m3-v1` に24 vectorsがある

## Scope Limit

最大件数:

- known-answer request: 1
- no-answer request: 1

実施しないこと:

- bulk eval
- load test
- arbitrary user text
- private document input
- repeated regeneration

## Command

scriptは明示的なconfirmation flagなしでは実行を拒否します。

Required environment variables:

- `RAG_LIVE_SMOKE_URL`
- `RAG_ACCESS_KEY`

Command:

```bash
corepack pnpm run smoke:manual-live-rag -- --confirm-manual-live-rag-smoke
```

sanitized local summaryの出力先:

```text
.tmp/manual-live-rag-smoke/summary.json
```

`.tmp` outputsはcommitしません。

## Sanitization Boundary

smoke scriptのsecret-like needle検出は、scriptが実際にheaderへ入れるaccess keyだけを対象にします。Anthropic API keyはsmoke scriptへ渡さず、Worker secretとして扱います。そのためAnthropic API keyの不記録は、Worker側のsanitized error / event設計、Worker secret削除、Console側key revokeで担保します。

## Request Cases

Known-answer question:

```text
リモート勤務の申請期限は？
```

Expected behavior:

- `retrieval_start` を返す
- `sources` を返す
- `generation_start` を返す
- 1件以上の `answer_delta` を返す
- `done` を返す
- cited source idsがreturned sources内に存在する
- raw provider response、prompt、stack trace、cookie、secretが出ない

Pass criteria:

- `hasDone=true`
- `hasSources=true`
- `answerDeltaCount > 0`
- `hasProviderError=false`
- `hasSourceValidationFailed=false`
- `sourceIds.length > 0`
- `leakedNeedles.length === 0`

No-answer question:

```text
天気予報を教えて
```

Expected behavior:

- retrievalが弱い場合、provider call前に `no_answer` を返す
- `answer_delta` を返さない
- fabricated document-grounded answerを出さない
- raw provider response、prompt、stack trace、cookie、secretが出ない

Pass criteria:

- `hasDone=true`
- `hasSources=true`
- `hasNoAnswer=true`
- `answerDeltaCount === 0`
- `hasProviderError=false`
- `hasSourceValidationFailed=false`
- `leakedNeedles.length === 0`

## Source Validation Boundary

live Anthropic modeのsource validationはpost-generationです。`answer_delta` をstreamingしながら受け取り、stream完了後にcitation idを検証します。そのため、現時点では「検証前に一切表示しない」方式ではありません。

公開説明では、以下のように表現します。

```text
source id validation failureを検出し、通常回答として扱わないUI状態へ落とします。
```

以下のような表現は使いません。

```text
不正citation回答を表示前に完全に遮断します。
```

## Evidence Template

smoke完了後だけdated evidence fileを作成します。

Suggested path:

```text
docs/evidence/manual-live-rag-smoke-YYYY-MM-DD.md
```

Suggested contents:

```text
# Manual Live RAG Smoke Evidence

Generated at:
Generated from:
Generated from note:
Check type: manual live provider smoke
Result:

## Scope

- Known-answer requests:
- No-answer requests:
- Bulk eval:
- Load test:
- Private documents:

## Configuration

- Search provider mode:
- Answer provider mode:
- Active index version:
- Claude model:
- D1 fixture rows:
- Vectorize vector count:

## Results

| Case | Result | Notes |
|---|---|---|
| known-answer |  |  |
| no-answer |  |  |

## Sanitization

- API key recorded:
- cookies recorded:
- raw provider response recorded:
- prompt recorded:
- stack trace recorded:

## Not Claimed

- This is not a bulk eval.
- This is not a load test.
- This does not prove general RAG quality.
- This does not prove provider-side cost reversal after abort.
```

## Stop Conditions

以下が出たら即停止します。

- provider raw errorがUIに出る
- secret-like valueがUI、logs、evidenceに出る
- first requestがserver configuration errorsで失敗する
- rate limitやquota behaviorが不明
- first requestが想定より多いcallを消費する
- known-answerで `answerDeltaCount` が0のまま終わる
- `hasProviderError=true`
- `hasSourceValidationFailed=true`

scriptはcaseごとのfailを検出した時点でloopを止め、残りcaseを実行しません。first requestがfailした場合、no-answer requestは送信しません。

## Emergency Rollback SOP

限定live demoでprovider error、想定外の課金、secret-like valueの露出、またはrate limit挙動の不明点が出た場合は、短い時間でfail-closedへ戻します。

1. Anthropic Consoleで使用したAPI keyをrevokeする
2. `RAG_ANSWER_PROVIDER_MODE=mock` または `RAG_ENABLE_ANTHROPIC_LIVE=false` のrollback configをdeployする
3. `corepack pnpm wrangler secret delete RAG_ANTHROPIC_API_KEY` でWorker secretを削除する
4. `corepack pnpm wrangler secret list` で `RAG_ANTHROPIC_API_KEY` がないことを確認する
5. access key付き `/api/ask` を1回だけ叩き、Anthropic providerへ進まないことを確認する
6. `git status --short` が空、または意図したdocs/code差分だけであることを確認する
