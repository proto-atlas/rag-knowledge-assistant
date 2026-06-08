# デプロイ準備確認記録

生成日時: 2026-05-01T09:48:44+09:00
確認環境: ローカル実行
確認種別: デプロイ準備文書の確認
結果: 部分的に成功

この記録では、deployment手順と設定境界を残す。
Workerのデプロイは実行していません。

## 対象

追加したファイル:

- `docs/DEPLOYMENT.md`

更新したファイル:

- `docs/PROVIDER-BINDINGS.md`
- `README.md`
- `docs/verification.md`

## 挙動

デプロイ手順では、以下を分けています。

- 通常の公開デプロイ
- 実プロバイダー接続確認用のデプロイ

通常の公開デプロイでは、Claude実API生成を既定で無効にします。

手動の実プロバイダー確認に必要なもの:

- explicit cost approval
- `RAG_ANTHROPIC_API_KEY`
- `RAG_SEARCH_PROVIDER_MODE=vectorize-d1`
- `RAG_ANSWER_PROVIDER_MODE=anthropic`
- `RAG_ENABLE_ANTHROPIC_LIVE=true`
- `RAG_CLAUDE_MODEL`

## provider secret名

Provider secret名は `RAG_ANTHROPIC_API_KEY` です。
実装はこのプロジェクト用のsecret名を読みます。

## 確認

文書のみの更新です。

## この記録に含めない範囲

- Cloudflare deployは実行していません。
- Anthropic secretは設定していません。
- Claude実API呼び出しは実行していません。
- デプロイ済み公開URLは確認していません。
