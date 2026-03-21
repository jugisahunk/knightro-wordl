import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FunnelBar from './FunnelBar.vue'

describe('FunnelBar', () => {
  it('renders with 100% width when count is 2315 (no isSolveRow)', () => {
    const wrapper = mount(FunnelBar, {
      props: { count: 2315, isSolveRow: false },
    })
    const bar = wrapper.find('.funnel-bar')
    expect(bar.exists()).toBe(true)
    expect(bar.attributes('style')).toContain('width: 100%')
    expect(bar.attributes('style')).toContain('var(--color-tile-correct)')
  })

  it('enforces min-width: 2px when count is 0', () => {
    const wrapper = mount(FunnelBar, {
      props: { count: 0, isSolveRow: false },
    })
    const bar = wrapper.find('.funnel-bar')
    expect(bar.attributes('style')).toContain('min-width: 2px')
  })

  it('uses accent-streak color and shows ✓ when isSolveRow is true', () => {
    const wrapper = mount(FunnelBar, {
      props: { count: 1, isSolveRow: true },
    })
    const bar = wrapper.find('.funnel-bar')
    expect(bar.attributes('style')).toContain('var(--color-accent-streak)')
    expect(wrapper.text()).toContain('✓')
  })

  it('places label inside bar when count is 500 (widthPct ≈ 21.6%)', () => {
    const wrapper = mount(FunnelBar, {
      props: { count: 500, isSolveRow: false },
    })
    expect(wrapper.find('.funnel-label--inside').exists()).toBe(true)
    expect(wrapper.find('.funnel-label--outside').exists()).toBe(false)
  })

  it('places label outside bar when count is 10 (widthPct ≈ 0.4%)', () => {
    const wrapper = mount(FunnelBar, {
      props: { count: 10, isSolveRow: false },
    })
    expect(wrapper.find('.funnel-label--outside').exists()).toBe(true)
    expect(wrapper.find('.funnel-label--inside').exists()).toBe(false)
  })

  it('is a pure prop component — no Pinia required', () => {
    // Mounts without global plugins — should not throw
    expect(() =>
      mount(FunnelBar, {
        props: { count: 100, isSolveRow: false },
      }),
    ).not.toThrow()
  })

  it('places solve-row label inside bar when count is 500 (wide bar)', () => {
    const wrapper = mount(FunnelBar, {
      props: { count: 500, isSolveRow: true },
    })
    expect(wrapper.find('.funnel-label--inside').exists()).toBe(true)
    expect(wrapper.find('.funnel-label--outside').exists()).toBe(false)
    expect(wrapper.find('.funnel-label--inside').text()).toContain('✓')
  })
})
