import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ShortcutOverlay from './ShortcutOverlay.vue'

describe('ShortcutOverlay', () => {
  function mountOverlay(modelValue = true) {
    return mount(ShortcutOverlay, {
      props: { modelValue },
      attachTo: document.body,
    })
  }

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  describe('rendering', () => {
    it('renders with all 6 shortcut entries', () => {
      const wrapper = mountOverlay()
      const rows = wrapper.findAll('.shortcut-overlay__row')
      expect(rows).toHaveLength(6)
      wrapper.unmount()
    })

    it('displays correct shortcut keys', () => {
      const wrapper = mountOverlay()
      const keys = wrapper.findAll('.shortcut-overlay__key').map((k) => k.text())
      expect(keys).toEqual([
        'A – Z',
        'Enter',
        'Backspace',
        'Space',
        'Escape',
        '?',
      ])
      wrapper.unmount()
    })
  })

  describe('accessibility', () => {
    it('has role="dialog"', () => {
      const wrapper = mountOverlay()
      const dialog = wrapper.find('[role="dialog"]')
      expect(dialog.exists()).toBe(true)
      wrapper.unmount()
    })

    it('has aria-modal="true"', () => {
      const wrapper = mountOverlay()
      const dialog = wrapper.find('[role="dialog"]')
      expect(dialog.attributes('aria-modal')).toBe('true')
      wrapper.unmount()
    })

    it('has aria-label="Keyboard shortcuts"', () => {
      const wrapper = mountOverlay()
      const dialog = wrapper.find('[role="dialog"]')
      expect(dialog.attributes('aria-label')).toBe('Keyboard shortcuts')
      wrapper.unmount()
    })
  })

  describe('dismiss behavior', () => {
    it('pressing Escape emits update:modelValue with false', async () => {
      const wrapper = mountOverlay()
      await wrapper.vm.$nextTick()
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
      wrapper.unmount()
    })

    it('pressing ? does not emit from overlay (parent handles toggle)', async () => {
      const wrapper = mountOverlay()
      await wrapper.vm.$nextTick()
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      wrapper.unmount()
    })

    it('clicking backdrop emits update:modelValue with false', async () => {
      const wrapper = mountOverlay()
      const backdrop = wrapper.find('.shortcut-overlay__backdrop')
      await backdrop.trigger('mousedown')
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
      wrapper.unmount()
    })

    it('clicking inside content block does NOT close overlay', async () => {
      const wrapper = mountOverlay()
      const content = wrapper.find('.shortcut-overlay')
      await content.trigger('mousedown')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      wrapper.unmount()
    })
  })
})
