# Architecture

RAG Knowledge Assistant は、未認証トップページとaccess key付き限定live RAG経路を分けたRAGポートフォリオです。

この文書は、README / REVIEWER / evidenceを読む前提として、主要な実行経路と責務分離を短くまとめます。

## 全体像

```
Browser UI
  ├─ /api/search
  │    ├─ mock lexical retrieval (local/test fallback)
  │    └─ provider retrieval (limited live default)
  │         ├─ Workers AI: query embedding
  │         ├─ Vectorize: nearest-neighbor search
  │         └─ D1: source chunk lookup
  │
  └─ /api/ask
       ├─ retrieval_start
       ├─ sources / no_answer
       ├─ generation_start
       ├─ answer_delta
       └─ done
            └─ mock answer provider (local/test fallback)
            └─ Anthropic answer provider (limited live default)
```

公開トップページは未認証で閲覧できますが、`/api/search` と `/api/ask` はaccess keyを要求します。限定live deployでは、`/api/search` はWorkers AI / Vectorize / D1を通り、`/api/ask` は検索根拠が十分な場合だけAnthropic providerへ進みます。必要なsecretやbindingsが欠けた場合はfail closedします。

## 主な責務

| 層 | 責務 | 限定live default |
|---|---|---|
| Browser UI | 質問入力、source cards、streaming状態、source validation failure表示 | 有効 |
| Worker routes | access key cost guard、request validation、SSE整形 | 有効 |
| Mock retrieval | local/test fallback | 無効 |
| Mock answer provider | local/test fallback | 無効 |
| Workers AI | query embedding生成 | access key付きで有効 |
| Vectorize | chunk vector検索 | access key付きで有効 |
| D1 | document / chunk本文のsource of truth | access key付きで有効 |
| Anthropic provider | answer generation streaming | access key付きで有効 |

## `/api/search`

`/api/search` は、質問と `topK` を受け取り、source cardとして表示できる検索結果を返します。

- local/test fallback: 架空fixtureをlexical scoringで検索する。
- limited live mode: Workers AIでquery embeddingを作り、Vectorize matchからchunk idを得て、D1でchunk本文を引き直す。
- no-answer: score thresholdを下回る場合は、回答生成へ進まずno-answer扱いにする。

Vectorize matchだけを表示本文のsource of truthにはしません。表示するchunk本文とmetadataはD1から引き直します。

## `/api/ask`

`/api/ask` は、project-owned RAG stream eventsをSSEで返します。

代表的なknown-answer flow:

```text
retrieval_start
sources
generation_start
answer_delta
done
```

代表的なno-answer flow:

```text
retrieval_start
no_answer
done
```

限定live deployではAnthropic answer providerを使います。`RAG_ANSWER_PROVIDER_MODE=anthropic`、`RAG_ENABLE_ANTHROPIC_LIVE=true`、`RAG_ANTHROPIC_API_KEY`、`RAG_CLAUDE_MODEL` のどれかが欠けた場合は、通常回答に進まずserver configuration errorとしてfail closedします。

## Source validation

Claude live modeのsource validationはpost-generationです。streaming中に `answer_delta` を受け取り、stream完了後にcitation idがretrieval結果内の許可済みsource idに含まれるかを検証します。

そのため、このリポジトリでは「不正citation回答を表示前に完全遮断」とは主張しません。source validation failureを検出し、通常回答として扱わないUI状態へ落とす境界として扱います。

## Index version

mock fixtureとprovider indexは意図的に分離しています。

| 用途 | index version |
|---|---|
| mock lexical fixture | `fixture-corpus-v1` |
| provider Vectorize index | `rag-bge-m3-v1` |

provider modeでは、active `indexVersion` に一致するchunkだけをsource cardへ変換します。古いchunkや別embedding条件のvectorが混ざることを避けるためです。

## Claim boundary

このarchitectureで示すのは、RAG UI、SSE event設計、access key付き限定live provider境界です。

この文書だけでは、production authentication、private document運用、大規模corpusでの一般化性能は主張しません。
