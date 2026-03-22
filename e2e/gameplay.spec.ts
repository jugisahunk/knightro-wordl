import { test, expect } from '@playwright/test'
import answers from '../src/data/answers.json' with { type: 'json' }

function getTodayAnswer(): string {
  const EPOCH = new Date('2021-06-19').getTime()
  const today = new Date().toISOString().slice(0, 10)
  const dayOffset = Math.floor((new Date(today).getTime() - EPOCH) / 86400000)
  const arr = answers as string[]
  return arr[((dayOffset % arr.length) + arr.length) % arr.length]
}

test.describe('core gameplay', () => {
  // AC1: row reveals after valid guess
  test('submitting a valid word reveals all 5 tiles in row 1', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    for (const key of ['c', 'r', 'a', 'n', 'e']) {
      await page.keyboard.press(key)
    }
    await page.keyboard.press('Enter')

    const revealedTiles = page
      .locator('.board-row')
      .first()
      .locator('.tile-state-correct, .tile-state-present, .tile-state-absent')
    await expect(revealedTiles).toHaveCount(5)
  })

  // AC2: solving shows post-solve overlay
  test('solving the puzzle shows the post-solve funnel overlay', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const answer = getTodayAnswer()
    for (const key of answer.split('')) {
      await page.keyboard.press(key)
    }
    await page.keyboard.press('Enter')

    await expect(page.locator('.funnel-chart')).toBeVisible({ timeout: 2000 })
  })

  // AC3: both FunnelChart and EtymologyCard render
  test('advancing past funnel shows both FunnelChart and EtymologyCard', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const answer = getTodayAnswer()
    for (const key of answer.split('')) {
      await page.keyboard.press(key)
    }
    await page.keyboard.press('Enter')

    // Wait for funnel phase
    await expect(page.locator('.funnel-chart')).toBeVisible({ timeout: 2000 })

    // Advance to etymology phase
    await page.keyboard.press('Enter')

    await expect(page.locator('.funnel-chart')).toBeVisible()
    await expect(page.locator('.etymology-card')).toBeVisible()
  })

  // AC4: submitted guess persists on reload
  test('submitted guess row is restored after page reload', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    for (const key of ['c', 'r', 'a', 'n', 'e']) {
      await page.keyboard.press(key)
    }
    await page.keyboard.press('Enter')

    // Wait for row 1 to reveal before reloading
    const revealedTiles = page
      .locator('.board-row')
      .first()
      .locator('.tile-state-correct, .tile-state-present, .tile-state-absent')
    await expect(revealedTiles).toHaveCount(5)

    await page.reload()
    await page.waitForLoadState('networkidle')

    const restoredTiles = page
      .locator('.board-row')
      .first()
      .locator('.tile-state-correct, .tile-state-present, .tile-state-absent')
    await expect(restoredTiles).toHaveCount(5)
  })

  // AC5: streak badge activates on win
  test('solving the puzzle activates the streak badge', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const answer = getTodayAnswer()
    for (const key of answer.split('')) {
      await page.keyboard.press(key)
    }
    await page.keyboard.press('Enter')

    // Wait for funnel phase (confirms win was registered)
    await expect(page.locator('.funnel-chart')).toBeVisible({ timeout: 2000 })

    await expect(page.locator('.streak-count--active')).toBeVisible()
  })
})
