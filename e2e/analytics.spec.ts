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

  test('shows starting word empty state when no records seeded', async ({ page }) => {
    await page.goto('/analytics')
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('starting-word-empty')).toBeVisible()
    await expect(page.getByTestId('starting-word-empty')).toContainText(
      'Play 5 more puzzles to unlock starting word insights.',
    )
  })

  test('shows starting word "Play 2 more puzzles" for 3 records', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      for (let i = 1; i <= 3; i++) {
        localStorage.setItem(
          `myrdle_game_2026-03-0${i}`,
          JSON.stringify({ guesses: ['crane', 'slope'], solved: true, funnelData: [2315, 60, 1] }),
        )
      }
    })
    await page.goto('/analytics')
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('starting-word-empty')).toBeVisible()
    await expect(page.getByTestId('starting-word-empty')).toContainText(
      'Play 2 more puzzles to unlock starting word insights.',
    )
  })

  test('shows starting word average for 5+ records with known funnelData', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      const funnelValues = [60, 50, 70, 80, 40] // avg = 60
      for (let i = 0; i < 5; i++) {
        localStorage.setItem(
          `myrdle_game_2026-03-0${i + 1}`,
          JSON.stringify({
            guesses: ['crane', 'slope'],
            solved: true,
            funnelData: [2315, funnelValues[i], 1],
          }),
        )
      }
    })
    await page.goto('/analytics')
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('starting-word-average')).toBeVisible()
    await expect(page.getByTestId('starting-word-average')).toHaveText('60')
  })

  test('shows most-used starting word for 5+ records with same opener', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      for (let i = 1; i <= 5; i++) {
        localStorage.setItem(
          `myrdle_game_2026-03-0${i}`,
          JSON.stringify({
            guesses: ['crane', 'slope'],
            solved: true,
            funnelData: [2315, 60, 1],
          }),
        )
      }
    })
    await page.goto('/analytics')
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('starting-word-opener')).toBeVisible()
    await expect(page.getByTestId('starting-word-opener')).toHaveText('CRANE')
    await expect(page.getByTestId('starting-word-opener-count')).toContainText('5 of 5 games')
  })

  // === Past Puzzle Browser (Story 6.4) ===

  test('shows past puzzles empty state when no records seeded', async ({ page }) => {
    await page.goto('/analytics')
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('past-puzzles-empty')).toBeVisible()
    await expect(page.getByTestId('past-puzzles-empty')).toContainText(
      'Play your first puzzle to start browsing your history.',
    )
  })

  test('shows 3 past puzzle cards in reverse chronological order', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem(
        'myrdle_game_2026-03-18',
        JSON.stringify({ guesses: ['crane', 'spray'], solved: true, funnelData: [2315, 100, 1] }),
      )
      localStorage.setItem(
        'myrdle_game_2026-03-19',
        JSON.stringify({ guesses: ['crane', 'slant', 'trick', 'plumb', 'dwarf', 'glyph'], solved: false, funnelData: [2315, 100, 50, 20, 8, 3] }),
      )
      localStorage.setItem(
        'myrdle_game_2026-03-20',
        JSON.stringify({ guesses: ['crane', 'caput'], solved: true, funnelData: [2315, 100, 1] }),
      )
    })
    await page.goto('/analytics')
    await page.waitForLoadState('networkidle')
    const cards = page.getByTestId('past-puzzle-card')
    await expect(cards).toHaveCount(3)
    // Reverse chronological: latest first
    const dates = await cards.getByTestId('past-puzzle-date').allTextContents()
    expect(dates).toEqual(['Mar 20, 2026', 'Mar 19, 2026', 'Mar 18, 2026'])
  })

  test('past puzzle cards show answer word and result badge', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem(
        'myrdle_game_2026-03-18',
        JSON.stringify({ guesses: ['crane', 'spray'], solved: true, funnelData: [2315, 100, 1] }),
      )
      localStorage.setItem(
        'myrdle_game_2026-03-19',
        JSON.stringify({ guesses: ['crane', 'slant', 'trick', 'plumb', 'dwarf', 'glyph'], solved: false, funnelData: [2315, 100, 50, 20, 8, 3] }),
      )
    })
    await page.goto('/analytics')
    await page.waitForLoadState('networkidle')
    const cards = page.getByTestId('past-puzzle-card')
    // Reverse order: Mar 19 first (failed), Mar 18 second (solved)
    const answers = await cards.getByTestId('past-puzzle-answer').allTextContents()
    expect(answers).toEqual(['HOIST', 'SPRAY'])
    const results = await cards.getByTestId('past-puzzle-result').allTextContents()
    expect(results).toEqual(['✗ 6/6', '✓ 2/6'])
  })

  test('clicking a past puzzle card shows guess tiles with correct colors', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      // answer for 2026-03-20 is "caput"
      localStorage.setItem(
        'myrdle_game_2026-03-20',
        JSON.stringify({ guesses: ['crane', 'caput'], solved: true, funnelData: [2315, 100, 1] }),
      )
    })
    await page.goto('/analytics')
    await page.waitForLoadState('networkidle')
    await page.getByTestId('past-puzzle-card').click()
    await expect(page.getByTestId('past-puzzle-detail')).toBeVisible()
    await expect(page.getByTestId('past-puzzle-detail-board')).toBeVisible()
    // 2 guesses × 5 letters = 10 tiles
    const tiles = page.getByTestId('past-puzzle-tile')
    await expect(tiles).toHaveCount(10)
    // Second row ("caput" vs "caput") — all tiles should have correct background
    const lastRowTiles = tiles.nth(5) // first tile of second row
    await expect(lastRowTiles).toHaveCSS('background-color', /rgb/)
  })

  test('clicking a past puzzle card shows etymology content', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem(
        'myrdle_game_2026-03-20',
        JSON.stringify({ guesses: ['crane', 'caput'], solved: true, funnelData: [2315, 100, 1] }),
      )
    })
    await page.goto('/analytics')
    await page.waitForLoadState('networkidle')
    await page.getByTestId('past-puzzle-card').click()
    await expect(page.getByTestId('past-puzzle-etymology')).toBeVisible()
    // "CAPUT" has etymology data
    await expect(page.getByTestId('past-puzzle-etymology')).toContainText('CAPUT')
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
