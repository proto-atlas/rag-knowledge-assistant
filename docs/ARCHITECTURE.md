# アーキテクチャ

RAG Knowledge Assistantは、未認証トップページと確認用キー付き実API RAG経路を分けたRAG確認画面です。

この文書は、README / 確認ガイド / 検証記録を読む前提として、主要な実行経路と責務分離を短くまとめます。

## 全体像

```
ブラウザUI
  ├─ /api/search
│    ├─ モック字句検索 (local/testの代替処理)
  │    └─ 実プロバイダー検索 (限定的な実API既定)
  │         ├─ Workers AI: 質問の埋め込み
  │         ├─ Vectorize: 近傍検索
  │         └─ D1: 根拠chunkの読み直し
  │
  └─ /api/ask
       ├─ retrieval_start
       ├─ sources / no_answer
       ├─ generation_start
       ├─ answer_delta
       └─ done
            └─ モック回答プロバイダー (local/testの代替処理)
            └─ Anthropic回答プロバイダー (限定的な実API既定)
```

公開トップページは未認証で閲覧できますが、`/api/search` と `/api/ask` は確認用キーを要求します。実API確認用のデプロイでは、`/api/search` はWorkers AI / Vectorize / D1を通り、`/api/ask` は検索根拠が十分な場合だけAnthropicプロバイダーへ進みます。必要なsecretやbindingsが欠けた場合は失敗として扱います。

## 主な責務

| 層 | 責務 | 実API確認時の既定 |
|---|---|---|
| ブラウザUI | 質問入力、根拠カード、ストリーミング状態、引用ID検証失敗表示 | 有効 |
| Worker経路 | 確認用キーによる利用制限、リクエスト検証、SSE整形 | 有効 |
| モック検索 | local/testの代替処理 | 無効 |
| モック回答プロバイダー | local/testの代替処理 | 無効 |
| Workers AI | 質問の埋め込み生成 | 確認用キー付きで有効 |
| Vectorize | chunkベクトル検索 | 確認用キー付きで有効 |
| D1 | 文書 / chunk本文の正本 | 確認用キー付きで有効 |
| Anthropicプロバイダー | 回答生成ストリーミング | 確認用キー付きで有効 |

## `/api/search`

`/api/search` は、質問と `topK` を受け取り、根拠カードとして表示できる検索結果を返します。

- local/testの代替処理: 架空fixtureを字句スコアで検索する。
- 確認用の実APIモード: Workers AIで質問の埋め込みを作り、Vectorizeの検索結果からchunk IDを得て、D1でchunk本文を引き直す。
- 回答しない判定: スコアしきい値を下回る場合は、回答生成へ進まず回答しない状態として扱う。

Vectorizeの検索結果だけを表示本文の正本にはしません。表示するchunk本文とmetadataはD1から引き直します。

## `/api/ask`

`/api/ask` は、このプロジェクトで定義したRAGストリームイベントをSSEで返します。

代表的な回答できる質問の流れ:

```text
retrieval_start
sources
generation_start
answer_delta
done
```

代表的な回答しない流れ:

```text
retrieval_start
no_answer
done
```

実API確認用のデプロイではAnthropic回答プロバイダーを使います。`RAG_ANSWER_PROVIDER_MODE=anthropic`、`RAG_ENABLE_ANTHROPIC_LIVE=true`、`RAG_ANTHROPIC_API_KEY`、`RAG_CLAUDE_MODEL` のどれかが欠けた場合は、通常回答に進まず、サーバー設定エラーとして失敗させます。

## 引用ID検証

Claude実APIモードでは、引用元ID検証を回答生成後に行います。ストリーミング中に `answer_delta` を受け取り、ストリーム完了後に引用IDが検索結果内の許可済み根拠IDに含まれるかを検証します。

そのため、このリポジトリでは「不正な引用回答を表示前に完全遮断」とは主張しません。引用ID検証失敗を検出し、通常回答として扱わないUI状態へ落とす境界として扱います。

## 索引バージョン

モックfixtureと実プロバイダー索引は意図的に分離しています。

| 用途 | 索引バージョン |
|---|---|
| モック字句検索fixture | `fixture-corpus-v1` |
| 実プロバイダーVectorize索引 | `rag-bge-m3-v1` |

実プロバイダー設定では、有効な `indexVersion` に一致するchunkだけを根拠カードへ変換します。古いchunkや別の埋め込み条件のベクトルが混ざることを避けるためです。

Vectorizeを新しい埋め込みモデルやchunk分割条件へ更新する場合は、旧バージョンを直接上書きしません。新しい `indexVersion` を作り、全chunkを同じ条件で再埋め込みしてから、D1のchunk metadata / 索引実行記録とVectorize metadataを同じバージョンで揃えます。`RAG_ACTIVE_INDEX_VERSION` は、新バージョンのupsert、D1 lookup、実プロバイダー検索評価、手動確認が通った後に切り替える前提です。

## 扱う範囲

この文書では、RAG UI、SSE event設計、確認用キーで利用を制限した実プロバイダー接続の境界を示します。

この文書だけでは、本番認証、機密文書の運用、大規模コーパスでの一般化性能までは扱いません。
