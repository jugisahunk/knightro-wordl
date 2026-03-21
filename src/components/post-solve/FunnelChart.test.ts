import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FunnelChart from './FunnelChart.vue'
import FunnelBar from './FunnelBar.vue'

describe('FunnelChart', () => {
  it('renders 3 FunnelBars with last one as solve row when solved=true', () => {
    const wrapper = mount(FunnelChart, {
      props: { funnelData: [48, 9, 1], solved: true },
    })
    const bars = wrapper.findAllComponents(FunnelBar)
    expect(bars).toHaveLength(3)
    expect(bars[0].props('isSolveRow')).toBe(false)
    expect(bars[1].props('isSolveRow')).toBe(false)
    expect(bars[2].props('isSolveRow')).toBe(true)
  })

  it('renders 6 FunnelBars with none as solve row when solved=false', () => {
    const wrapper = mount(FunnelChart, {
      props: { funnelData: [120, 45, 18, 6, 2, 1], solved: false },
    })
    const bars = wrapper.findAllComponents(FunnelBar)
    expect(bars).toHaveLength(6)
    bars.forEach((bar) => {
      expect(bar.props('isSolveRow')).toBe(false)
    })
  })

  it('renders 1 bar for first session without suppression', () => {
    const wrapper = mount(FunnelChart, {
      props: { funnelData: [2315], solved: false },
    })
    const bars = wrapper.findAllComponents(FunnelBar)
    expect(bars).toHaveLength(1)
    expect(bars[0].props('isSolveRow')).toBe(false)
  })

  it('has role="img" on wrapper element', () => {
    const wrapper = mount(FunnelChart, {
      props: { funnelData: [48, 9, 1], solved: true },
    })
    expect(wrapper.find('[role="img"]').exists()).toBe(true)
  })

  it('has correct aria-label for solved case', () => {
    const wrapper = mount(FunnelChart, {
      props: { funnelData: [48, 9, 1], solved: true },
    })
    const label = wrapper.find('[role="img"]').attributes('aria-label')
    expect(label).toBe('Solve funnel: 2315 words at start, 48 after guess 1, 9 after guess 2, solved on guess 3')
  })

  it('has correct aria-label for failed case', () => {
    const wrapper = mount(FunnelChart, {
      props: { funnelData: [120, 45, 18, 6, 2, 1], solved: false },
    })
    const label = wrapper.find('[role="img"]').attributes('aria-label')
    expect(label).toBe('Fail funnel: 2315 words at start, 120 after guess 1, 45 after guess 2, 18 after guess 3, 6 after guess 4, 2 after guess 5, 1 after guess 6')
  })
})
