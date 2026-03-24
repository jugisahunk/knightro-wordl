import { describe, it, expect, vi, afterAll } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// Mock matchMedia to report reduced-motion BEFORE GameTile loads
vi.stubGlobal('matchMedia', (query: string) => ({
  matches: query === '(prefers-reduced-motion: reduce)',
  addListener: vi.fn(),
  removeListener: vi.fn(),
}))

// Dynamic import so the mock is in place when the module evaluates
const { default: GameTile } = await import('./GameTile.vue')

afterAll(() => {
  vi.unstubAllGlobals()
})

describe('GameTile — prefers-reduced-motion: reduce', () => {
  it('changes state immediately without flip animation class when transitioning from filled to correct', async () => {
    const wrapper = mount(GameTile, {
      props: { letter: 'a', state: 'filled', revealIndex: 0 },
    })

    expect(wrapper.classes()).toContain('tile-state-filled')

    await wrapper.setProps({ state: 'correct' })
    await flushPromises()

    // State should change immediately — no tile-flipping class
    expect(wrapper.classes()).not.toContain('tile-flipping')
    expect(wrapper.classes()).toContain('tile-state-correct')
  })

  it('changes state immediately for present tile without flip', async () => {
    const wrapper = mount(GameTile, {
      props: { letter: 'b', state: 'filled', revealIndex: 2 },
    })

    await wrapper.setProps({ state: 'present' })
    await flushPromises()

    expect(wrapper.classes()).not.toContain('tile-flipping')
    expect(wrapper.classes()).toContain('tile-state-present')
  })

  it('changes state immediately for absent tile without flip', async () => {
    const wrapper = mount(GameTile, {
      props: { letter: 'c', state: 'filled', revealIndex: 4 },
    })

    await wrapper.setProps({ state: 'absent' })
    await flushPromises()

    expect(wrapper.classes()).not.toContain('tile-flipping')
    expect(wrapper.classes()).toContain('tile-state-absent')
  })
})
