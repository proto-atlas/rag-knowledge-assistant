# ADR 0005: 実プロバイダー接続の境界

状態: 採用
日付: 2026-05-05

## 日本語要約

公開トップページは未認証で閲覧可能にし、動的検索と回答生成だけを確認用キーで保護します。確認用キー付き経路ではWorkers AI、Vectorize、D1、Anthropicを呼ぶ確認用の実プロバイダー構成として動かします。

## 背景

公開URLでは、モック応答のUIだけでなく実プロバイダーを通るRAG経路も確認できる方が、実装範囲を説明しやすいです。一方で、未認証の公開アクセスからprovider costが発生する構成にはしません。

## 決定

現在のデプロイ設定では、確認用キーで保護した動的routeだけ実プロバイダー経路を使います。

- `RAG_SEARCH_PROVIDER_MODE=vectorize-d1`
- `RAG_ANSWER_PROVIDER_MODE=anthropic`
- `RAG_ENABLE_ANTHROPIC_LIVE=true`
- `RAG_CLAUDE_MODEL=claude-sonnet-4-6`
- `RAG_ANTHROPIC_MAX_TOKENS=256`

トップページはプロバイダー呼び出しなしで公開表示します。`/api/search` と `/api/ask` は `RAG_ACCESS_KEY` を必要とし、確認用キーで利用を制限します。これは本番向けのユーザー認証ではありません。

## 影響

利点:

- 確認用キーを持つ確認者は、Workers AI / Vectorize / D1 / Anthropicの実経路を確認できる。
- 公開トップページを開くだけでは、プロバイダー呼び出しが発生しない。
- Anthropic secretや必須環境変数がない場合は、通常回答へ進めず失敗扱いにする。

トレードオフ:

- 確認用キーの共有は慎重に扱う必要がある。
- 本番認証、ユーザー別quota、WAF、audit log、文書単位ACLは提供しない。
- 実API回答の挙動は特定時点の検証記録であり、一般的なRAG品質を証明するものではない。
