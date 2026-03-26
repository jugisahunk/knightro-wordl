import { test, expect } from '@playwright/test'

test.describe('analytics view', () => {
  test('navigates to /analytics and page loads without error', async ({ page }) => {
    await page.goto('/analytics')
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('analytics-root')).toBeVisible()
    await expect(page.locator('h1')).toHaveText('Analytics')
  })

  test('shows empty state when no game records exist', async ({ page }) => {
    await page.goto('/analytics')
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('funnel-empty')).toBeVisible()
    await expect(page.getByTestId('funnel-empty')).toContainText('Play your first puzzle to start building your history.')
  })

  test('shows record count when game records exist', async ({ page }) => {
    // Seed localStorage with test records before navigating
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem(
        'myrdle_game_2026-03-18',
        JSON.stringify({ guesses: ['crane'], solved: true, funnelData: [2315] }),
      )
      localStorage.setItem(
        'myrdle_game_2026-03-19',
        JSON.stringify({ guesses: ['salty', 'crane'], solved: false, funnelData: [2315, 100] }),
      )
    })
    await page.goto('/analytics')
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('analytics-content')).toBeVisible()
    await expect(page.getByTestId('record-count')).toContainText('2 games played')
  })

  test('back button navigates to home', async ({ page }) => {
    await page.goto('/analytics')
    await page.waitForLoadState('networkidle')
    await page.getByTestId('back-button').click()
    await expect(page).toHaveURL('/')
  })

  test('analytics trigger in GameView navigates to analytics', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.getByTestId('analytics-trigger').click()
    await expect(page).toHaveURL('/analytics')
    await expect(page.getByTestId('analytics-root')).toBeVisible()
  })

  test('shows funnel empty state when no records seeded', async ({ page }) => {
    await page.goto('/analytics')
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('funnel-history')).toBeVisible()
    await expect(page.getByTestId('funnel-empty')).toBeVisible()
    await expect(page.getByTestId('funnel-empty')).toContainText('Play your first puzzle to start building your history.')
  })

  test('shows single funnel with "more data" note for 1 record', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem(
        'myrdle_game_2026-03-20',
        JSON.stringify({ guesses: ['crane', 'slope', 'truce'], solved: true, funnelData: [48, 9, 1] }),
      )
    })
    await page.goto('/analytics')
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('funnel-card')).toHaveCount(1)
    await expect(page.getByTestId('funnel-more-data')).toBeVisible()
    await expect(page.getByTestId('funnel-more-data')).toContainText('Play more puzzles to see trends over time.')
  })

  test('shows multiple funnel charts in chronological order for 3+ records', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem(
        'myrdle_game_2026-03-18',
        JSON.stringify({ guesses: ['crane', 'slant', 'trick'], solved: true, funnelData: [100, 10, 1] }),
      )
      localStorage.setItem(
        'myrdle_game_2026-03-19',
        JSON.stringify({ guesses: ['crane', 'slant', 'trick', 'plumb', 'dwarf', 'glyph'], solved: false, funnelData: [200, 50, 20, 8, 3, 1] }),
      )
      localStorage.setItem(
        'myrdle_game_2026-03-20',
        JSON.stringify({ guesses: ['crane', 'slope', 'truce'], solved: true, funnelData: [48, 9, 1] }),
      )
    })
    await page.goto('/analytics')
    await page.waitForLoadState('networkidle')
    const cards = page.getByTestId('funnel-card')
    await expect(cards).toHaveCount(3)
    // Verify chronological order via date labels
    const dates = await cards.getByTestId('card-date').allTextContents()
    expect(dates).toEqual(['Mar 18, 2026', 'Mar 19, 2026', 'Mar 20, 2026'])
    // Verify solved/failed badges
    const results = await cards.getByTestId('card-result').allTextContents()
    expect(results).toEqual(['✓ 3/6', '✗ 6/6', '✓ 3/6'])
    // No "more data" note for 3+ records
    await expect(page.getByTestId('funnel-more-data')).toHaveCount(0)
  })
})
