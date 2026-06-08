# ADR 0004: 外部ベンチマークsubsetの扱い

状態: 採用
日付: 2026-05-03

## 日本語要約

25件fixtureのprovider evalは、retrieval scaffoldとfixtureを同じプロジェクト内で作っているため、一般化性能の根拠にはしません。このADRでは、外部データセット由来のquery/gold document idを使った小規模subset評価を別evidenceとして追加し、既存fixture evalと混同しない方針を記録します。

## 背景

既存の実プロバイダー検索評価は、意図的に25件の架空fixtureを使っています。この固定評価corpusに対してWorkers AI、Vectorize、D1 の検索経路を確認する用途では有効ですが、外部hold-out benchmarkではありません。

外部データセットの一部を使った基準値を別に置くことで、手書きfixture以外で検索処理がどう動くかを示します。ただし、本番RAG品質の根拠としては扱いません。

候補確認:

- 第一候補: `castorini/mr-tydi` のJapanese dev splitと `castorini/mr-tydi-corpus`。
- License: query datasetとcorpus datasetのHugging Face dataset pageでApache-2.0を確認。
- JaCWIRは、この確認経路でlicenseを確認できなかったため、この段階では採用しない。

## 決定

Mr. TyDi Japanese dev rowsを使った外部benchmark subsetの検証記録を、既存fixture評価とは別に追加します。

この検証記録は、candidate subsetに対するローカル語彙検索の基準値です。

- queryとgold document idはMr. TyDi Japanese dev split由来。
- candidate documentはgold documentに、sampled non-gold corpus documentを加えて作る。
- scriptはinput hashとraw result JSONを記録する。
- scoreは公式のMr. TyDi full-corpus benchmark scoreではありません。
- scoreはWorkers AI、Vectorize、D1、Claude、実プロバイダー経路の `/api/search` を評価するものではありません。

既定のtarget sizeは50 queriesです。評価範囲を小さく保ち、大規模ベンチマークや本番品質評価のように見せないためです。

## 影響

利点:

- 25件fixtureの `1.000` metricsだけが検索評価として見える状態を避けられる。
- 外部subsetの低いscoreも、失敗分類とあわせて公開できる。
- 外部評価とfixture評価を、名前と読み方の両方で分けられる。

トレードオフ:

- 公式full corpusを使った完全なhold-out benchmarkの代替にはならない。
- 語彙rankingは基準値であり、実プロバイダーのvector retrieval経路ではない。
- corpus fileが大きいため、再生成は遅くなる可能性がある。script cacheは `.tmp` 配下を使う。

## 再測定する条件

以下が変わった場合は、この検証記録を再実行または置き換えます。

- benchmark dataset version、license、source URL
- query limitまたはcandidate-document construction
- ranking/scoring function
- normalizationまたはtokenization logic
- 実プロバイダー評価の範囲が変わり、この基準値との比較が有効でなくなった場合
