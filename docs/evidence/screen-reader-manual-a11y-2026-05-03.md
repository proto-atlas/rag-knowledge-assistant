# Screen Reader Manual Accessibility Smoke Evidence

## 日本語要約

このevidenceは、公開URLの主要導線をWindows Narrator + Chromeで手動確認したpoint-in-timeログです。

- 確認したこと: top、access key入力、質問フォーム、streaming/status、citation、source focus、errorの7状態
- 結果: project ownerによるWindows Narrator manual smokeでは、7状態すべてOK、気になった点なし
- 読み方: axe-core自動検査とは別に、主要導線がスクリーンリーダーで追えるかを手動で確認した補助evidenceです
- このログで主張しないこと: 完全なWCAG監査、NVDA / VoiceOver / JAWSを含むvendor matrix、全ブラウザ・全UI状態の網羅

補助確認として、公開URLに対するPlaywrightチェックで、ラベル、主要ボタン、mock SSE表示、citation button、source focus、error alertのDOM導線も確認しています。API routeはmockし、実access key値やlive providerは使っていません。

Generated at: 2026-05-03T15:45:10+09:00
Manual check time: 2026-05-03T15:40:00+09:00
Check type: manual-screen-reader-smoke
Result: pass with limitations

## Manual Environment

| Field | Value |
|---|---|
| OS | Windows 11 |
| Browser | Chrome |
| Screen reader | Windows Narrator |
| URL | public URL |
| Scope | public mock-only UI |

## Manual Check Results

| State | Result | Notes |
|---|---|---|
| top | OK | 気になった点なし |
| access key | OK | 気になった点なし |
| question form | OK | 気になった点なし |
| streaming/status | OK | 気になった点なし |
| citation | OK | 気になった点なし |
| source focus | OK | 気になった点なし |
| error | OK | 気になった点なし |

## Supplemental Playwright Check

The supplemental check used a headless Chromium session against the public URL. It mocked `/api/ask` and `/api/search` responses locally in the browser session and did not transmit a real access key.

| Check | Result | Detail |
|---|---|---|
| title | pass | `RAG Knowledge Assistant — 架空文書RAGデモ` |
| access key label | pass | one labeled input found |
| question label | pass | one labeled input found |
| search button | pass | `根拠候補だけ検索` found |
| ask button | pass | `検索して回答生成` found |
| mock streaming answer visible | pass | mocked SSE answer rendered |
| citation button `[1]` | pass | citation rendered as a button |
| source focus after citation | pass | activating `[1]` moved focus to the source card content |
| error alert visible | pass | `access keyが必要です。` rendered in an alert |

## Relationship To Existing Evidence

- `a11y-review-2026-05-02.md` records source-level accessibility implementation review.
- `axe-a11y-2026-05-02.md` records automated axe-core checks for four local mock-only UI states.
- This file adds a manual Windows Narrator smoke check for the main public UI path.

## Not Claimed

- This is not a complete WCAG 2.1 AA or WCAG 2.2 AA audit.
- This is not a screen-reader vendor matrix.
- This does not claim NVDA, VoiceOver, JAWS, TalkBack, or browser matrix coverage.
- This does not claim every future UI state is accessible.
- This does not call live Claude, Workers AI, Vectorize, D1, or provider-mode routes.
- This does not transmit a real access key in the supplemental Playwright check.
