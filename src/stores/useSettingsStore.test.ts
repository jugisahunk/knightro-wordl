import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from './useSettingsStore'

const SETTINGS_KEY = 'myrdle_settings'

describe('useSettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  describe('initialization from persisted settings', () => {
    it('initializes hardMode to false when no stored settings', () => {
      const store = useSettingsStore()
      expect(store.hardMode).toBe(false)
    })

    it('initializes deuteranopia to false when no stored settings', () => {
      const store = useSettingsStore()
      expect(store.deuteranopia).toBe(false)
    })

    it('initializes hardMode from persisted settings', () => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ hardMode: true, deuteranopia: false }))
      const store = useSettingsStore()
      expect(store.hardMode).toBe(true)
    })

    it('initializes deuteranopia from persisted settings', () => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ hardMode: false, deuteranopia: true }))
      const store = useSettingsStore()
      expect(store.deuteranopia).toBe(true)
    })

    it('initializes both flags from persisted settings', () => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ hardMode: true, deuteranopia: true }))
      const store = useSettingsStore()
      expect(store.hardMode).toBe(true)
      expect(store.deuteranopia).toBe(true)
    })
  })

  describe('setHardMode', () => {
    it('updates hardMode ref', () => {
      const store = useSettingsStore()
      store.setHardMode(true)
      expect(store.hardMode).toBe(true)
    })

    it('persists hardMode to localStorage via saveSettings', () => {
      const store = useSettingsStore()
      store.setHardMode(true)
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)!)
      expect(saved.hardMode).toBe(true)
    })

    it('preserves deuteranopia value when saving hardMode', () => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ hardMode: false, deuteranopia: true }))
      const store = useSettingsStore()
      store.setHardMode(true)
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)!)
      expect(saved.deuteranopia).toBe(true)
    })
  })

  describe('setDeuteranopia', () => {
    it('updates deuteranopia ref', () => {
      const store = useSettingsStore()
      store.setDeuteranopia(true)
      expect(store.deuteranopia).toBe(true)
    })

    it('persists deuteranopia to localStorage via saveSettings', () => {
      const store = useSettingsStore()
      store.setDeuteranopia(true)
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)!)
      expect(saved.deuteranopia).toBe(true)
    })

    it('preserves hardMode value when saving deuteranopia', () => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ hardMode: true, deuteranopia: false }))
      const store = useSettingsStore()
      store.setDeuteranopia(true)
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)!)
      expect(saved.hardMode).toBe(true)
    })
  })
})
