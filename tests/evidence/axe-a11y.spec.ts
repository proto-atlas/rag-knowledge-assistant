import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { countSevereViolations, runAxeCheck, type AxeViolationSummary } from '../e2e/axe-helper'

type AxeScenarioResult = {
  name: string
  url: string
  testEngine: string
  timestamp: string
  violations: AxeViolationSummary[]
  severeViolationCount: number
  passCount: number
  incompleteCount: number
  inapplicableCount: number
}

const evidenceDirectory = join(process.cwd(), 'docs', 'evidence')
const generatedAt = new Date().toISOString()
const date = generatedAt.slice(0, 10)

test('axe-core evidenceを保存する', async ({ page }) => {
  const scenarios: AxeScenarioResult[] = []

  await page.goto('/')
  scenarios.push(await runScenario('initial public UI state', page))

  await mockAskResponse(page)
  await page.getByLabel('確認用キー').fill('test-access-key')
  await page.getByLabel('質問').fill('リモート勤務の申請期限は？')
  await page.getByRole('button', { name: '検索して回答生成' }).click()
  await expect(page.getByText('申請期限に関する根拠候補では')).toBeVisible()
  scenarios.push(await runScenario('モック回答と根拠カード表示', page))

  await page.unroute('**/api/ask')
  await mockUnauthorizedSearchResponse(page)
  await page.goto('/')
  await page.getByLabel('確認用キー').fill('wrong-access-key')
  await page.getByLabel('質問').fill('リモート勤務の申請期限は？')
  await page.getByRole('button', { name: '根拠候補だけ検索' }).click()
  await expect(page.getByRole('alert')).toContainText('確認用キーが必要です。')
  scenarios.push(await runScenario('確認用キーエラー表示', page))

  await page.unroute('**/api/search')
  await mockSourceValidationFailedResponse(page)
  await page.goto('/')
  await page.getByLabel('確認用キー').fill('test-access-key')
  await page.getByLabel('質問').fill('リモート勤務の申請期限は？')
  await page.getByRole('button', { name: '検索して回答生成' }).click()
  await expect(page.getByText('回答を表示できません。')).toBeVisible()
  scenarios.push(await runScenario('source-validation-failed state', page))

  const payload = {
    generatedAt,
    checkType: 'axe-core-local-ui',
    result: 'pass',
    severeViolationCount: scenarios.reduce((sum, scenario) => {
      return sum + scenario.severeViolationCount
    }, 0),
    scenarios
  }

  await mkdir(evidenceDirectory, { recursive: true })
  await writeFile(
    join(evidenceDirectory, `axe-a11y-${date}.json`),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  )
  await writeFile(
    join(evidenceDirectory, `axe-a11y-${date}.md`),
    formatMarkdown(payload),
    'utf8'
  )

  expect(payload.severeViolationCount).toBe(0)
})

async function runScenario(name: string, page: Page): Promise<AxeScenarioResult> {
  const result = await runAxeCheck(page)

  return {
    name,
    url: result.url,
    testEngine: `${result.testEngine.name} ${result.testEngine.version}`,
    timestamp: result.timestamp,
    violations: result.violations,
    severeViolationCount: countSevereViolations(result.violations),
    passCount: result.passes.length,
    incompleteCount: result.incomplete.length,
    inapplicableCount: result.inapplicable.length
  }
}

async function mockAskResponse(page: Page) {
  await page.route('**/api/ask', async (route) => {
    await route.fulfill({
      contentType: 'text/event-stream',
      body: [
        createSseEvent('sources', {
          type: 'sources',
          response: createSearchPayload()
        }),
        createSseEvent('generation_start', {
          type: 'generation_start'
        }),
        createSseEvent('answer_delta', {
          type: 'answer_delta',
          text: '申請期限に関する根拠候補では、リモート勤務は前営業日の十八時までに申請します。 [1]'
        }),
        createSseEvent('done', {
          type: 'done'
        })
      ].join('')
    })
  })
}

async function mockUnauthorizedSearchResponse(page: Page) {
  await page.route('**/api/search', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          code: 'unauthorized',
          message: '確認用キーが必要です。'
        }
      })
    })
  })
}

async function mockSourceValidationFailedResponse(page: Page) {
  await page.route('**/api/ask', async (route) => {
    await route.fulfill({
      contentType: 'text/event-stream',
      body: [
        createSseEvent('sources', {
          type: 'sources',
          response: createSearchPayload()
        }),
        createSseEvent('source_validation_failed', {
          type: 'source_validation_failed',
          message: '回答の根拠を確認できなかったため表示できません。',
          invalidSourceIds: ['99']
        }),
        createSseEvent('done', {
          type: 'done'
        })
      ].join('')
    })
  })
}

function createSseEvent(event: string, payload: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`
}

function createSearchPayload() {
  return {
    query: 'リモート勤務の申請期限は？',
    topK: 5,
    indexVersion: 'fixture-corpus-v1',
    noAnswerRecommended: false,
    results: [
      {
        sourceId: '1',
        chunkId: 'remote-work-policy-001',
        documentSlug: 'remote-work-policy',
        documentTitle: 'リモート勤務規程',
        headingPath: ['申請期限'],
        excerpt: 'リモート勤務は前営業日の十八時までに申請します。',
        category: 'policy',
        tags: ['policy', 'remote'],
        score: 6
      }
    ]
  }
}

function formatMarkdown(payload: {
  generatedAt: string
  checkType: string
  result: string
  severeViolationCount: number
  scenarios: AxeScenarioResult[]
}) {
  const scenarioRows = payload.scenarios.map((scenario) => {
    return `| ${scenario.name} | ${scenario.testEngine} | ${scenario.severeViolationCount} | ${scenario.violations.length} | ${scenario.passCount} | ${scenario.incompleteCount} |`
  })

  const violationBlocks = payload.scenarios.map((scenario) => {
    if (scenario.violations.length === 0) {
      return `### ${scenario.name}\n\naxe違反は検出されませんでした。`
    }

    const rows = scenario.violations.map((violation) => {
      return `- ${violation.id} (${violation.impact ?? 'unknown'}): ${violation.help} — ${violation.nodeTargets.join(', ')}`
    })

    return `### ${scenario.name}\n\n${rows.join('\n')}`
  })

  return `# axe-core accessibility記録

生成日時: ${payload.generatedAt}
確認種別: ${payload.checkType}
結果: ${payload.result}

この記録では、Playwrightでlocal mock response UI stateに対して実行したaxe-core確認を残す。これは1回分の自動アクセシビリティ確認であり、WCAG全体の監査ではない。

## 集計

| Scenario | axe engine | Critical/serious violations | All violations | Passes | Incomplete |
|---|---|---:|---:|---:|---:|
${scenarioRows.join('\n')}

## violations

${violationBlocks.join('\n\n')}

## 対象

- 初期公開UI状態。
- モック回答と根拠カード表示。
- 確認用キーエラー表示。
- 根拠検証失敗状態。
- 対象ルール: WCAG 2 A、WCAG 2 AA、axe best-practice rules。
- criticalまたはseriousの違反が1件でもあれば失敗として扱う。

## この記録に含めない範囲

- 完全なWCAG 2.1 AA auditではない。
- manual screen-reader testingではない。
- authenticated provider-modeのWorkers AI、Vectorize、D1、Claude behaviorは計測しない。
- keyboard-only manual QAの置き換えではない。
`
}
