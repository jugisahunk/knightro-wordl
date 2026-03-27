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

  describe('musicEnabled initialization', () => {
    it('initializes musicEnabled to false when no stored settings', () => {
      const store = useSettingsStore()
      expect(store.musicEnabled).toBe(false)
    })

    it('initializes musicEnabled from persisted settings', () => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ hardMode: false, deuteranopia: false, musicEnabled: true }))
      const store = useSettingsStore()
      expect(store.musicEnabled).toBe(true)
    })

    it('defaults musicEnabled to false when field is missing from stored settings', () => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ hardMode: true, deuteranopia: false }))
      const store = useSettingsStore()
      expect(store.musicEnabled).toBe(false)
    })
  })

  describe('setMusicEnabled', () => {
    it('updates musicEnabled ref', () => {
      const store = useSettingsStore()
      store.setMusicEnabled(true)
      expect(store.musicEnabled).toBe(true)
    })

    it('persists musicEnabled to localStorage via saveSettings', () => {
      const store = useSettingsStore()
      store.setMusicEnabled(true)
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)!)
      expect(saved.musicEnabled).toBe(true)
    })

    it('preserves hardMode and deuteranopia values when saving musicEnabled', () => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ hardMode: true, deuteranopia: true, musicEnabled: false }))
      const store = useSettingsStore()
      store.setMusicEnabled(true)
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)!)
      expect(saved.hardMode).toBe(true)
      expect(saved.deuteranopia).toBe(true)
    })

    it('toggles musicEnabled off after being set on', () => {
      const store = useSettingsStore()
      store.setMusicEnabled(true)
      store.setMusicEnabled(false)
      expect(store.musicEnabled).toBe(false)
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)!)
      expect(saved.musicEnabled).toBe(false)
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

  describe('theme initialization', () => {
    it('initializes theme to system when no stored settings', () => {
      const store = useSettingsStore()
      expect(store.theme).toBe('system')
    })

    it('initializes theme from persisted settings', () => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ hardMode: false, deuteranopia: false, theme: 'dark' }))
      const store = useSettingsStore()
      expect(store.theme).toBe('dark')
    })

    it('defaults theme to system when field is missing from stored settings', () => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ hardMode: true, deuteranopia: false }))
      const store = useSettingsStore()
      expect(store.theme).toBe('system')
    })
  })

  describe('setTheme', () => {
    it('updates theme ref', () => {
      const store = useSettingsStore()
      store.setTheme('light')
      expect(store.theme).toBe('light')
    })

    it('persists theme to localStorage via saveSettings', () => {
      const store = useSettingsStore()
      store.setTheme('dark')
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)!)
      expect(saved.theme).toBe('dark')
    })

    it('preserves other settings when saving theme', () => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ hardMode: true, deuteranopia: true, musicEnabled: true }))
      const store = useSettingsStore()
      store.setTheme('light')
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)!)
      expect(saved.hardMode).toBe(true)
      expect(saved.deuteranopia).toBe(true)
      expect(saved.musicEnabled).toBe(true)
    })

    it('accepts all three theme values', () => {
      const store = useSettingsStore()
      store.setTheme('light')
      expect(store.theme).toBe('light')
      store.setTheme('dark')
      expect(store.theme).toBe('dark')
      store.setTheme('system')
      expect(store.theme).toBe('system')
    })
  })
})
