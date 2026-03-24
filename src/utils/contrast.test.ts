import { describe, it, expect } from 'vitest'

function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const [R, G, B] = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  )
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1)
  const l2 = relativeLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

const BG_SURFACE = '#1a1a22'

describe('WCAG AA contrast ratios (>= 4.5:1)', () => {
  it('tile-correct (#5a9654) vs bg-surface meets AA', () => {
    const ratio = contrastRatio('#5a9654', BG_SURFACE)
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  it('tile-present (#b59f3b) vs bg-surface meets AA', () => {
    const ratio = contrastRatio('#b59f3b', BG_SURFACE)
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  it('tile-correct-d (#4a90d9) vs bg-surface meets AA', () => {
    const ratio = contrastRatio('#4a90d9', BG_SURFACE)
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  it('tile-present-d (#e8a030) vs bg-surface meets AA', () => {
    const ratio = contrastRatio('#e8a030', BG_SURFACE)
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })
})
