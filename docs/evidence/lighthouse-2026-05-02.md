# Lighthouse lab測定記録

## 日本語要約

この記録は、モック応答だけ公開URLに対するLighthouse lab測定の特定時点ログです。

- 確認したこと: public mock-response deploymentのPerformance / Accessibility / Best Practices / SEO
- 結果: Mobile Performance 99、Desktop Performance 100、Accessibilityはいずれも100
- 読み方: lab環境の単発測定であり、field Core Web Vitalsや実プロバイダー動作の性能ではありません
- この記録に含めない範囲: 実ユーザー環境の性能、authenticated dynamic route、Claude / Workers AI / Vectorizeのlatency

詳細なLighthouse項目名、CLI command、JSON report由来の数値は、証拠性と再現性を保つため原文のまま残しています。

生成日時: 2026-05-02T05:16:38.235Z
確認種別: Lighthouse lab測定
結果: 通過（補足あり）

この記録では、モック応答デプロイに対するLighthouse lab結果を残す。

LighthouseのreportはJSONとして生成しました。ローカルCLIはreportを書き出した後のcleanupで`EPERM`を返したため、この記録ではCLIのexit codeをCI判定として扱わず、生成済みJSON reportの内容を記録しています。

## 対象

- URL: `https://rag-knowledge-assistant.atlas-lab.workers.dev`
- Lighthouse version: 13.2.0
- 使用browser: HeadlessChrome 147.0.0.0
- 測定categories: Performance, Accessibility, Best Practices, SEO

## 集計

| Mode | Performance | Accessibility | Best Practices | SEO |
|---|---:|---:|---:|---:|
| Mobile | 99 | 100 | 96 | 100 |
| Desktop | 100 | 100 | 96 | 100 |

## core lab metrics

| Mode | FCP | LCP | TBT | CLS | Speed Index |
|---|---:|---:|---:|---:|---:|
| Mobile | 1.3 s | 1.3 s | 20 ms | 0 | 2.8 s |
| Desktop | 0.3 s | 0.3 s | 0 ms | 0 | 0.7 s |

## 方法

Playwright Chromium executableを`CHROME_PATH`で指定し、ローカルでコマンドを実行しました。

```bash
corepack pnpm dlx lighthouse@latest https://rag-knowledge-assistant.atlas-lab.workers.dev --output=json --only-categories=performance,accessibility,best-practices,seo --chrome-flags="--headless=new --no-sandbox"
corepack pnpm dlx lighthouse@latest https://rag-knowledge-assistant.atlas-lab.workers.dev --preset=desktop --output=json --only-categories=performance,accessibility,best-practices,seo --chrome-flags="--headless=new --no-sandbox"
```

## この記録に含めない範囲

- これはLighthouseのlab結果であり、field Core Web Vitalsではありません。
- 認証付きの動的検索や回答生成は測定していません。
- Claude実API、Workers AI、Vectorize、D1、大規模corpusのRAG性能は測定していません。
- 手動アクセシビリティ確認やscreen reader確認を置き換えるものではありません。
