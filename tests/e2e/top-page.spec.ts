import { expect, test, type Page } from '@playwright/test'

test('トップページを開くとRAGデモの概要と検索フォームが見える', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: '架空文書を検索し、根拠付き回答を生成するRAGデモ' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '架空文書', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Retrieval eval summary' })).toBeVisible()
  await expect(page.getByText('mock lexical retrieval only')).toBeVisible()
  await expect(page.getByText('hit@5')).toBeVisible()
  await expect(page.getByText('1.000').first()).toBeVisible()
  await expect(page.getByRole('button', { name: '根拠候補だけ検索' })).toBeDisabled()
  await expect(page.getByRole('button', { name: '検索して回答生成' })).toBeDisabled()
})

test('access keyと質問を入力するとmock検索結果を表示する', async ({ page }) => {
  await mockSearchResponse(page)

  await page.goto('/')
  await page.getByLabel('Access key').fill('test-access-key')
  await page.getByLabel('質問').fill('リモート勤務の申請期限は？')
  await page.getByRole('button', { name: '根拠候補だけ検索' }).click()

  await expect(page.getByRole('heading', { name: '検索結果' })).toBeVisible()
  await expect(page.getByText('Source 1')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'リモート勤務規程' })).toBeVisible()
  await expect(page.getByText('前営業日の十八時まで')).toBeVisible()

  const storageText = await page.evaluate(() => {
    return [
      ...Object.values(window.localStorage),
      ...Object.values(window.sessionStorage)
    ].join('\n')
  })

  expect(storageText).not.toContain('test-access-key')
})

test('検索結果からserver streaming answerを生成できる', async ({ page }) => {
  await mockAskResponse(page, 'valid')

  await page.goto('/')
  await page.getByLabel('Access key').fill('test-access-key')
  await page.getByLabel('質問').fill('リモート勤務の申請期限は？')
  await page.getByRole('button', { name: '検索して回答生成' }).click()

  await expect(page.getByRole('heading', { name: 'Server streaming answer' })).toBeVisible()
  await expect(page.getByText('申請期限に関する根拠候補では')).toBeVisible()
  await expect(page.getByText('[1]')).toBeVisible()
})

test('回答内のcitationを押すと対応するsource cardへフォーカス移動する', async ({ page }) => {
  await mockAskResponse(page, 'valid')

  await page.goto('/')
  await page.getByLabel('Access key').fill('test-access-key')
  await page.getByLabel('質問').fill('リモート勤務の申請期限は？')
  await page.getByRole('button', { name: '検索して回答生成' }).click()
  await page.getByRole('button', { name: '[1]' }).click()

  const focusedSourceText = await page.evaluate(() => {
    return document.activeElement?.textContent ?? ''
  })

  expect(focusedSourceText).toContain('Source 1')
  expect(focusedSourceText).toContain('リモート勤務規程')
})

test('source id検証に失敗した回答は通常回答として表示しない', async ({ page }) => {
  await mockAskResponse(page, 'source-validation-failed')

  await page.goto('/')
  await page.getByLabel('Access key').fill('test-access-key')
  await page.getByLabel('質問').fill('リモート勤務の申請期限は？')
  await page.getByRole('button', { name: '検索して回答生成' }).click()

  await expect(page.getByText('回答を表示できません。')).toBeVisible()
  await expect(page.getByText('invalid source ids: 99')).toBeVisible()
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

async function mockAskResponse(page: Page, mode: 'valid' | 'source-validation-failed') {
  await page.route('**/api/ask', async (route) => {
    const events = mode === 'valid'
      ? [
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
        ]
      : [
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
        ]

    await route.fulfill({
      contentType: 'text/event-stream',
      body: events.join('')
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
