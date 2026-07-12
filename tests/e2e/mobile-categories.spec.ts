import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 375, height: 812 } })

test('スマホ幅でカテゴリを表示するとカテゴリ欄だけ横スクロールできる', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const categories = page.locator('.segmented')
  await categories.waitFor()

  const hasHorizontalOverflow = await categories.evaluate(
    (element) => element.scrollWidth > element.clientWidth
  )

  expect(hasHorizontalOverflow).toBe(true)
})
