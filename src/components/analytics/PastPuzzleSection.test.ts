import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PastPuzzleSection from './PastPuzzleSection.vue'
import type { DailyGameRecord } from '@/types/persistence'

// Answers for test dates (computed from EPOCH_DATE 2021-06-19):
// 2026-03-18 => "spray"
// 2026-03-19 => "hoist"
// 2026-03-20 => "caput"

function makeRecord(
  date: string,
  guesses: string[],
  solved: boolean,
): DailyGameRecord {
  return { date, guesses, solved, funnelData: [2315, 100, 1] }
}

const threeRecords: DailyGameRecord[] = [
  makeRecord('2026-03-18', ['crane', 'spray'], true),
  makeRecord('2026-03-19', ['crane', 'slant', 'trick', 'plumb', 'dwarf', 'glyph'], false),
  makeRecord('2026-03-20', ['crane', 'caput'], true),
]

describe('PastPuzzleSection', () => {
  it('renders empty state with correct message and data-testid for 0 records', () => {
    const wrapper = mount(PastPuzzleSection, { props: { records: [] } })
    const empty = wrapper.find('[data-testid="past-puzzles-empty"]')
    expect(empty.exists()).toBe(true)
    expect(empty.text()).toBe('Play your first puzzle to start browsing your history.')
  })

  it('renders list in reverse chronological order (latest first)', () => {
    const wrapper = mount(PastPuzzleSection, { props: { records: threeRecords } })
    const cards = wrapper.findAll('[data-testid="past-puzzle-card"]')
    expect(cards).toHaveLength(3)
    const dates = cards.map((c) => c.find('[data-testid="past-puzzle-date"]').text())
    expect(dates).toEqual(['Mar 20, 2026', 'Mar 19, 2026', 'Mar 18, 2026'])
  })

  it('each card shows date, answer word, and result badge', () => {
    const wrapper = mount(PastPuzzleSection, { props: { records: threeRecords } })
    const cards = wrapper.findAll('[data-testid="past-puzzle-card"]')

    // First card in list is latest (Mar 20 => "caput", solved in 2)
    expect(cards[0].find('[data-testid="past-puzzle-answer"]').text()).toBe('CAPUT')
    expect(cards[0].find('[data-testid="past-puzzle-result"]').text()).toBe('✓ 2/6')

    // Second card (Mar 19 => "hoist", failed)
    expect(cards[1].find('[data-testid="past-puzzle-answer"]').text()).toBe('HOIST')
    expect(cards[1].find('[data-testid="past-puzzle-result"]').text()).toBe('✗ 6/6')

    // Third card (Mar 18 => "spray", solved in 2)
    expect(cards[2].find('[data-testid="past-puzzle-answer"]').text()).toBe('SPRAY')
    expect(cards[2].find('[data-testid="past-puzzle-result"]').text()).toBe('✓ 2/6')
  })

  it('clicking a card expands the detail view with guess tiles and etymology', async () => {
    const wrapper = mount(PastPuzzleSection, { props: { records: threeRecords } })
    const cards = wrapper.findAll('[data-testid="past-puzzle-card"]')

    // Click the first card (Mar 20, "caput", solved in 2 guesses)
    await cards[0].trigger('click')

    // Detail view should appear
    expect(wrapper.find('[data-testid="past-puzzle-detail"]').exists()).toBe(true)
    // List should be gone
    expect(wrapper.findAll('[data-testid="past-puzzle-card"]')).toHaveLength(0)

    // Mini-board should have tiles
    const board = wrapper.find('[data-testid="past-puzzle-detail-board"]')
    expect(board.exists()).toBe(true)
    const tiles = wrapper.findAll('[data-testid="past-puzzle-tile"]')
    // 2 guesses × 5 letters = 10 tiles
    expect(tiles).toHaveLength(10)

    // Etymology should be present
    const etymology = wrapper.find('[data-testid="past-puzzle-etymology"]')
    expect(etymology.exists()).toBe(true)
    // "caput" has etymology data — check definition is rendered
    expect(etymology.text()).toContain('CAPUT')

    // Back button should exist
    expect(wrapper.find('[data-testid="past-puzzle-back"]').exists()).toBe(true)
  })

  it('section has correct role="region" and aria-label', () => {
    const wrapper = mount(PastPuzzleSection, { props: { records: [] } })
    const section = wrapper.find('[role="region"]')
    expect(section.exists()).toBe(true)
    expect(section.attributes('aria-label')).toBe('Past Puzzles')
  })

  it('solved record shows "✓ N/6" badge, failed record shows "✗ 6/6"', () => {
    const records: DailyGameRecord[] = [
      makeRecord('2026-03-18', ['crane', 'spray'], true),
      makeRecord('2026-03-19', ['crane', 'slant', 'trick', 'plumb', 'dwarf', 'glyph'], false),
    ]
    const wrapper = mount(PastPuzzleSection, { props: { records } })
    const results = wrapper.findAll('[data-testid="past-puzzle-result"]').map((r) => r.text())
    // Reverse order: Mar 19 first, Mar 18 second
    expect(results).toEqual(['✗ 6/6', '✓ 2/6'])
  })

  it('back button returns to list view from detail', async () => {
    const wrapper = mount(PastPuzzleSection, { props: { records: threeRecords } })

    // Click first card
    await wrapper.findAll('[data-testid="past-puzzle-card"]')[0].trigger('click')
    expect(wrapper.find('[data-testid="past-puzzle-detail"]').exists()).toBe(true)

    // Click back
    await wrapper.find('[data-testid="past-puzzle-back"]').trigger('click')
    expect(wrapper.find('[data-testid="past-puzzle-detail"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-testid="past-puzzle-card"]')).toHaveLength(3)
  })
})
