# bundle size確認記録

## 日本語要約

この記録は、local production build outputのbundle sizeを記録した特定時点ログです。

- 確認したこと: Vite build後のHTML / CSS / JavaScript asset size
- 結果: total gzip 69.02 kB、total brotli 59.10 kB
- 読み方: build artifact sizeの記録であり、Core Web Vitalsやruntime性能の証明ではありません
- この記録に含めない範囲: 実利用時の表示性能、Cloudflare edgeの遅延、大規模コーパス / 実プロバイダー設定下の性能

詳細なasset名、gzip / brotli表記、byte数は、証拠性と再現性を保つため原文のまま残しています。

生成日時: 2026-05-02T12:34:33.237Z
確認種別: bundle size確認
結果: 通過

この記録では、local production buildの出力サイズを残す。これは特定時点のbundle size計測であり、Core Web Vitalsやruntime performanceの主張ではない。

## 対象

- コマンド対象: `dist/client` のlocal production build output
- Viteが出力したHTML、CSS、JavaScript assetを含む。
- Lighthouseは実行していない。
- 実ユーザー環境のCore Web Vitalsは測定していない。
- Cloudflare edge latencyは測定していない。

## 集計

| Total raw | Total gzip | Total brotli |
|---:|---:|---:|
| 220.33 kB | 69.02 kB | 59.10 kB |

## Assets

| Asset | Raw | Gzip | Brotli |
|---|---:|---:|---:|
| `assets/index-CkeV0tFL.js` | 212.23 kB | 66.42 kB | 57.03 kB |
| `assets/index-CmTgy1kT.css` | 6.30 kB | 1.77 kB | 1.47 kB |
| `index.html` | 1.79 kB | 854 B | 605 B |

## この記録に含めない範囲

- Lighthouse Performance scoreは主張しません。
- INP、LCP、CLS、field Core Web Vitalsは主張しません。
- 大規模corpusや実プロバイダーmodeでの性能を証明するものではありません。
