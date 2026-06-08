# ADR 0001: Index Version Policy

状態: 採用
日付: 2026-05-02

## 日本語要約

モック検索と実プロバイダー検索は、同じ「検索」として見えてもindexの意味が違います。このADRでは、モックfixture用の `fixture-corpus-v1` と、Workers AI + Vectorize用の `rag-bge-m3-v1` を意図的に分け、実プロバイダー検索では有効なindex versionでfilterする方針を記録します。

## 背景

このプロジェクトには2つの検索経路があります。

- 公開URLで使う固定データ検索
- Workers AI、Vectorize、D1 の準備確認で使う実プロバイダー検索

実プロバイダー検索は、embedding model、vector dimensions、metric、chunking strategy、fixture corpusの変更で意味が変わります。互換性のないvectorを混ぜると、検索scoreや引用元の対応を説明しにくくなります。

## 決定

index versionを明示し、実プロバイダー検索ではactive index versionでfilterします。

現在のversion:

- `fixture-corpus-v1`: 固定データ検索用のfixture corpus
- `rag-bge-m3-v1`: `@cf/baai/bge-m3` 用のVectorize index

固定データ検索と実プロバイダー検索のindex versionは意図的に分けます。互換性のない実プロバイダー設定を追加する場合は、既存versionの意味を変えず、新しいindex versionを作ります。

## 影響

利点:

- 古いvectorが物理的に残っていても、通常の実プロバイダー検索には返さない。
- 検証記録で、測定したindex versionを明示できる。
- active trafficを切り替える前にreindex作業を段階的に進められる。

トレードオフ:

- 使わなくなったvectorの整理は別途必要になる。
- 検証記録では、固定データcorpusを測ったのか実プロバイダーindexを測ったのかを明示する必要がある。
