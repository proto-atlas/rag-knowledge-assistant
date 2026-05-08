# Lighthouse Lab Evidence

## 日本語要約

このevidenceは、mock-only公開URLに対するLighthouse lab測定のpoint-in-timeログです。

- 確認したこと: public mock-only deploymentのPerformance / Accessibility / Best Practices / SEO
- 結果: Mobile Performance 99、Desktop Performance 100、Accessibilityはいずれも100
- 読み方: lab環境の単発測定であり、field Core Web Vitalsやlive provider動作の性能ではありません
- このログで主張しないこと: 実ユーザー環境の性能、authenticated dynamic route、Claude / Workers AI / Vectorizeのlatency

詳細なLighthouse項目名、CLI command、JSON report由来の数値は、証拠性と再現性を保つため原文のまま残しています。

Generated at: 2026-05-02T05:16:38.235Z
Check type: Lighthouse lab measurement
Result: pass with note

This evidence records Lighthouse lab results for the public mock-only deployment.

The Lighthouse reports were generated as JSON output. The local CLI process returned a post-run cleanup `EPERM` after writing the report files, so this evidence records the completed JSON report contents rather than treating the CLI exit code as a CI gate.

## Target

- URL: `https://rag-knowledge-assistant.atlas-lab.workers.dev`
- Lighthouse version: 13.2.0
- Browser: HeadlessChrome 147.0.0.0
- Categories: Performance, Accessibility, Best Practices, SEO

## Summary

| Mode | Performance | Accessibility | Best Practices | SEO |
|---|---:|---:|---:|---:|
| Mobile | 99 | 100 | 96 | 100 |
| Desktop | 100 | 100 | 96 | 100 |

## Core Lab Metrics

| Mode | FCP | LCP | TBT | CLS | Speed Index |
|---|---:|---:|---:|---:|---:|
| Mobile | 1.3 s | 1.3 s | 20 ms | 0 | 2.8 s |
| Desktop | 0.3 s | 0.3 s | 0 ms | 0 | 0.7 s |

## Method

Commands were run locally with the Playwright Chromium executable exposed through `CHROME_PATH`.

```bash
corepack pnpm dlx lighthouse@latest https://rag-knowledge-assistant.atlas-lab.workers.dev --output=json --only-categories=performance,accessibility,best-practices,seo --chrome-flags="--headless=new --no-sandbox"
corepack pnpm dlx lighthouse@latest https://rag-knowledge-assistant.atlas-lab.workers.dev --preset=desktop --output=json --only-categories=performance,accessibility,best-practices,seo --chrome-flags="--headless=new --no-sandbox"
```

## Not Claimed

- This is a Lighthouse lab result, not field Core Web Vitals.
- This does not measure authenticated dynamic search or answer generation.
- This does not measure live Claude, Workers AI, Vectorize, D1, or large-corpus RAG performance.
- This does not replace manual accessibility testing or screen reader testing.
