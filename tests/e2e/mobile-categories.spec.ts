import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 375, height: 812 } })

test('スマホ幅でカテゴリを横スクロールできる', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const categories = page.locator('.segmented')
  await categories.waitFor()

  const scrollLeft = await categories.evaluate((element) => {
    element.scrollLeft = 100
    return element.scrollLeft
  })

  expect(scrollLeft).toBeGreaterThan(0)
})

test('スマホ幅ではページ全体が横にはみ出さない', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.locator('.segmented').waitFor()

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  )

  expect(hasHorizontalOverflow).toBe(false)
})

test('スマホ幅で末尾のカテゴリを選択できる', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const lastCategory = page.locator('.segmented button').last()

  await lastCategory.scrollIntoViewIfNeeded()
  await lastCategory.click()

  await expect(lastCategory).toHaveClass(/segmented__button--active/)
})
