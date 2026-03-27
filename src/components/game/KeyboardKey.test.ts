import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import KeyboardKey from './KeyboardKey.vue'

describe('KeyboardKey', () => {
  describe('role and rendering', () => {
    it('has role="button"', () => {
      const wrapper = mount(KeyboardKey, { props: { label: 'Q', keyValue: 'q', state: 'default' } })
      expect(wrapper.attributes('role')).toBe('button')
    })

    it('renders the label text', () => {
      const wrapper = mount(KeyboardKey, { props: { label: 'Q', keyValue: 'q', state: 'default' } })
      expect(wrapper.text()).toBe('Q')
    })
  })

  describe('aria-label', () => {
    it('default letter key has aria-label equal to label', () => {
      const wrapper = mount(KeyboardKey, { props: { label: 'Q', keyValue: 'q', state: 'default' } })
      expect(wrapper.attributes('aria-label')).toBe('Q')
    })

    it('correct state key has aria-label with state appended', () => {
      const wrapper = mount(KeyboardKey, { props: { label: 'R', keyValue: 'r', state: 'correct' } })
      expect(wrapper.attributes('aria-label')).toBe('R, correct')
    })

    it('present state key has aria-label with state appended', () => {
      const wrapper = mount(KeyboardKey, { props: { label: 'A', keyValue: 'a', state: 'present' } })
      expect(wrapper.attributes('aria-label')).toBe('A, present')
    })

    it('absent state key has aria-label with state appended', () => {
      const wrapper = mount(KeyboardKey, { props: { label: 'B', keyValue: 'b', state: 'absent' } })
      expect(wrapper.attributes('aria-label')).toBe('B, absent')
    })

    it('Enter key has aria-label "Enter"', () => {
      const wrapper = mount(KeyboardKey, {
        props: { label: 'Enter', keyValue: 'Enter', state: 'default' },
      })
      expect(wrapper.attributes('aria-label')).toBe('Enter')
    })

    it('Backspace key has aria-label "Delete"', () => {
      const wrapper = mount(KeyboardKey, {
        props: { label: '⌫', keyValue: 'Backspace', state: 'default' },
      })
      expect(wrapper.attributes('aria-label')).toBe('Delete')
    })
  })

  describe('CSS classes per state', () => {
    it('default state has no state modifier class', () => {
      const wrapper = mount(KeyboardKey, { props: { label: 'Q', keyValue: 'q', state: 'default' } })
      expect(wrapper.classes()).not.toContain('keyboard-key--correct')
      expect(wrapper.classes()).not.toContain('keyboard-key--present')
      expect(wrapper.classes()).not.toContain('keyboard-key--absent')
    })

    it('correct state has keyboard-key--correct class', () => {
      const wrapper = mount(KeyboardKey, { props: { label: 'R', keyValue: 'r', state: 'correct' } })
      expect(wrapper.classes()).toContain('keyboard-key--correct')
    })

    it('present state has keyboard-key--present class', () => {
      const wrapper = mount(KeyboardKey, { props: { label: 'A', keyValue: 'a', state: 'present' } })
      expect(wrapper.classes()).toContain('keyboard-key--present')
    })

    it('absent state has keyboard-key--absent class', () => {
      const wrapper = mount(KeyboardKey, { props: { label: 'B', keyValue: 'b', state: 'absent' } })
      expect(wrapper.classes()).toContain('keyboard-key--absent')
    })
  })

  describe('key color hierarchy', () => {
    it('default (unused) key does not have keyboard-key--absent class', () => {
      const wrapper = mount(KeyboardKey, { props: { label: 'Q', keyValue: 'q', state: 'default' } })
      expect(wrapper.classes()).not.toContain('keyboard-key--absent')
    })

    it('absent key has keyboard-key--absent class', () => {
      const wrapper = mount(KeyboardKey, { props: { label: 'B', keyValue: 'b', state: 'absent' } })
      expect(wrapper.classes()).toContain('keyboard-key--absent')
    })
  })

  describe('wide variant', () => {
    it('wide=true adds keyboard-key--wide class', () => {
      const wrapper = mount(KeyboardKey, {
        props: { label: 'Enter', keyValue: 'Enter', state: 'default', wide: true },
      })
      expect(wrapper.classes()).toContain('keyboard-key--wide')
    })

    it('wide=false (default) does not add keyboard-key--wide class', () => {
      const wrapper = mount(KeyboardKey, { props: { label: 'Q', keyValue: 'q', state: 'default' } })
      expect(wrapper.classes()).not.toContain('keyboard-key--wide')
    })
  })

  describe('click emission', () => {
    it('emits key-press with keyValue on click', async () => {
      const wrapper = mount(KeyboardKey, { props: { label: 'A', keyValue: 'a', state: 'default' } })
      await wrapper.trigger('click')
      expect(wrapper.emitted('key-press')).toEqual([['a']])
    })

    it('emits key-press with Enter keyValue', async () => {
      const wrapper = mount(KeyboardKey, {
        props: { label: 'Enter', keyValue: 'Enter', state: 'default', wide: true },
      })
      await wrapper.trigger('click')
      expect(wrapper.emitted('key-press')).toEqual([['Enter']])
    })

    it('emits key-press with Backspace keyValue', async () => {
      const wrapper = mount(KeyboardKey, {
        props: { label: '⌫', keyValue: 'Backspace', state: 'default', wide: true },
      })
      await wrapper.trigger('click')
      expect(wrapper.emitted('key-press')).toEqual([['Backspace']])
    })

    it('emits key-press multiple times on multiple clicks', async () => {
      const wrapper = mount(KeyboardKey, { props: { label: 'Z', keyValue: 'z', state: 'default' } })
      await wrapper.trigger('click')
      await wrapper.trigger('click')
      expect(wrapper.emitted('key-press')).toHaveLength(2)
      expect(wrapper.emitted('key-press')).toEqual([['z'], ['z']])
    })
  })
})
