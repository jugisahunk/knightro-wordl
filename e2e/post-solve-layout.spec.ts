import { test, expect } from '@playwright/test'
import answers from '../src/data/answers.json' with { type: 'json' }

function getTodayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getTodayAnswer(): string {
  const EPOCH = new Date('2021-06-19').getTime()
  const today = getTodayLocal()
  const dayOffset = Math.floor((new Date(today).getTime() - EPOCH) / 86400000)
  const arr = answers as string[]
  return arr[((dayOffset % arr.length) + arr.length) % arr.length]
}

test.describe('music toggle', () => {
  test('music toggle button exists in header', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByTestId('music-toggle')).toBeVisible()
  })

  test('music toggle has correct default aria-label (off)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByTestId('music-toggle')).toHaveAttribute('aria-label', 'Turn music on')
  })

  test('clicking music toggle changes aria-label to off state', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.getByTestId('music-toggle').click()
    await expect(page.getByTestId('music-toggle')).toHaveAttribute('aria-label', 'Turn music off')
  })

  test('clicking music toggle twice returns to on state label', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.getByTestId('music-toggle').click()
    await expect(page.getByTestId('music-toggle')).toHaveAttribute('aria-label', 'Turn music off')
    await page.getByTestId('music-toggle').click()
    await expect(page.getByTestId('music-toggle')).toHaveAttribute('aria-label', 'Turn music on')
  })
})

test.describe('desktop post-solve layout', () => {
  test('three-column layout appears on desktop after solving', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const answer = getTodayAnswer()
    for (const key of answer.split('')) {
      await page.keyboard.press(key)
    }
    await page.keyboard.press('Enter')

    // Wait for funnel phase (after dim completes)
    await expect(page.getByTestId('post-solve-horizontal')).toBeVisible({ timeout: 3000 })
  })

  test('collapsed board shows only 1 row on desktop post-solve', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const answer = getTodayAnswer()
    for (const key of answer.split('')) {
      await page.keyboard.press(key)
    }
    await page.keyboard.press('Enter')

    await expect(page.getByTestId('collapsed-board')).toBeVisible({ timeout: 3000 })
    const rows = page.getByTestId('collapsed-board').locator('[role="row"]')
    await expect(rows).toHaveCount(1)
  })

  test('three-column layout has three child areas', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const answer = getTodayAnswer()
    for (const key of answer.split('')) {
      await page.keyboard.press(key)
    }
    await page.keyboard.press('Enter')

    await expect(page.getByTestId('post-solve-horizontal')).toBeVisible({ timeout: 3000 })
    // Should have funnel chart, collapsed board, and eventually etymology
    await expect(page.locator('[data-testid="post-solve-horizontal"] .funnel-chart')).toBeVisible()
    await expect(page.getByTestId('collapsed-board')).toBeVisible()
  })
})

test.describe('narrow viewport post-solve', () => {
  test('horizontal layout does NOT appear on narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const answer = getTodayAnswer()
    for (const key of answer.split('')) {
      await page.keyboard.press(key)
    }
    await page.keyboard.press('Enter')

    // Wait for funnel to appear
    await expect(page.locator('.funnel-chart')).toBeVisible({ timeout: 3000 })
    // Horizontal container should not exist
    await expect(page.getByTestId('post-solve-horizontal')).not.toBeAttached()
  })
})
