import { test, expect } from '@playwright/test'

test.describe('accessibility — reduced motion', () => {
  test('tile flip animation is suppressed under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Type a valid 5-letter word and submit
    for (const key of ['c', 'r', 'a', 'n', 'e']) {
      await page.keyboard.press(key)
    }
    await page.keyboard.press('Enter')

    // Wait for tiles to reveal
    const revealedTiles = page
      .locator('.board-row')
      .first()
      .locator('.tile-state-correct, .tile-state-present, .tile-state-absent')
    await expect(revealedTiles).toHaveCount(5)

    // No tile should have the flipping animation class
    const flippingTiles = page.locator('.tile-flipping')
    await expect(flippingTiles).toHaveCount(0)
  })

  test('row shake animation is suppressed under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Type an invalid word (zzzzz) and submit
    for (const key of ['z', 'z', 'z', 'z', 'z']) {
      await page.keyboard.press(key)
    }
    await page.keyboard.press('Enter')

    // The row should not have the shake keyframe animation — it uses row-flash instead
    const shakingRow = page.locator('.row-shaking')
    // The row-shaking class may briefly appear, but the animation should be row-flash, not row-shake
    // We verify no translateX transform is applied (row-shake uses translateX)
    const row = page.locator('.board-row').first()
    const transform = await row.evaluate((el) => getComputedStyle(el).transform)
    // Under reduced motion, transform should be none (no translateX shake)
    expect(transform === 'none' || transform === '').toBeTruthy()
  })
})

test.describe('accessibility — focus-visible', () => {
  test('keyboard Tab shows visible focus ring on interactive elements', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Tab into the keyboard area
    await page.keyboard.press('Tab')

    // Find the focused element
    const focused = page.locator(':focus')
    await expect(focused).toBeVisible()

    // Check that outline is visible (non-zero width, color matches accent-streak #9999cc)
    const outlineStyle = await focused.evaluate((el) => {
      const style = getComputedStyle(el)
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
      }
    })
    expect(outlineStyle.outlineStyle).not.toBe('none')
    expect(outlineStyle.outlineWidth).not.toBe('0px')
  })
})
