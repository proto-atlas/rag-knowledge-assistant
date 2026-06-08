# 検索評価記録

## 日本語要約

この記録は、固定の架空corpusに対するモック検索評価の特定時点ログです。

- 確認したこと: 20件の回答できるfixtureと5件の回答しないfixtureでモック検索scorerが期待chunkを返すか
- 結果: hit@5と回答しない判定の正解率は1.000、hit@1は0.900、MRRは0.950
- 読み方: 検索評価の枠組みと回答しない判定の確認であり、実プロバイダー品質の測定ではありません
- この記録に含めない範囲: Workers AI + Vectorize品質、Claude回答品質、本番RAG品質、held-out benchmark品質

詳細なmetric名、fixture table、failed case tableは、証拠性と再現性を保つため英語表記のまま残しています。

生成日時: 2026-04-30T10:03:24.505Z
確認種別: モック検索評価
方法: 固定の架空corpusに対して `runRetrievalEval()` を実行
外部呼び出し: なし

**これは固定fixtureに対するモック検索評価です。Workers AI + Vectorizeの検索品質、Claudeの回答品質、本番RAG品質を評価するものではありません。**

## 対象

この記録では、Workers AIやVectorizeへ接続する前にlocal retrieval fixture setを確認した結果を残します。
後続のVectorize indexが同じ品質であることを示すものではありません。

## fixture要約

| Type | Count |
|---|---:|
| Answerable questions | 20 |
| No-answer questions | 5 |
| Total | 25 |

## 受け入れ基準

| Metric | Target | Actual |
|---|---:|---:|
| hit@5 | >= 0.800 | 1.000 |
| 回答しない判定の正解率 | >= 0.800 | 1.000 |
| failed cases | 0 | 0 |

MRRは診断用指標として記録しています。この小さなfixture setの必須判定条件ではありません。

## 結果

| Metric | Value |
|---|---:|
| hit@1 | 0.900 |
| hit@3 | 1.000 |
| hit@5 | 1.000 |
| MRR | 0.950 |
| 回答しない判定の正解率 | 1.000 |

## 失敗ケース

| ID | Reason | Expected chunks | Actual chunks | Question |
|---|---|---|---|---|
| - | - | - | - | - |


## 補足

- corpusは架空文書だけを使っています。
- この実行ではClaude、Workers AI、Vectorize、D1、Cloudflareを呼び出していません。
- モックscorerは固定データ確認用であり、最終的な検索実装ではありません。
- 実際のVectorize評価は、index作成後に別の記録として残します。
- 25件の架空fixtureは、このプロジェクト内で検索処理と並行して作成したものです。外部hold-out benchmarkではありません。満点に近いscoreは、固定fixtureと確認用scorerの相性を反映しており、一般化性能を示すものではありません。
