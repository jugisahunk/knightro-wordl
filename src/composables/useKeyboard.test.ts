import { describe, it, expect, vi, afterEach } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { useKeyboard } from './useKeyboard'

function mountWithKeyboard(onKey: (key: string) => void) {
  const TestComponent = defineComponent({
    setup() {
      useKeyboard(onKey)
    },
    template: '<div />',
  })
  return mount(TestComponent)
}

describe('useKeyboard', () => {
  let wrapper: ReturnType<typeof mountWithKeyboard> | null = null

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
  })

  it('calls onKey with lowercase letter for A–Z key press', () => {
    const onKey = vi.fn()
    wrapper = mountWithKeyboard(onKey)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'A' }))
    expect(onKey).toHaveBeenCalledWith('a')
  })

  it('calls onKey with lowercase for lowercase letter key press', () => {
    const onKey = vi.fn()
    wrapper = mountWithKeyboard(onKey)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }))
    expect(onKey).toHaveBeenCalledWith('z')
  })

  it('calls onKey with "Enter" for Enter key press', () => {
    const onKey = vi.fn()
    wrapper = mountWithKeyboard(onKey)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(onKey).toHaveBeenCalledWith('Enter')
  })

  it('calls onKey with "Backspace" for Backspace key press', () => {
    const onKey = vi.fn()
    wrapper = mountWithKeyboard(onKey)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }))
    expect(onKey).toHaveBeenCalledWith('Backspace')
  })

  it('does not call onKey for digit keys', () => {
    const onKey = vi.fn()
    wrapper = mountWithKeyboard(onKey)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '5' }))
    expect(onKey).not.toHaveBeenCalled()
  })

  it('does not call onKey for arrow keys', () => {
    const onKey = vi.fn()
    wrapper = mountWithKeyboard(onKey)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    expect(onKey).not.toHaveBeenCalled()
  })

  it('does not call onKey for modifier keys', () => {
    const onKey = vi.fn()
    wrapper = mountWithKeyboard(onKey)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
    expect(onKey).not.toHaveBeenCalled()
  })

  it('does not call onKey for F-keys', () => {
    const onKey = vi.fn()
    wrapper = mountWithKeyboard(onKey)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F1' }))
    expect(onKey).not.toHaveBeenCalled()
  })

  it('does not call onKey for repeated keydown events (key held)', () => {
    const onKey = vi.fn()
    wrapper = mountWithKeyboard(onKey)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', repeat: true }))
    expect(onKey).not.toHaveBeenCalled()
  })

  it('does not call onKey for Ctrl+letter combos', () => {
    const onKey = vi.fn()
    wrapper = mountWithKeyboard(onKey)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true }))
    expect(onKey).not.toHaveBeenCalled()
  })

  it('does not call onKey for Meta+letter combos', () => {
    const onKey = vi.fn()
    wrapper = mountWithKeyboard(onKey)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true }))
    expect(onKey).not.toHaveBeenCalled()
  })

  it('stops calling onKey after component unmounts', () => {
    const onKey = vi.fn()
    const w = mountWithKeyboard(onKey)
    w.unmount()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    expect(onKey).not.toHaveBeenCalled()
  })
})
