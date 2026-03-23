import { test, expect } from '@playwright/test'

test.describe('settings panel', () => {
  test('clicking the settings trigger opens the settings panel', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.click('.settings-trigger')
    await expect(page.locator('.settings-panel')).toBeVisible()
  })

  test('pressing Escape closes the settings panel', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.click('.settings-trigger')
    await expect(page.locator('.settings-panel')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('.settings-panel')).not.toBeVisible()
  })

  test('clicking outside the panel closes it', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.click('.settings-trigger')
    await expect(page.locator('.settings-panel')).toBeVisible()
    await page.locator('main').click({ position: { x: 10, y: 10 } })
    await expect(page.locator('.settings-panel')).not.toBeVisible()
  })
})
