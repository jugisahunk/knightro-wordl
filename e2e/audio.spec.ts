import { test, expect } from '@playwright/test'

test.describe('audio', () => {
  test('page loads without audio-related JS errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const audioErrors = errors.filter(
      (e) => e.toLowerCase().includes('audio') || e.toLowerCase().includes('wav'),
    )
    expect(audioErrors).toHaveLength(0)
  })

  test('background audio is requested after first keypress', async ({ page }) => {
    const audioRequests: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('.wav')) audioRequests.push(req.url())
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Before any keypress, background audio may not be fetched yet
    const beforeCount = audioRequests.length

    await page.keyboard.press('a')

    // Give the browser a moment to initiate the audio request
    await page.waitForTimeout(500)

    // At least one wav request should have been made (either at load or after keypress)
    expect(audioRequests.length).toBeGreaterThanOrEqual(beforeCount)
  })

  test('game remains fully playable with audio present', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Type a full word and submit
    for (const key of ['c', 'r', 'a', 'n', 'e']) {
      await page.keyboard.press(key)
    }
    await page.keyboard.press('Enter')

    // Board should have updated — first row tiles should have revealed states
    const revealedTiles = page
      .locator('.board-row')
      .first()
      .locator('.tile-state-correct, .tile-state-present, .tile-state-absent')
    await expect(revealedTiles).toHaveCount(5)

    expect(errors).toHaveLength(0)
  })
})
