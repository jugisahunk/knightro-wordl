import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StartingWordSection from './StartingWordSection.vue'
import type { DailyGameRecord } from '@/types/persistence'

function makeRecord(date: string, guess1: string, funnelAfterGuess1: number): DailyGameRecord {
  return { date, guesses: [guess1, 'xxxxx'], solved: true, funnelData: [2315, funnelAfterGuess1, 1] }
}

describe('StartingWordSection', () => {
  it('renders empty state with correct message and data-testid for 0 records', () => {
    const wrapper = mount(StartingWordSection, { props: { records: [] } })
    const empty = wrapper.find('[data-testid="starting-word-empty"]')
    expect(empty.exists()).toBe(true)
    expect(empty.text()).toBe('Play 5 more puzzles to unlock starting word insights.')
  })

  it('renders "Play 2 more puzzles" for 3 records', () => {
    const records = [
      makeRecord('2026-03-01', 'crane', 60),
      makeRecord('2026-03-02', 'crane', 50),
      makeRecord('2026-03-03', 'crane', 70),
    ]
    const wrapper = mount(StartingWordSection, { props: { records } })
    const empty = wrapper.find('[data-testid="starting-word-empty"]')
    expect(empty.exists()).toBe(true)
    expect(empty.text()).toBe('Play 2 more puzzles to unlock starting word insights.')
  })

  it('renders average remaining value for 5+ records', () => {
    const records = [
      makeRecord('2026-03-01', 'crane', 60),
      makeRecord('2026-03-02', 'crane', 50),
      makeRecord('2026-03-03', 'crane', 70),
      makeRecord('2026-03-04', 'crane', 80),
      makeRecord('2026-03-05', 'crane', 40),
    ]
    const wrapper = mount(StartingWordSection, { props: { records } })
    expect(wrapper.find('[data-testid="starting-word-empty"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="starting-word-average"]').text()).toBe('60')
  })

  it('renders most-used opening word for 5+ records', () => {
    const records = [
      makeRecord('2026-03-01', 'crane', 60),
      makeRecord('2026-03-02', 'crane', 50),
      makeRecord('2026-03-03', 'salty', 70),
      makeRecord('2026-03-04', 'crane', 80),
      makeRecord('2026-03-05', 'crane', 40),
    ]
    const wrapper = mount(StartingWordSection, { props: { records } })
    expect(wrapper.find('[data-testid="starting-word-opener"]').text()).toBe('CRANE')
    expect(wrapper.find('[data-testid="starting-word-opener-count"]').text()).toBe('4 of 5 games')
  })

  it('has correct role="region" and aria-label', () => {
    const wrapper = mount(StartingWordSection, { props: { records: [] } })
    const section = wrapper.find('[role="region"]')
    expect(section.exists()).toBe(true)
    expect(section.attributes('aria-label')).toBe('Starting Word Effectiveness')
  })

  it('singular "puzzle" when exactly 1 more game needed', () => {
    const records = [
      makeRecord('2026-03-01', 'crane', 60),
      makeRecord('2026-03-02', 'crane', 50),
      makeRecord('2026-03-03', 'crane', 70),
      makeRecord('2026-03-04', 'crane', 80),
    ]
    const wrapper = mount(StartingWordSection, { props: { records } })
    expect(wrapper.find('[data-testid="starting-word-empty"]').text()).toBe(
      'Play 1 more puzzle to unlock starting word insights.',
    )
  })
})
