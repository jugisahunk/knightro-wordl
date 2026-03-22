import { test, expect } from '@playwright/test'

const runSwTests = !!process.env.CI

test.describe('PWA / offline', () => {
  test('service worker registers on first visit', async ({ page, context }) => {
    test.skip(!runSwTests, 'SW tests require production build (run with CI=true and npm run preview)')

    // Guard: if SW is already registered in this context, use it directly;
    // otherwise wait for the registration event (avoids a hang when context is reused)
    const swPromise = context.waitForEvent('serviceworker')
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const sw = context.serviceWorkers()[0] ?? await swPromise
    expect(sw.url()).toContain('sw.js')
  })

  test('app loads offline after SW install', async ({ page, context }) => {
    test.skip(!runSwTests, 'SW tests require production build (run with CI=true and npm run preview)')

    // First visit — populate cache
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Wait for SW to activate and take control
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null)

    // Track any requests that escape the SW cache — must be zero (AC 5)
    const failedRequests: string[] = []
    page.on('requestfailed', req => failedRequests.push(req.url()))

    // Go offline
    await context.setOffline(true)
    try {
      // Reload — should serve entirely from SW cache
      await page.reload()
      await page.waitForLoadState('domcontentloaded')

      // App shell should be present
      await expect(page.locator('#app')).not.toBeEmpty()
      // Zero network escapes — all resources served from SW cache (AC 5)
      expect(failedRequests, 'all resources should be served from SW cache').toHaveLength(0)
    } finally {
      await context.setOffline(false)
    }
  })

  test('word validation works offline', async ({ page, context }) => {
    test.skip(!runSwTests, 'SW tests require production build (run with CI=true and npm run preview)')

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null)

    await context.setOffline(true)
    try {
      await page.reload()
      await page.waitForLoadState('domcontentloaded')

      // Type a valid word and submit
      for (const key of ['c', 'r', 'a', 'n', 'e']) {
        await page.keyboard.press(key)
      }
      await page.keyboard.press('Enter')

      // All 5 tiles in row 1 must reach a revealed state — proves the game engine
      // evaluated the guess from cache (tile slots are always in the DOM regardless)
      const revealedTiles = page
        .locator('.board-row')
        .first()
        .locator('.tile-state-correct, .tile-state-present, .tile-state-absent')
      await expect(revealedTiles).toHaveCount(5)
    } finally {
      await context.setOffline(false)
    }
  })

  test('load performance is within 500ms from cache', async ({ page }) => {
    test.skip(!runSwTests, 'Performance test only meaningful from production cache (run with CI=true and npm run preview)')

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null)

    // Suppress the autoUpdate background version-check so it can't race with
    // the timed navigation and inflate domInteractive non-deterministically
    await page.route('**/sw.js', route => route.abort())

    // Second navigation — should load from SW cache
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    await page.unroute('**/sw.js')

    const loadTime = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return nav.domInteractive
    })

    expect(loadTime).toBeLessThan(500)
  })
})
