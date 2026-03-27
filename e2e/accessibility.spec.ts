import { test, expect } from '@playwright/test'
import answers from '../src/data/answers.json' with { type: 'json' }

function getTodayAnswer(): string {
  const EPOCH = new Date('2021-06-19').getTime()
  const d = new Date()
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const dayOffset = Math.floor((new Date(today).getTime() - EPOCH) / 86400000)
  const arr = answers as string[]
  return arr[((dayOffset % arr.length) + arr.length) % arr.length]
}

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

test.describe('accessibility — secondary tile indicators', () => {
  test('correct tiles display ✓ indicator after guess', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Type the correct answer — all 5 tiles will be correct
    const answer = getTodayAnswer()
    for (const key of answer.split('')) {
      await page.keyboard.press(key)
    }
    await page.keyboard.press('Enter')

    // All 5 tiles in row 1 should be correct with ✓ indicators
    const firstRow = page.locator('.board-row').first()
    const indicators = firstRow.getByTestId('tile-indicator')
    await expect(indicators).toHaveCount(5)

    const texts = await indicators.allTextContents()
    expect(texts.every((t) => t === '✓')).toBe(true)
  })

  test('present tiles display · indicator and absent tiles have no indicator', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // "crane" is a valid guess; it will produce a mix of states depending on the answer
    for (const key of ['c', 'r', 'a', 'n', 'e']) {
      await page.keyboard.press(key)
    }
    await page.keyboard.press('Enter')

    const firstRow = page.locator('.board-row').first()

    // No absent tile should have an indicator
    const absentIndicators = firstRow.locator('.tile-state-absent [data-testid="tile-indicator"]')
    await expect(absentIndicators).toHaveCount(0)

    // Any present tile that exists must have · indicator
    const presentIndicators = firstRow.locator('.tile-state-present [data-testid="tile-indicator"]')
    const presentCount = await firstRow.locator('.tile-state-present').count()
    await expect(presentIndicators).toHaveCount(presentCount)
    if (presentCount > 0) {
      const texts = await presentIndicators.allTextContents()
      expect(texts.every((t) => t === '·')).toBe(true)
    }

    // Any correct tile that exists must have ✓ indicator
    const correctIndicators = firstRow.locator('.tile-state-correct [data-testid="tile-indicator"]')
    const correctCount = await firstRow.locator('.tile-state-correct').count()
    await expect(correctIndicators).toHaveCount(correctCount)
    if (correctCount > 0) {
      const texts = await correctIndicators.allTextContents()
      expect(texts.every((t) => t === '✓')).toBe(true)
    }
  })
})

test.describe('accessibility — keyboard color hierarchy', () => {
  test('unused key has lighter background than absent key after a guess', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Submit "crane" so some letters become absent on the keyboard
    for (const key of ['c', 'r', 'a', 'n', 'e']) {
      await page.keyboard.press(key)
    }
    await page.keyboard.press('Enter')

    // Wait for keyboard to update
    const absentKey = page.locator('.keyboard-key--absent').first()
    await expect(absentKey).toBeVisible()

    // Unused key: pick a letter known not in "crane" (q, w, t, y, u, i, o, p, s, d, f, g, h, j, k, l, z, x, v, b, m)
    const unusedKey = page.locator('.keyboard-key:not(.keyboard-key--absent):not(.keyboard-key--correct):not(.keyboard-key--present)').first()
    await expect(unusedKey).toBeVisible()

    // --color-key-unused: #3a3a4a → rgb(58, 58, 74)
    await expect(unusedKey).toHaveCSS('background-color', 'rgb(58, 58, 74)')

    // --color-bg-surface: #1a1a22 → rgb(26, 26, 34)
    await expect(absentKey).toHaveCSS('background-color', 'rgb(26, 26, 34)')
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
