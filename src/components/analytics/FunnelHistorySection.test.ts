import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FunnelHistorySection from './FunnelHistorySection.vue'
import FunnelChart from '@/components/post-solve/FunnelChart.vue'
import type { DailyGameRecord } from '@/types/persistence'

function makeRecord(date: string, solved: boolean, funnelData: number[], guesses: string[]): DailyGameRecord {
  return { date, solved, funnelData, guesses }
}

describe('FunnelHistorySection', () => {
  it('renders empty state message when records is empty', () => {
    const wrapper = mount(FunnelHistorySection, {
      props: { records: [] },
    })
    expect(wrapper.find('[data-testid="funnel-empty"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="funnel-empty"]').text()).toBe(
      'Play your first puzzle to start building your history.',
    )
    expect(wrapper.findAllComponents(FunnelChart)).toHaveLength(0)
  })

  it('empty state has role="status"', () => {
    const wrapper = mount(FunnelHistorySection, {
      props: { records: [] },
    })
    expect(wrapper.find('[data-testid="funnel-empty"]').attributes('role')).toBe('status')
  })

  it('renders single FunnelChart with "more data" note for 1 record', () => {
    const records = [makeRecord('2026-03-20', true, [48, 9, 1], ['crane', 'slope', 'truce'])]
    const wrapper = mount(FunnelHistorySection, {
      props: { records },
    })
    expect(wrapper.findAllComponents(FunnelChart)).toHaveLength(1)
    expect(wrapper.find('[data-testid="funnel-more-data"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="funnel-more-data"]').text()).toBe(
      'Play more puzzles to see trends over time.',
    )
  })

  it('renders one FunnelChart per record for 2+ records', () => {
    const records = [
      makeRecord('2026-03-18', true, [100, 10, 1], ['crane', 'slant', 'trick']),
      makeRecord('2026-03-19', false, [200, 50, 20, 8, 3, 1], ['crane', 'slant', 'trick', 'plumb', 'dwarf', 'glyph']),
      makeRecord('2026-03-20', true, [48, 9, 1], ['crane', 'slope', 'truce']),
    ]
    const wrapper = mount(FunnelHistorySection, {
      props: { records },
    })
    expect(wrapper.findAllComponents(FunnelChart)).toHaveLength(3)
    expect(wrapper.find('[data-testid="funnel-more-data"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="funnel-empty"]').exists()).toBe(false)
  })

  it('renders records in chronological order with date labels', () => {
    const records = [
      makeRecord('2026-03-18', true, [100, 10, 1], ['crane', 'slant', 'trick']),
      makeRecord('2026-03-20', true, [48, 9, 1], ['crane', 'slope', 'truce']),
    ]
    const wrapper = mount(FunnelHistorySection, {
      props: { records },
    })
    const cards = wrapper.findAll('[data-testid="funnel-card"]')
    expect(cards).toHaveLength(2)
    expect(cards[0].find('.card-date').text()).toBe('Mar 18, 2026')
    expect(cards[1].find('.card-date').text()).toBe('Mar 20, 2026')
  })

  it('shows solved result badge with correct format', () => {
    const records = [makeRecord('2026-03-20', true, [48, 9, 1], ['crane', 'slope', 'truce'])]
    const wrapper = mount(FunnelHistorySection, {
      props: { records },
    })
    const result = wrapper.find('.card-result')
    expect(result.text()).toBe('✓ 3/6')
    expect(result.classes()).toContain('card-result--solved')
  })

  it('shows failed result badge with correct format', () => {
    const records = [makeRecord('2026-03-20', false, [200, 50, 20, 8, 3, 1], ['a', 'b', 'c', 'd', 'e', 'f'])]
    const wrapper = mount(FunnelHistorySection, {
      props: { records },
    })
    const result = wrapper.find('.card-result')
    expect(result.text()).toBe('✗ 6/6')
    expect(result.classes()).toContain('card-result--failed')
  })

  it('has region role with aria-label', () => {
    const wrapper = mount(FunnelHistorySection, {
      props: { records: [] },
    })
    const section = wrapper.find('[role="region"]')
    expect(section.exists()).toBe(true)
    expect(section.attributes('aria-label')).toBe('Funnel History')
  })

  it('passes correct props to FunnelChart', () => {
    const records = [makeRecord('2026-03-20', true, [48, 9, 1], ['crane', 'slope', 'truce'])]
    const wrapper = mount(FunnelHistorySection, {
      props: { records },
    })
    const chart = wrapper.findComponent(FunnelChart)
    expect(chart.props('funnelData')).toEqual([48, 9, 1])
    expect(chart.props('solved')).toBe(true)
  })
})
