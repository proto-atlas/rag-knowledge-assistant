# デプロイ確認手順

更新日: 2026-05-05
状態: デプロイ手順と手動確認の参照文書

この文書は、確認用キーで利用を制限した実API接続のデプロイと、手動の実プロバイダー確認を扱います。secret値はcommitしません。

デプロイ状況: 過去のモック応答だけの公開URL確認は検証記録に保存しています。実API確認用デプロイ後は、新しいデプロイ確認と手動の実プロバイダー確認記録を追加します。

## 確認用実APIデプロイ

通常の公開トップページは未認証で閲覧できます。動的検索と回答生成は、課金と乱用防止のため確認用キーで保護します。

推奨する既定設定:

- 公開トップページは確認用キーなしで見える。
- 動的検索と回答生成は `RAG_ACCESS_KEY` を要求する。
- 動的検索と回答生成は、IP単位のAPI呼び出し制限も通る。`RAG_DISABLE_RATE_LIMIT=true` はテスト・開発時の迂回設定で、本番デプロイでは設定しない。
- `/api/search` は `RAG_SEARCH_PROVIDER_MODE=vectorize-d1` でWorkers AI / Vectorize / D1を使う。
- `/api/ask` は `RAG_ANSWER_PROVIDER_MODE=anthropic` と `RAG_ENABLE_ANTHROPIC_LIVE=true` でAnthropicのストリーミング回答を使う。
- 回答しない判定時はClaude APIへ進まない。

必要なCloudflare resources:

- D1 database: `rag-knowledge-assistant-db`
- D1 binding: `RAG_DB`
- Vectorize index: `rag-bge-m3-v1`
- Vectorize binding: `RAG_VECTOR_INDEX`
- Workers AI binding: `AI`
- Assets binding: `ASSETS`
- 有効な索引バージョン変数: `RAG_ACTIVE_INDEX_VERSION=rag-bge-m3-v1`

必要なsecret:

```bash
corepack pnpm wrangler secret put RAG_ACCESS_KEY
corepack pnpm wrangler secret put RAG_ANTHROPIC_API_KEY
```

内部確認経路向けの任意admin secret:

```bash
corepack pnpm wrangler secret put RAG_ADMIN_ACCESS_KEY
```

通常deploy前の確認:

```bash
corepack pnpm run typecheck
corepack pnpm run lint
corepack pnpm run test
corepack pnpm run build
corepack pnpm run build:worker
corepack pnpm run test:e2e
```

デプロイコマンド:

```bash
corepack pnpm wrangler deploy
```

`wrangler.jsonc`で必要なvars:

- `RAG_SEARCH_PROVIDER_MODE=vectorize-d1`
- `RAG_ANSWER_PROVIDER_MODE=anthropic`
- `RAG_ENABLE_ANTHROPIC_LIVE=true`
- `RAG_CLAUDE_MODEL=claude-sonnet-4-6`
- `RAG_ANTHROPIC_MAX_TOKENS=256`
- `RAG_MIN_PROVIDER_VECTOR_SCORE=0.55`
- `RAG_RATE_LIMIT_MAX_REQUESTS=12`
- `RAG_RATE_LIMIT_WINDOW_SECONDS=60`

Anthropic model idは実装直前に公式docsで再確認します。2026-05-05時点では公式model overview（https://docs.anthropic.com/en/docs/about-claude/models/overview）で `claude-sonnet-4-6` を確認済みです。

実施前に、Anthropic Console側の支出上限を確認します。Worker側のトークン上限やAPI呼び出し制限だけでは、プロバイダーへ直接到達した呼び出しの上限にはなりません。

実API確認期間は、新しい`RAG_ACCESS_KEY`を使います。過去に配ったkeyを使い回すと、意図しない相手が実API確認期間にアクセスできるため避けます。

## 手動の実プロバイダー確認

手動の実プロバイダー確認は、実API確認用デプロイ後に最小件数で行います。通常CIでは実行しません。

デプロイ後の手動確認コマンド:

```bash
corepack pnpm run check:manual-live-rag -- --confirm-manual-live-rag-check
```

手動確認コマンドに必要なローカル環境変数:

- `RAG_LIVE_CHECK_URL`
- `RAG_ACCESS_KEY`

緊急ロールバック手順:

1. Anthropic Consoleで使用keyをrevokeする
2. `RAG_ANSWER_PROVIDER_MODE=mock` または `RAG_ENABLE_ANTHROPIC_LIVE=false` のロールバック設定をdeployする
3. `RAG_ANTHROPIC_API_KEY` Worker secretを削除する
4. `wrangler secret list` でAnthropic secretがないことを確認する
5. 確認用キー付き `/api/ask` がAnthropic providerへ進まないことを確認する
6. `git status --short` で意図しないtracked diffがないことを確認する

## 別途検証記録が必要な項目

対応するevidenceが存在するまで、以下は主張しません。

- 実API確認用デプロイの検証
- Claude回答生成の複数回確認
- デプロイ済み環境のrate limit挙動

過去のモック応答だけの公開URL確認は検証記録に保存しています。実API確認用デプロイ後は新しい検証記録を追加します。

## デプロイ後に残す確認記録

記録ファイルの候補:

- `docs/evidence/deployment-check-YYYY-MM-DD.md`
- `docs/evidence/manual-live-rag-check-YYYY-MM-DD.md`

検証記録に含めないもの:

- 確認用キー
- Anthropic API key
- cookies
- 実プロバイダーの応答本文
- スタックトレース
- 非公開の運用詳細を含むプロンプト本文

## 再デプロイ時の手順

再デプロイ時は、日付付きの新しい確認記録を作成します。同日に複数回実施する場合はsuffixを付けます。READMEの機能対応表では公開UI / 公開 `/api/search` / 公開 `/api/ask` の3行だけを最新の確認記録へ更新します。旧記録は削除せず、必要ならタイトル直下に `Superseded by ...` を追加します。Workerバージョンとcommitの対応は `docs/evidence/INDEX.md` のデプロイ履歴で管理します。
