import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'

const screenshotDirectory = join(process.cwd(), 'docs', 'evidence', 'screenshots')

test('UI screenshot evidenceを保存する', async ({ page }) => {
  await mkdir(screenshotDirectory, { recursive: true })
  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Retrieval eval summary' })).toBeVisible()
  await page.screenshot({
    fullPage: true,
    path: join(screenshotDirectory, 'ui-top-2026-04-30.png')
  })

  await mockSearchResponse(page)
  await mockAskResponse(page)
  await page.getByLabel('確認用キー').fill('test-access-key')
  await page.getByLabel('質問').fill('リモート勤務の申請期限は？')
  await page.getByRole('button', { name: '検索する' }).click()
  await page.getByRole('button', { name: 'サーバーSSE回答を生成' }).click()

  await expect(page.getByText('申請期限に関する根拠候補では')).toBeVisible()
  await page.screenshot({
    fullPage: true,
    path: join(screenshotDirectory, 'ui-search-answer-2026-04-30.png')
  })

  await page.getByRole('button', { name: '[1]' }).click()
  await expect(page.getByText('Source 1', { exact: true })).toBeVisible()
  await page.screenshot({
    fullPage: true,
    path: join(screenshotDirectory, 'ui-citation-focus-2026-04-30.png')
  })
})

async function mockSearchResponse(page: Page) {
  await page.route('**/api/search', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
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
      })
    })
  })
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
