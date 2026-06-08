# Provider統合準備記録

生成日時: 2026-04-30T20:20:00+09:00
確認環境: ローカル実行
確認種別: provider統合計画確認 / 実API呼び出しなし
結果: 部分的に成功

## 対象

この記録では、Workers AI、Vectorize、Claude APIの実呼び出しを追加する前に置いたprovider向けの前提を残します。

この記録では、Workers AI、Vectorize、D1、Claude API、Cloudflare deploy、secret lookup、rate-limit testは実行していません。

## 公式ドキュメント確認

- Cloudflare Workers AI binding: Workers AIは`AI` binding経由で使い、Worker codeから`env.AI.run(model, input)`を呼ぶ。
- Cloudflare Workers AI bge-m3 model: `@cf/baai/bge-m3`は`text`に文字列または文字列配列を受け取り、ドキュメント化されたshapeでembedding配列を返す。
- Cloudflare Vectorize Worker binding: Vectorize indexはWorkersにbindingし、`env.<BINDING>.query(vector, options)`で検索する。
- Cloudflare Vectorize query options: `topK`の既定値は5。`returnMetadata: "all"`とmetadata filteringを使える。
- Cloudflare Vectorize metadata filtering: metadataは保存できる量が限られるため、filter条件は明示する。このRAGアプリではchunk本文をVectorize metadataではなく、D1またはfixture chunk storage側に置く。
- Anthropic Messages streaming: streamingでは`message_start`、`content_block_delta`、`message_delta`、`message_stop`などのSSE eventを受け取る。未知のevent typeは失敗させずに扱う。

## 追加したlocal実装

- Workers AIとVectorize binding向けに、local provider境界の型を追加。
- provider searchがmetadata filterにactive `indexVersion` を必ず含めるよう、`createVectorizeQueryOptions()` を追加。
- Vectorize queryへ渡す前にWorkers AI embedding outputを検証するため、`parseFirstWorkersAiEmbeddingVector()` を追加。
- UIの根拠カードへ変換する前にVectorize match shapeを検証するため、`parseVectorizeMatches()` を追加。
- provider raw outputをclientへ出さず、provider matchesを既存の`SearchResponse` shapeへ変換するため、`createSearchResponseFromVectorMatches()` を追加。

## この記録に含めない範囲

- 設定済みのVectorize indexが存在することを証明するものではありません。
- このaccountでの `@cf/baai/bge-m3` のdimension、metric、presetを証明するものではありません。
- productionでCloudflare binding名が設定済みであることを証明するものではありません。
- このアプリでのClaude API streaming挙動を証明するものではありません。
- `/api/search` は変更しません。現在のrouteは引き続きmock lexical retrievalを使います。

## 実プロバイダー確認前に行うこと

実プロバイダーモードを有効にする前に確認すること:

1. Workers AIとVectorizeのWrangler bindingsを追加する。
2. Vectorize indexのdimension、metric、presetを公式docsと限定probeで確認する。
3. 1件の質問をembeddingし、小さなindexed fixture setをqueryし、D1またはfixture chunk sourceからchunk本文を取得するClaudeなしのVectorize確認を追加する。
4. 実プロバイダー確認はすべて手動実行とし、通常CIには含めない。
