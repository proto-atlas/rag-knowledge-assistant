# Provider Binding Design

Updated: 2026-05-05
Status: limited live provider setup log

この文書は、real RAG provider phaseで使うCloudflare bindingsとprovider境界を説明します。同時に、現在作成済みのWorkers AI / Vectorize / D1 setupのpoint-in-time logです。

## 確認済みの現在状態

- `@cf/baai/bge-m3` のWorkers AI dimension probeをmanualで実行済み。
- Vectorize index `rag-bge-m3-v1` は1024 dimensions / cosine metricで作成済み。
- Vectorize metadata indexesは `indexVersion` と `category` 向けに作成済み。
- `wrangler.jsonc` はWorkers AI binding、Vectorize binding、D1 binding、active index version variableを含みます。
- Manual no-Claude Vectorize smokeで、3 fictional chunk vectorsのupsert/queryを実施済み。
- Remote D1は存在し、migrations適用とfixture seedが完了済み。
- Full fixture vectorsは `rag-bge-m3-v1` へupsert済み。
- Anthropic answer provider boundaryは明示的なlive guardsの背後に存在します。
- access key付きmanual live設定で、known-answer 1件のWorkers AI / Vectorize / D1 / Anthropic streaming pathを確認済みです。
- current deploy configは、access key付き限定live demoとしてWorkers AI / Vectorize / D1 / Anthropicを使う設定です。

主張しないこと:

- deployed application-route provider-mode searchを検証済みとは主張しません。
- 反復的なClaude API live evalを実行済みとは主張しません。
- private documentや任意corpusに対する実用RAG品質は主張しません。
- このsetup logだけでprovider search qualityを証明するものではありません。

## Binding Names

| Binding | Type | Purpose | Publicly exposed |
|---|---|---|---:|
| `AI` | Workers AI | `@cf/baai/bge-m3` でquestion embeddingを生成 | no |
| `RAG_VECTOR_INDEX` | Vectorize | indexed chunk vectorsをquery | no |
| `RAG_DB` | D1 | documents、chunks、index runsのsource of truth | no |
| `RAG_ACCESS_KEY` | Secret | search / askのcost guard | no |
| `RAG_ADMIN_ACCESS_KEY` | Secret | internal smoke / future admin reindex guard | no |
| `RAG_ANTHROPIC_API_KEY` | Secret | access key付きask用のClaude answer generation | no |
| `RAG_CLAUDE_MODEL` | Env var | access key付きask用のClaude model id | no |
| `RAG_ANTHROPIC_MAX_TOKENS` | Env var | access key付きask用のoutput cap | no |
| `RAG_ENABLE_ANTHROPIC_LIVE` | Env var | explicit live-provider guard | no |
| `RAG_DISABLE_RATE_LIMIT` | Env var | local test / dev用のIP rate limit bypass | no |
| `RAG_RATE_LIMIT_MAX_REQUESTS` | Env var | portfolio cost guardのwindow内request上限 override | no |
| `RAG_RATE_LIMIT_WINDOW_SECONDS` | Env var | portfolio cost guardのwindow秒数 override | no |
| `RAG_SEARCH_PROVIDER_MODE` | Env var | search providerをmockからprovider modeへ切替 | no |
| `RAG_ANSWER_PROVIDER_MODE` | Env var | answer providerをmockからAnthropicへ切替 | no |
| `RAG_ACTIVE_INDEX_VERSION` | Env var | active retrieval index version | coarse public statusとしてのみ返す |
| `RAG_MIN_PROVIDER_VECTOR_SCORE` | Env var | provider-mode retrieval gate override | no |

## Current `wrangler.jsonc` Shape

現在の `wrangler.jsonc` は、secretを含まない限定live provider configを持ちます。

```jsonc
{
  "workers_dev": true,
  "preview_urls": false,
  "d1_databases": [
    {
      "binding": "RAG_DB",
      "database_name": "rag-knowledge-assistant-db",
      // Public portfolio config: D1 database_id is not treated as a secret;
      // access still requires the Cloudflare account and binding permissions.
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

Secrets are set outside the repository:

```bash
corepack pnpm wrangler secret put RAG_ACCESS_KEY
corepack pnpm wrangler secret put RAG_ADMIN_ACCESS_KEY
corepack pnpm wrangler secret put RAG_ANTHROPIC_API_KEY
```

## D1 database ID の公開範囲

`wrangler.jsonc` に含まれる D1 `database_id` は、このportfolio demoではsecretとして扱っていません。ID単体ではD1をread/writeできず、実際のアクセスにはCloudflare account権限、Worker binding、または適切なAPI tokenが必要です。また、application routeのerror responseはsanitized responseとして返し、D1 `database_id`、stack trace、raw provider error、secret値をresponse bodyへ含めない方針です。

一方で、production運用ではdefense in depthと監査上の扱いやすさを優先し、公開設定ファイルから外してprivate deployment configや環境別設定へ寄せる選択肢があります。このリポジトリでは、portfolio用の限定live configとして公開してもsecret漏えいとは扱わないが、production hardeningでは外出しを検討する、という境界で記録します。

## Index Version Policy

- `rag-bge-m3-v1` は最初のprovider index versionです。
- controlled Workers AI probeでは、2026-04-30T13:10:05.625Z時点で `@cf/baai/bge-m3` が1024 dimensionsを返しました。
- `rag-bge-m3-v1` のVectorize metricは `cosine` です。
- appはactive index versionだけをqueryします。
- Vectorize query optionsは `indexVersion = RAG_ACTIVE_INDEX_VERSION` metadata filterを含めます。
- model、dimensions、metric、chunking strategy、source corpusが非互換に変わる場合は、既存indexの意味を変えず、新しいindex versionを作ります。
- 古いvectorsはmaintenance cleanupまで物理的に残る可能性がありますが、active `indexVersion` filteringでnormal searchから除外します。

### Vectorize 更新手順

Vectorizeを新しいembedding modelやchunking条件へ更新する場合は、次の順序で扱います。

1. 新しい `indexVersion` を決める。例: `rag-bge-m3-v2`。旧versionのvectorやD1 chunk metadataを同じ名前のまま上書きしない。
2. Workers AI model、dimension、Vectorize metric、chunking strategy、source corpus、score threshold policyを確認する。dimensionやmetricが変わる場合は、新しいVectorize indexの作成が必要になる。
3. 全chunkを新しい条件でre-embeddingする。一部chunkだけを新modelに差し替える運用は、同じ `indexVersion` 内でembedding条件が混在するため避ける。
4. D1の `chunks.index_version` と `index_runs` には、新しい `indexVersion`、embedding model、Vectorize index name、実行状態を記録する。D1はsource of truthなので、Vectorize upsertだけで更新完了と扱わない。
5. Vectorize upsert時のmetadataにも同じ `indexVersion` を入れる。app側のquery filterは `RAG_ACTIVE_INDEX_VERSION` と一致するmetadataだけを通常検索対象にする。
6. 新versionのD1 lookup、Vectorize query、provider retrieval eval、manual smokeを確認する。score thresholdやno-answer policyは旧versionの値をそのまま保証しない。
7. 新versionが通った後で `RAG_ACTIVE_INDEX_VERSION` を切り替える。切替前は旧active versionを維持し、途中失敗時に通常検索へ混在させない。
8. 旧vectorsは必要に応じてmaintenance cleanupする。cleanup完了までは物理的に残っていても、active `indexVersion` filterで通常検索から除外する。

## Provider Mode Policy

Initial provider modeは明示的なconfigurationとaccess keyの背後に置きます。

- Local/test fallbackはmock lexical retrievalです。
- Provider modeは必要bindingsが不足している場合fail closedします。
- Provider modeはnormal CIで有効化しません。
- Provider smoke checksはmanualかつ小さく保ちます。

Provider-mode retrievalは、`RAG_MIN_PROVIDER_VECTOR_SCORE` が未設定の場合 `MIN_PROVIDER_VECTOR_SCORE = 0.55` を使います。この値はこのportfolio demoのcurrent fixture index向けthreshold policyです。Vectorize一般のscore不変条件ではありません。corpus、chunking strategy、embedding model、index version、Vectorize metricが変わる場合は、thresholdとvalidation policyを再評価します。

Anthropic answer modeは、`RAG_ANTHROPIC_MAX_TOKENS` が未設定の場合 `DEFAULT_ANTHROPIC_MAX_TOKENS = 512` を使います。`RAG_ANTHROPIC_MAX_TOKENS` は64〜2048の整数だけを受け付けます。限定live deployでは `256` を明示設定します。このcapはportfolio demoのコストを抑えるためのsafety defaultであり、production answer-length policyではありません。Production useではroute/model単位でmax tokensとtruncation behaviorを別途検討します。

Anthropic live modeのsource validationはpost-generationです。streaming中に `answer_delta` を受け取り、stream完了後にcitation idを検証します。完全なbuffer-then-flush方式ではないため、「不正citation回答を表示前に完全遮断」とは主張しません。

IP-based rate limitは、`/api/search` と `/api/ask` のaccess key検証後に働くportfolio cost guardです。既定値は60 requests / 60 secondsで、`RAG_RATE_LIMIT_MAX_REQUESTS` と `RAG_RATE_LIMIT_WINDOW_SECONDS` でoverrideできます。`RAG_DISABLE_RATE_LIMIT=true` はtest/dev bypass用で、production deploymentでは設定しません。このrate limitはproduction user authentication、per-user quota、per-key request budget、WAF、bot protectionの代替ではありません。

## Open Items Before Live Provider Work

- limited live deployment smokeを作成する。
- provider-mode routeがraw provider errors、prompts、secrets、cookies、stack tracesを漏らさないことを確認する。
- manual live Claude smokeは、明示的なコスト承認、fresh access key、hard spend limit確認、secret setupの後だけ実行する。
