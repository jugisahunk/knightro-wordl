import { test, expect } from '@playwright/test'

test.describe('shortcut overlay', () => {
  test('pressing ? opens ShortcutOverlay, pressing ? again closes it', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.keyboard.press('?')
    await expect(page.locator('[aria-label="Keyboard shortcuts"]')).toBeVisible()
    await page.keyboard.press('?')
    await expect(page.locator('[aria-label="Keyboard shortcuts"]')).not.toBeVisible()
  })

  test('pressing Escape closes ShortcutOverlay', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.keyboard.press('?')
    await expect(page.locator('[aria-label="Keyboard shortcuts"]')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('[aria-label="Keyboard shortcuts"]')).not.toBeVisible()
  })

  test('keyboard-only gameplay works after opening and closing ShortcutOverlay via Escape', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Open and close the overlay
    await page.keyboard.press('?')
    await expect(page.locator('[aria-label="Keyboard shortcuts"]')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('[aria-label="Keyboard shortcuts"]')).not.toBeVisible()

    // Type a letter and verify a tile fills
    await page.keyboard.press('a')
    const filledTile = page.locator('.board-row').first().locator('.tile-state-filled')
    await expect(filledTile).toHaveCount(1)
  })

  test('keyboard-only gameplay works after opening and closing ShortcutOverlay via ?', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Open and close the overlay via ? toggle
    await page.keyboard.press('?')
    await expect(page.locator('[aria-label="Keyboard shortcuts"]')).toBeVisible()
    await page.keyboard.press('?')
    await expect(page.locator('[aria-label="Keyboard shortcuts"]')).not.toBeVisible()

    // Type a letter and verify a tile fills (focus was restored)
    await page.keyboard.press('a')
    const filledTile = page.locator('.board-row').first().locator('.tile-state-filled')
    await expect(filledTile).toHaveCount(1)
  })

  test('clicking backdrop closes ShortcutOverlay', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.keyboard.press('?')
    await expect(page.locator('[aria-label="Keyboard shortcuts"]')).toBeVisible()

    // Click the backdrop (top-left corner, outside the centered content block)
    await page.mouse.click(5, 5)
    await expect(page.locator('[aria-label="Keyboard shortcuts"]')).not.toBeVisible()
  })
})
