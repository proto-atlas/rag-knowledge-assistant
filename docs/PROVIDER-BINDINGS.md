# Provider Binding設計

更新日: 2026-05-05
状態: 確認用の実プロバイダー構成の記録

この文書は、実プロバイダー経路で使うCloudflare bindingsとprovider境界を説明します。同時に、現在作成済みのWorkers AI / Vectorize / D1 setupの特定時点の記録です。

## 確認済みの現在状態

- `@cf/baai/bge-m3` のWorkers AI dimension probeをmanualで実行済み。
- Vectorize index `rag-bge-m3-v1` は1024 dimensions / cosine metricで作成済み。
- Vectorize metadata indexesは `indexVersion` と `category` 向けに作成済み。
- `wrangler.jsonc` はWorkers AI binding、Vectorize binding、D1 binding、active index version variableを含みます。
- Claudeを呼ばない手動のVectorize確認で、3 fictional chunk vectorsのupsert/queryを実施済み。
- Remote D1は存在し、migrations適用とfixture seedが完了済み。
- Full fixture vectorsは `rag-bge-m3-v1` へupsert済み。
- Anthropic answer provider boundaryは明示的なlive guardsの背後に存在します。
- 確認用キー付きの手動確認で、回答できる質問1件のWorkers AI / Vectorize / D1 / Anthropicストリーミング経路を確認済みです。
- 現在のデプロイ設定は、確認用キーで利用を制限した確認用の実プロバイダー構成としてWorkers AI / Vectorize / D1 / Anthropicを使う設定です。

この文書で扱わない範囲:

- デプロイ済みapplication routeの実プロバイダー検索を検証済みとは主張しません。
- 反復的なClaude API実API評価を実行済みとは主張しません。
- 非公開文書や任意コーパスに対する実用RAG品質は主張しません。
- この設定記録だけでprovider検索品質を証明するものではありません。

## Binding Names

| Binding | Type | Purpose | Publicly exposed |
|---|---|---|---:|
| `AI` | Workers AI | `@cf/baai/bge-m3` でquestion embeddingを生成 | no |
| `RAG_VECTOR_INDEX` | Vectorize | indexed chunk vectorsをquery | no |
| `RAG_DB` | D1 | documents、chunks、index runsのsource of truth | no |
| `RAG_ACCESS_KEY` | Secret | search / askの利用を確認用キーで制限 | no |
| `RAG_ADMIN_ACCESS_KEY` | Secret | 内部確認と将来のadmin reindex保護 | no |
| `RAG_ANTHROPIC_API_KEY` | Secret | 確認用キー付きask用のClaude answer generation | no |
| `RAG_CLAUDE_MODEL` | Env var | 確認用キー付きask用のClaude model id | no |
| `RAG_ANTHROPIC_MAX_TOKENS` | Env var | 確認用キー付きask用のoutput cap | no |
| `RAG_ENABLE_ANTHROPIC_LIVE` | Env var | 実プロバイダー経路の明示的な有効化条件 | no |
| `RAG_DISABLE_RATE_LIMIT` | Env var | local test / dev用のIP rate limit bypass | no |
| `RAG_RATE_LIMIT_MAX_REQUESTS` | Env var | API回数制限の時間枠内リクエスト上限を上書き | no |
| `RAG_RATE_LIMIT_WINDOW_SECONDS` | Env var | API回数制限の時間枠秒数を上書き | no |
| `RAG_SEARCH_PROVIDER_MODE` | Env var | search providerをmockから実プロバイダー経路へ切替 | no |
| `RAG_ANSWER_PROVIDER_MODE` | Env var | answer providerをmockからAnthropicへ切替 | no |
| `RAG_ACTIVE_INDEX_VERSION` | Env var | active retrieval index version | coarse public statusとしてのみ返す |
| `RAG_MIN_PROVIDER_VECTOR_SCORE` | 環境変数 | 実プロバイダー検索の回答しない判定値の上書き | no |

## Current `wrangler.jsonc` Shape

現在の `wrangler.jsonc` は、secretを含まない確認用実プロバイダー設定を持ちます。

```jsonc
{
  "workers_dev": true,
  "preview_urls": false,
  "d1_databases": [
    {
      "binding": "RAG_DB",
      "database_name": "rag-knowledge-assistant-db",
      // D1 database_idはsecretとして扱わない。
      // アクセスにはCloudflareアカウントとbinding権限が必要。
      "database_id": "7a9b54db-b72a-4bf6-bc3d-f56537ad50fa"
    }
  ],
  "ai": {
    "binding": "AI"
  },
  "vectorize": [
    {
      "binding": "RAG_VECTOR_INDEX",
      "index_name": "rag-bge-m3-v1"
    }
  ],
  "vars": {
    "RAG_ACTIVE_INDEX_VERSION": "rag-bge-m3-v1",
    "RAG_SEARCH_PROVIDER_MODE": "vectorize-d1",
    "RAG_ANSWER_PROVIDER_MODE": "anthropic",
    "RAG_ENABLE_ANTHROPIC_LIVE": "true",
    "RAG_CLAUDE_MODEL": "claude-sonnet-4-6",
    "RAG_ANTHROPIC_MAX_TOKENS": "256",
    "RAG_MIN_PROVIDER_VECTOR_SCORE": "0.55",
    "RAG_RATE_LIMIT_MAX_REQUESTS": "12",
    "RAG_RATE_LIMIT_WINDOW_SECONDS": "60"
  }
}
```

Secretはリポジトリ外で設定します。

```bash
corepack pnpm wrangler secret put RAG_ACCESS_KEY
corepack pnpm wrangler secret put RAG_ADMIN_ACCESS_KEY
corepack pnpm wrangler secret put RAG_ANTHROPIC_API_KEY
```

## D1 database IDの公開範囲

`wrangler.jsonc` に含まれるD1 `database_id` は、この固定データ検証環境ではsecretとして扱っていません。ID単体ではD1をread/writeできず、実際のアクセスにはCloudflare account権限、Worker binding、または適切なAPI tokenが必要です。また、application routeのerror responseはsanitized responseとして返し、D1 `database_id`、stack trace、raw provider error、secret値をresponse bodyへ含めない方針です。

一方で、本番運用では多層防御と監査上の扱いやすさを優先し、公開設定ファイルから外して非公開のデプロイ設定や環境別設定へ寄せる選択肢があります。このリポジトリでは、確認環境向けの実API確認設定として公開してもsecret漏えいとは扱わないが、本番設定の確認時には外出しを検討する、という境界で記録します。

## Index Version Policy

- `rag-bge-m3-v1` は最初のprovider index versionです。
- controlled Workers AI probeでは、2026-04-30T13:10:05.625Z時点で `@cf/baai/bge-m3` が1024 dimensionsを返しました。
- `rag-bge-m3-v1` のVectorize metricは `cosine` です。
- appはactive index versionだけをqueryします。
- Vectorize query optionsは `indexVersion = RAG_ACTIVE_INDEX_VERSION` metadata filterを含めます。
- model、dimensions、metric、chunking strategy、source corpusが非互換に変わる場合は、既存indexの意味を変えず、新しいindex versionを作ります。
- 古いvectorsはmaintenance cleanupまで物理的に残る可能性がありますが、active `indexVersion` filteringでnormal searchから除外します。

### Vectorize更新手順

Vectorizeを新しいembedding modelやchunking条件へ更新する場合は、次の順序で扱います。

1. 新しい `indexVersion` を決める。例: `rag-bge-m3-v2`。旧versionのvectorやD1 chunk metadataを同じ名前のまま上書きしない。
2. Workers AIモデル、次元数、Vectorizeの距離指標、chunk分割方針、根拠コーパス、スコアしきい値の方針を確認する。次元数や距離指標が変わる場合は、新しいVectorize索引の作成が必要になる。
3. 全chunkを新しい条件でre-embeddingする。一部chunkだけを新modelに差し替える運用は、同じ `indexVersion` 内でembedding条件が混在するため避ける。
4. D1の `chunks.index_version` と `index_runs` には、新しい `indexVersion`、embedding model、Vectorize index name、実行状態を記録する。D1はsource of truthなので、Vectorize upsertだけで更新完了と扱わない。
5. Vectorize upsert時のmetadataにも同じ `indexVersion` を入れる。app側のquery filterは `RAG_ACTIVE_INDEX_VERSION` と一致するmetadataだけを通常検索対象にする。
6. 新バージョンのD1 lookup、Vectorize query、実プロバイダー検索評価、手動確認を確認する。スコアしきい値や回答しない判定の方針は旧バージョンの値をそのまま引き継がない。
7. 新versionが通った後で `RAG_ACTIVE_INDEX_VERSION` を切り替える。切替前は旧active versionを維持し、途中失敗時に通常検索へ混在させない。
8. 旧vectorsは必要に応じてmaintenance cleanupする。cleanup完了までは物理的に残っていても、active `indexVersion` filterで通常検索から除外する。

## 実プロバイダー経路の方針

初期の実プロバイダー経路は、明示的な設定と確認用キーの背後に置きます。

- Local/testの代替処理はmock lexical retrievalです。
- 必要なbindingsが不足している場合はfail closedします。
- 通常のCIでは有効化しません。
- 確認は手動かつ小さく保ちます。

Provider-mode retrievalは、`RAG_MIN_PROVIDER_VECTOR_SCORE` が未設定の場合 `MIN_PROVIDER_VECTOR_SCORE = 0.55` を使います。この値は現在の固定データとindex versionに合わせた閾値です。Vectorize一般のscore不変条件ではありません。corpus、chunking strategy、embedding model、index version、Vectorize metricが変わる場合は、thresholdとvalidation policyを再評価します。

Anthropic answer modeは、`RAG_ANTHROPIC_MAX_TOKENS` が未設定の場合 `DEFAULT_ANTHROPIC_MAX_TOKENS = 512` を使います。`RAG_ANTHROPIC_MAX_TOKENS` は64〜2048の整数だけを受け付けます。実API確認用のデプロイでは `256` を明示設定します。この上限は固定データ確認で外部APIの呼び出し量を抑えるための既定値であり、回答長の運用方針を示すものではありません。実サービスとして扱う場合は、route/model単位でmax tokensとtruncation behaviorを別途検討します。

Anthropic実APIモードでは、引用元ID検証を回答生成後に行います。ストリーミング中に `answer_delta` を受け取り、ストリーム完了後に引用IDを検証します。完全なbuffer-then-flush方式ではないため、「不正な引用回答を表示前に完全遮断」とは主張しません。

IP-based rate limitは、`/api/search` と `/api/ask` の確認用キー検証後に働くAPI呼び出し制限です。既定値は60 requests / 60 secondsで、`RAG_RATE_LIMIT_MAX_REQUESTS` と `RAG_RATE_LIMIT_WINDOW_SECONDS` でoverrideできます。`RAG_DISABLE_RATE_LIMIT=true` はtest/dev bypass用で、公開URLでは設定しません。このrate limitはユーザー認証、利用者ごとの上限、キーごとのリクエスト予算、WAF、bot protectionの代替ではありません。

## 外部回答生成を扱う前に確認すること

- 実API確認用デプロイの検証記録を作成する。
- 実プロバイダー経路がraw provider errors、prompts、secrets、cookies、stack tracesを漏らさないことを確認する。
- 手動のClaude実API確認は、明示的なコスト承認、新しい確認用キー、支出上限確認、secret設定の後だけ実行する。
