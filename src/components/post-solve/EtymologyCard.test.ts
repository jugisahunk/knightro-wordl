import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EtymologyCard from './EtymologyCard.vue'
import type { EtymologyEntry } from '@/types/etymology'

const sampleEntry: EtymologyEntry = {
  pos: 'noun',
  definition: 'A small dwelling or shelter.',
  origin: 'Old English "hūs"',
}

describe('EtymologyCard', () => {
  // 2.1: word text renders uppercase
  it('renders word text', () => {
    const wrapper = mount(EtymologyCard, {
      props: { word: 'HOUSE', entry: sampleEntry },
    })
    expect(wrapper.find('.etymology-word').text()).toContain('HOUSE')
  })

  // 2.2: pos, definition, origin render with valid entry
  it('renders pos, definition, and origin with valid entry', () => {
    const wrapper = mount(EtymologyCard, {
      props: { word: 'HOUSE', entry: sampleEntry },
    })
    expect(wrapper.find('.etymology-pos').text()).toContain('noun')
    expect(wrapper.find('.etymology-definition').text()).toContain('A small dwelling or shelter.')
    expect(wrapper.find('.etymology-origin').text()).toContain('Old English')
  })

  // 2.3: null entry shows fallback; pos and definition elements absent
  it('shows fallback text and hides pos/definition when entry is null', () => {
    const wrapper = mount(EtymologyCard, {
      props: { word: 'BLURP', entry: null },
    })
    expect(wrapper.find('.etymology-origin').text()).toBe(
      'No etymology on record for this word.',
    )
    expect(wrapper.find('.etymology-pos').exists()).toBe(false)
    expect(wrapper.find('.etymology-definition').exists()).toBe(false)
  })

  // 2.4: Escape key emits dismiss
  it('emits dismiss on Escape key', async () => {
    const wrapper = mount(EtymologyCard, {
      props: { word: 'HOUSE', entry: sampleEntry },
    })
    await wrapper.find('[role="article"]').trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('dismiss')).toBeTruthy()
  })

  // 2.5: Enter key emits dismiss
  it('emits dismiss on Enter key', async () => {
    const wrapper = mount(EtymologyCard, {
      props: { word: 'HOUSE', entry: sampleEntry },
    })
    await wrapper.find('[role="article"]').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('dismiss')).toBeTruthy()
  })

  // 2.6: click on backdrop emits dismiss
  it('emits dismiss when backdrop is clicked', async () => {
    const wrapper = mount(EtymologyCard, {
      props: { word: 'HOUSE', entry: sampleEntry },
    })
    await wrapper.find('.etymology-backdrop').trigger('click')
    expect(wrapper.emitted('dismiss')).toBeTruthy()
  })

  // 2.6b: click on card itself does NOT emit dismiss (click.self guard)
  it('does not emit dismiss when card itself is clicked', async () => {
    const wrapper = mount(EtymologyCard, {
      props: { word: 'HOUSE', entry: sampleEntry },
    })
    await wrapper.find('.etymology-card').trigger('click')
    expect(wrapper.emitted('dismiss')).toBeFalsy()
  })

  // 2.7: role="article" on inner card
  it('has role="article" on the card element', () => {
    const wrapper = mount(EtymologyCard, {
      props: { word: 'HOUSE', entry: sampleEntry },
    })
    expect(wrapper.find('[role="article"]').exists()).toBe(true)
  })

  // 2.8: aria-label contains "Etymology for " + word
  it('has aria-label containing "Etymology for HOUSE"', () => {
    const wrapper = mount(EtymologyCard, {
      props: { word: 'HOUSE', entry: sampleEntry },
    })
    const card = wrapper.find('[role="article"]')
    const label = card.attributes('aria-label') ?? ''
    expect(label.toLowerCase()).toContain('etymology for house')
  })
})
