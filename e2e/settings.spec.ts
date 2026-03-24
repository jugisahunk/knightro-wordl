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

  test('enabling deuteranopia adds deuteranopia class to html', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.click('.settings-trigger')
    await expect(page.locator('.settings-panel')).toBeVisible()
    await page.locator('button[aria-label="Deuteranopia colour scheme"]').click()
    const htmlClass = await page.locator('html').getAttribute('class')
    expect(htmlClass).toContain('deuteranopia')
  })

  test('disabling deuteranopia removes deuteranopia class from html', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.click('.settings-trigger')
    await page.locator('button[aria-label="Deuteranopia colour scheme"]').click()
    await expect(page.locator('html')).toHaveClass(/deuteranopia/)
    await page.locator('button[aria-label="Deuteranopia colour scheme"]').click()
    const htmlClass = await page.locator('html').getAttribute('class')
    expect(htmlClass ?? '').not.toContain('deuteranopia')
  })

  test('deuteranopia preference persists across page reload', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.click('.settings-trigger')
    await page.locator('button[aria-label="Deuteranopia colour scheme"]').click()
    await expect(page.locator('html')).toHaveClass(/deuteranopia/)
    await page.reload()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('html')).toHaveClass(/deuteranopia/)
  })
})
