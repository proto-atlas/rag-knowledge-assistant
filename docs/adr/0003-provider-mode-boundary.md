# ADR 0003: Provider modeの境界

状態: ADR 0005で置き換え
日付: 2026-05-02

## 日本語要約

当初は公開URLをモック応答だけの確認画面として維持し、実プロバイダー設定を明示的な環境変数と確認用/admin keyの背後に置く方針でした。確認用の実プロバイダー構成へ進めるため、現在の公開方針はADR 0005で更新しています。ここでいう確認用キーはAPI呼び出し制限であり、本番認証ではありません。

## 背景

公開URLは、制限なしの実プロバイダー呼び出しを発生させずに確認できる必要がありました。検索だけのRAGでもembeddingやvector resourceを消費し、回答生成ではmodel tokensを消費します。

## 決定

公開URLの既定経路はモック応答のままにし、実プロバイダー経路は明示的な環境変数と確認用キーの背後に置く。

実プロバイダー経路には、以下の設定を要求する。

- provider search用の `RAG_SEARCH_PROVIDER_MODE=vectorize-d1`
- Anthropic answer用の `RAG_ANSWER_PROVIDER_MODE=anthropic`
- Anthropic実API呼び出し用の `RAG_ENABLE_ANTHROPIC_LIVE=true`
- 保護されたdynamic route用の確認用/admin keys

確認用キーはAPI呼び出し制限のための仕組みであり、本番認証ではない。

## 影響

利点:

- 公開URLを開くだけではprovider costが発生しない。
- provider準備状態を、小さく明示的な接続確認で確認できる。
- READMEで、公開URLで確認できる範囲とprovider準備確認の範囲を分けられる。

トレードオフ:

- 公開URLは実運用RAG SaaSではない。
- 本番利用には、ユーザー認証、rate limit、audit log、key rotation、provider cost monitoringが別途必要になる。
