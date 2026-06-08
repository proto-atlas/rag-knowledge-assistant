import { expect, test, type Page } from '@playwright/test'
import { countSevereViolations, runAxeCheck } from './axe-helper'

test('初期画面をaxeで検査するとcriticalとserious違反がない', async ({ page }) => {
  await page.goto('/')

  const result = await runAxeCheck(page)

  expect(countSevereViolations(result.violations)).toBe(0)
})

test('回答と根拠カード表示後をaxeで検査するとcriticalとserious違反がない', async ({ page }) => {
  await mockAskResponse(page)

  await page.goto('/')
  await page.getByLabel('確認用キー').fill('test-access-key')
  await page.getByLabel('質問').fill('リモート勤務の申請期限は？')
  await page.getByRole('button', { name: '検索して回答生成' }).click()
  await expect(page.getByText('申請期限に関する根拠候補では')).toBeVisible()

  const result = await runAxeCheck(page)

  expect(countSevereViolations(result.violations)).toBe(0)
})

test('確認用キーエラー表示後をaxeで検査するとcriticalとserious違反がない', async ({ page }) => {
  await mockUnauthorizedSearchResponse(page)

  await page.goto('/')
  await page.getByLabel('確認用キー').fill('wrong-access-key')
  await page.getByLabel('質問').fill('リモート勤務の申請期限は？')
  await page.getByRole('button', { name: '根拠候補だけ検索' }).click()
  await expect(page.getByRole('alert')).toContainText('確認用キーが必要です。')

  const result = await runAxeCheck(page)

  expect(countSevereViolations(result.violations)).toBe(0)
})

test('引用ID検証失敗表示後をaxeで検査するとcriticalとserious違反がない', async ({ page }) => {
  await mockSourceValidationFailedResponse(page)

  await page.goto('/')
  await page.getByLabel('確認用キー').fill('test-access-key')
  await page.getByLabel('質問').fill('リモート勤務の申請期限は？')
  await page.getByRole('button', { name: '検索して回答生成' }).click()
  await expect(page.getByText('回答を表示できません。')).toBeVisible()

  const result = await runAxeCheck(page)

  expect(countSevereViolations(result.violations)).toBe(0)
})

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
