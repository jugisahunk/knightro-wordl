import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SettingsPanel from './SettingsPanel.vue'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useGameStore } from '@/stores/useGameStore'

const SETTINGS_KEY = 'myrdle_settings'

describe('SettingsPanel', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    localStorage.clear()
  })

  function mountPanel(modelValue = true) {
    return mount(SettingsPanel, {
      props: { modelValue },
      global: { plugins: [pinia] },
    })
  }

  describe('rendering', () => {
    it('renders settings-panel element', () => {
      const wrapper = mountPanel()
      expect(wrapper.find('.settings-panel').exists()).toBe(true)
    })

    it('renders hard mode toggle button with role="switch"', () => {
      const wrapper = mountPanel()
      const btn = wrapper.find('button[role="switch"]')
      expect(btn.exists()).toBe(true)
    })

    it('reflects hardMode false in aria-checked when store is false', () => {
      const wrapper = mountPanel()
      const btn = wrapper.find('button[role="switch"]')
      expect(btn.attributes('aria-checked')).toBe('false')
    })

    it('reflects hardMode true in aria-checked when store is true', () => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ hardMode: true, deuteranopia: false }))
      const wrapper = mountPanel()
      const btn = wrapper.find('button[role="switch"]')
      expect(btn.attributes('aria-checked')).toBe('true')
    })
  })

  describe('hard mode toggle — unlocked state', () => {
    it('toggle is enabled when no puzzle in progress (activeRow === 0)', async () => {
      const wrapper = mountPanel()
      const gameStore = useGameStore()
      // activeRow defaults to 0
      expect(gameStore.activeRow).toBe(0)
      await nextTick()
      const btn = wrapper.find('button[role="switch"]')
      expect(btn.attributes('disabled')).toBeUndefined()
    })

    it('clicking toggle calls setHardMode with toggled value', async () => {
      const wrapper = mountPanel()
      const settingsStore = useSettingsStore()
      expect(settingsStore.hardMode).toBe(false)
      await wrapper.find('button[role="switch"]').trigger('click')
      expect(settingsStore.hardMode).toBe(true)
    })

    it('clicking toggle persists to localStorage', async () => {
      const wrapper = mountPanel()
      await wrapper.find('button[role="switch"]').trigger('click')
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)!)
      expect(saved.hardMode).toBe(true)
    })
  })

  describe('hard mode toggle — locked state', () => {
    it('shows "Available after today\'s puzzle" note when puzzle in progress', async () => {
      const wrapper = mountPanel()
      const gameStore = useGameStore()
      // Simulate puzzle in progress
      gameStore.activeRow = 1
      await nextTick()
      expect(wrapper.text()).toContain("Available after today's puzzle")
    })

    it('toggle is disabled when puzzle in progress (activeRow > 0)', async () => {
      const wrapper = mountPanel()
      const gameStore = useGameStore()
      gameStore.activeRow = 1
      await nextTick()
      const btn = wrapper.find('button[role="switch"]')
      expect(btn.attributes('disabled')).toBeDefined()
    })

    it('does not show note when no puzzle in progress', () => {
      const wrapper = mountPanel()
      expect(wrapper.text()).not.toContain("Available after today's puzzle")
    })

    it('clicking locked toggle does not change hardMode', async () => {
      const wrapper = mountPanel()
      const gameStore = useGameStore()
      const settingsStore = useSettingsStore()
      gameStore.activeRow = 1
      await nextTick()
      await wrapper.find('button[role="switch"]').trigger('click')
      expect(settingsStore.hardMode).toBe(false)
    })
  })

  describe('dismiss behavior', () => {
    it('emits update:modelValue false on outside mousedown', async () => {
      const wrapper = mountPanel()
      const event = new MouseEvent('mousedown', { bubbles: true })
      document.dispatchEvent(event)
      await nextTick()
      expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    })

    it('emits update:modelValue false on Escape key', async () => {
      const wrapper = mountPanel()
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      window.dispatchEvent(event)
      await nextTick()
      expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    })
  })
})
