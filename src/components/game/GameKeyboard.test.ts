import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GameKeyboard from './GameKeyboard.vue'

describe('GameKeyboard', () => {
  describe('layout and structure', () => {
    it('renders 3 rows', () => {
      const wrapper = mount(GameKeyboard, { props: { letterStates: {} } })
      expect(wrapper.findAll('.keyboard-row')).toHaveLength(3)
    })

    it('first row has 10 keys (Q–P)', () => {
      const wrapper = mount(GameKeyboard, { props: { letterStates: {} } })
      const rows = wrapper.findAll('.keyboard-row')
      expect(rows[0].findAll('[role="button"]')).toHaveLength(10)
    })

    it('second row has 9 keys (A–L)', () => {
      const wrapper = mount(GameKeyboard, { props: { letterStates: {} } })
      const rows = wrapper.findAll('.keyboard-row')
      expect(rows[1].findAll('[role="button"]')).toHaveLength(9)
    })

    it('third row has 9 keys (Enter + Z–M + ⌫)', () => {
      const wrapper = mount(GameKeyboard, { props: { letterStates: {} } })
      const rows = wrapper.findAll('.keyboard-row')
      expect(rows[2].findAll('[role="button"]')).toHaveLength(9)
    })

    it('total key count is 28 (26 letters + Enter + ⌫)', () => {
      const wrapper = mount(GameKeyboard, { props: { letterStates: {} } })
      expect(wrapper.findAll('[role="button"]')).toHaveLength(28)
    })

    it('middle row has keyboard-row--middle class', () => {
      const wrapper = mount(GameKeyboard, { props: { letterStates: {} } })
      const rows = wrapper.findAll('.keyboard-row')
      expect(rows[1].classes()).toContain('keyboard-row--middle')
    })

    it('first and third rows do not have keyboard-row--middle class', () => {
      const wrapper = mount(GameKeyboard, { props: { letterStates: {} } })
      const rows = wrapper.findAll('.keyboard-row')
      expect(rows[0].classes()).not.toContain('keyboard-row--middle')
      expect(rows[2].classes()).not.toContain('keyboard-row--middle')
    })
  })

  describe('wide keys', () => {
    it('Enter key has keyboard-key--wide class', () => {
      const wrapper = mount(GameKeyboard, { props: { letterStates: {} } })
      const enterKey = wrapper
        .findAll('[role="button"]')
        .find((k) => k.attributes('aria-label') === 'Enter')
      expect(enterKey?.classes()).toContain('keyboard-key--wide')
    })

    it('Backspace (⌫) key has keyboard-key--wide class', () => {
      const wrapper = mount(GameKeyboard, { props: { letterStates: {} } })
      const delKey = wrapper
        .findAll('[role="button"]')
        .find((k) => k.attributes('aria-label') === 'Delete')
      expect(delKey?.classes()).toContain('keyboard-key--wide')
    })
  })

  describe('letter state propagation', () => {
    it('passes correct state to matching key', () => {
      const wrapper = mount(GameKeyboard, { props: { letterStates: { r: 'correct' } } })
      const rKey = wrapper
        .findAll('[role="button"]')
        .find((k) => k.attributes('aria-label')?.startsWith('R'))
      expect(rKey?.classes()).toContain('keyboard-key--correct')
    })

    it('passes present state to matching key', () => {
      const wrapper = mount(GameKeyboard, { props: { letterStates: { a: 'present' } } })
      const aKey = wrapper
        .findAll('[role="button"]')
        .find((k) => k.attributes('aria-label')?.startsWith('A'))
      expect(aKey?.classes()).toContain('keyboard-key--present')
    })

    it('passes absent state to matching key', () => {
      const wrapper = mount(GameKeyboard, { props: { letterStates: { z: 'absent' } } })
      const zKey = wrapper
        .findAll('[role="button"]')
        .find((k) => k.attributes('aria-label')?.startsWith('Z'))
      expect(zKey?.classes()).toContain('keyboard-key--absent')
    })

    it('unmatched letter key stays default (no state class)', () => {
      const wrapper = mount(GameKeyboard, { props: { letterStates: {} } })
      const qKey = wrapper
        .findAll('[role="button"]')
        .find((k) => k.attributes('aria-label') === 'Q')
      expect(qKey?.classes()).not.toContain('keyboard-key--correct')
      expect(qKey?.classes()).not.toContain('keyboard-key--present')
      expect(qKey?.classes()).not.toContain('keyboard-key--absent')
    })

    it('Enter and Backspace keys are always default state', () => {
      const wrapper = mount(GameKeyboard, {
        props: { letterStates: { enter: 'correct' as never } },
      })
      const enterKey = wrapper
        .findAll('[role="button"]')
        .find((k) => k.attributes('aria-label') === 'Enter')
      expect(enterKey?.classes()).not.toContain('keyboard-key--correct')
    })
  })

  describe('key-press propagation', () => {
    it('emits key-press when a letter key is clicked', async () => {
      const wrapper = mount(GameKeyboard, { props: { letterStates: {} } })
      const aKey = wrapper
        .findAll('[role="button"]')
        .find((k) => k.attributes('aria-label') === 'A')
      await aKey?.trigger('click')
      expect(wrapper.emitted('key-press')).toEqual([['a']])
    })

    it('emits key-press with "Enter" when Enter key clicked', async () => {
      const wrapper = mount(GameKeyboard, { props: { letterStates: {} } })
      const enterKey = wrapper
        .findAll('[role="button"]')
        .find((k) => k.attributes('aria-label') === 'Enter')
      await enterKey?.trigger('click')
      expect(wrapper.emitted('key-press')).toEqual([['Enter']])
    })

    it('emits key-press with "Backspace" when Delete key clicked', async () => {
      const wrapper = mount(GameKeyboard, { props: { letterStates: {} } })
      const delKey = wrapper
        .findAll('[role="button"]')
        .find((k) => k.attributes('aria-label') === 'Delete')
      await delKey?.trigger('click')
      expect(wrapper.emitted('key-press')).toEqual([['Backspace']])
    })
  })
})
