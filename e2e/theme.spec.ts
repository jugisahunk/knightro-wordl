import { test, expect } from '@playwright/test'

test.describe('theme toggle', () => {
  test('light OS preference applies theme-light class on first load', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('html')).toHaveClass(/theme-light/)
  })

  test('dark OS preference does not apply theme-light class on first load', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    const htmlClass = await page.locator('html').getAttribute('class')
    expect(htmlClass ?? '').not.toContain('theme-light')
  })

  test('manual toggle: clicking light theme option applies theme-light class', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.getByTestId('settings-trigger').click()
    await expect(page.locator('[data-testid="theme-selector"]')).toBeVisible()
    await page.locator('[data-testid="theme-option-light"]').click()
    await expect(page.locator('html')).toHaveClass(/theme-light/)
  })

  test('manual toggle: clicking dark theme option removes theme-light class', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('html')).toHaveClass(/theme-light/)
    await page.getByTestId('settings-trigger').click()
    await page.locator('[data-testid="theme-option-dark"]').click()
    const htmlClass = await page.locator('html').getAttribute('class')
    expect(htmlClass ?? '').not.toContain('theme-light')
  })

  test('theme preference persists across page reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.getByTestId('settings-trigger').click()
    await page.locator('[data-testid="theme-option-light"]').click()
    await expect(page.locator('html')).toHaveClass(/theme-light/)
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('html')).toHaveClass(/theme-light/)
  })

  test('system theme responds to OS scheme change without reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    // Ensure system is selected (default)
    const htmlClass = await page.locator('html').getAttribute('class')
    expect(htmlClass ?? '').not.toContain('theme-light')
    // Emulate OS switching to light
    await page.emulateMedia({ colorScheme: 'light' })
    await expect(page.locator('html')).toHaveClass(/theme-light/)
  })

  test('theme selector uses data-testid attributes', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.getByTestId('settings-trigger').click()
    await expect(page.locator('[data-testid="theme-selector"]')).toBeVisible()
    await expect(page.locator('[data-testid="theme-option-light"]')).toBeVisible()
    await expect(page.locator('[data-testid="theme-option-dark"]')).toBeVisible()
    await expect(page.locator('[data-testid="theme-option-system"]')).toBeVisible()
  })
})
