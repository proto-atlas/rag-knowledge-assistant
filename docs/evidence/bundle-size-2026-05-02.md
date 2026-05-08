# Bundle Size Evidence

## 日本語要約

このevidenceは、local production build outputのbundle sizeを記録したpoint-in-timeログです。

- 確認したこと: Vite build後のHTML / CSS / JavaScript asset size
- 結果: total gzip 69.02 kB、total brotli 59.10 kB
- 読み方: build artifact sizeの記録であり、Core Web Vitalsやruntime性能の証明ではありません
- このログで主張しないこと: field performance、Cloudflare edge latency、large corpus / live provider mode下の性能

詳細なasset名、gzip / brotli表記、byte数は、証拠性と再現性を保つため原文のまま残しています。

Generated at: 2026-05-02T12:34:33.237Z
Check type: bundle-size
Result: pass

This evidence records the local production build output size. It is a point-in-time bundle measurement, not a Core Web Vitals or runtime performance claim.

## Scope

- Command path: local production build output in `dist/client`
- Includes HTML, CSS, and JavaScript assets emitted by Vite
- Does not run Lighthouse
- Does not measure real-user Core Web Vitals
- Does not measure Cloudflare edge latency

## Summary

| Total raw | Total gzip | Total brotli |
|---:|---:|---:|
| 220.33 kB | 69.02 kB | 59.10 kB |

## Assets

| Asset | Raw | Gzip | Brotli |
|---|---:|---:|---:|
| `assets/index-CkeV0tFL.js` | 212.23 kB | 66.42 kB | 57.03 kB |
| `assets/index-CmTgy1kT.css` | 6.30 kB | 1.77 kB | 1.47 kB |
| `index.html` | 1.79 kB | 854 B | 605 B |

## Not Claimed

- This does not claim Lighthouse Performance score.
- This does not claim INP, LCP, CLS, or field Core Web Vitals.
- This does not prove performance under large corpora or live provider mode.
