# Workers AI dimension確認記録

生成日時: 2026-04-30T22:29:44.7288435+09:00
確認環境: ローカル実行
確認種別: Workers AI embedding dimension手動確認
結果: 通過

この記録では、Workers AI embedding dimensionを1リクエストで確認した結果を残します。
以下の時点で、`@cf/baai/bge-m3` のembedding output shapeを確認しました。

raw embedding vector、Cloudflare token、account secret、cookie、ローカル専用メモは含めていません。

この記録に含めない範囲:

- Vectorize queryは実行していません。
- Vectorize upsertは実行していません。
- D1 migrationは実行していません。
- Claude API callは実行していません。
- Cloudflare deployは実行していません。

## このprobeの目的

この時点のlocal Wrangler helpでは、`vectorize create --preset` の選択肢に `@cf/baai/bge-m3` が表示されませんでした。
`@cf/baai/bge-m3` 向けのVectorize indexを作成する前に、制御したprobeでembedding dimensionを確認し、証跡として残す必要がありました。

## probe command

このコマンドは通常CIには含めません。
実API確認flagを付けない限り、実行を拒否します。

```bash
corepack pnpm run probe:workers-ai-dimension -- --confirm-live-workers-ai-probe
```

必要な環境変数:

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
```

scriptは短いtext値を1件だけ`@cf/baai/bge-m3`へ送り、以下だけを出力します。

- generated timestamp
- model id
- embedding dimension
- optional shape
- optional pooling

raw embedding vectorは出力しません。

## 記録した内容

```text
試行1: 2026-04-30
コマンド: corepack pnpm run probe:workers-ai-dimension -- --confirm-live-workers-ai-probe
結果: Workers AIに対しては未実行
理由: コマンド実行環境にCLOUDFLARE_ACCOUNT_IDとCLOUDFLARE_API_TOKENがありませんでした。
Live API call: no
埋め込みベクトル本文のコピー: no

試行2: 2026-04-30T13:10:05.625Z
コマンド: corepack pnpm run probe:workers-ai-dimension -- --confirm-live-workers-ai-probe
結果: 通過
model: @cf/baai/bge-m3
dimensions: 1024
shape: [1, 1024]
pooling: cls
埋め込みベクトル本文のコピー: no
```

## pass基準

- このsetup stepではprobeを1回だけ実行する。
- 出力に`model`が含まれる。
- 出力に有限の正の`dimensions`が含まれる。
- raw embedding vectorをevidenceへコピーしない。
- Cloudflare token、account secret、cookie、ローカル専用メモはこの記録へ転記していません。

## follow-up

dimension確認後の対応:

1. Cloudflare AI Search supported-model docsをもとに、`@cf/baai/bge-m3` のVectorize metricは`cosine`を使う方針にした。
2. `--dimensions`と`--metric`を明示して`rag-bge-m3-v1`を作成した。
3. Vectorize index infoを`docs/evidence/vectorize-index-setup-2026-04-30.md`へ記録した。
