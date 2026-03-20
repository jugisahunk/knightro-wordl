import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import StreakBadge from './StreakBadge.vue'

describe('StreakBadge', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('displays 0 when myrdle_streak is not in localStorage', () => {
    const wrapper = mount(StreakBadge, { global: { plugins: [pinia] } })
    expect(wrapper.text()).toBe('0')
  })

  it('displays 0 when myrdle_streak is corrupted', () => {
    localStorage.setItem('myrdle_streak', 'not-valid-json{{{')
    const wrapper = mount(StreakBadge, { global: { plugins: [pinia] } })
    expect(wrapper.text()).toBe('0')
  })

  it('displays stored count when myrdle_streak is present and valid', () => {
    localStorage.setItem('myrdle_streak', JSON.stringify({ count: 7, lastSolvedDate: '2026-03-20' }))
    const wrapper = mount(StreakBadge, { global: { plugins: [pinia] } })
    expect(wrapper.text()).toBe('7')
  })

  it('has streak-count--active class when count > 0', () => {
    localStorage.setItem('myrdle_streak', JSON.stringify({ count: 3, lastSolvedDate: '2026-03-20' }))
    const wrapper = mount(StreakBadge, { global: { plugins: [pinia] } })
    expect(wrapper.find('.streak-count--active').exists()).toBe(true)
    expect(wrapper.find('.streak-count--zero').exists()).toBe(false)
  })

  it('has streak-count--zero class when count is 0', () => {
    const wrapper = mount(StreakBadge, { global: { plugins: [pinia] } })
    expect(wrapper.find('.streak-count--zero').exists()).toBe(true)
    expect(wrapper.find('.streak-count--active').exists()).toBe(false)
  })

  it('has correct aria-label when count is 7', () => {
    localStorage.setItem('myrdle_streak', JSON.stringify({ count: 7, lastSolvedDate: '2026-03-20' }))
    const wrapper = mount(StreakBadge, { global: { plugins: [pinia] } })
    expect(wrapper.find('.streak-badge').attributes('aria-label')).toBe('Current streak: 7 days')
  })

  it('has correct aria-label when count is 0', () => {
    const wrapper = mount(StreakBadge, { global: { plugins: [pinia] } })
    expect(wrapper.find('.streak-badge').attributes('aria-label')).toBe('Current streak: 0 days')
  })

  it('has correct aria-label when count is 1 (singular)', () => {
    localStorage.setItem('myrdle_streak', JSON.stringify({ count: 1, lastSolvedDate: '2026-03-20' }))
    const wrapper = mount(StreakBadge, { global: { plugins: [pinia] } })
    expect(wrapper.find('.streak-badge').attributes('aria-label')).toBe('Current streak: 1 day')
  })
})
