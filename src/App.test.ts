import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from './App.vue'
import { useSettingsStore } from '@/stores/useSettingsStore'

const mockLoadSettings = vi.hoisted(() =>
  vi.fn().mockReturnValue({ hardMode: false, deuteranopia: false, theme: 'system' }),
)

vi.mock('@/stores/usePersistenceStore', () => ({
  usePersistenceStore: () => ({
    loadSettings: mockLoadSettings,
    saveSettings: vi.fn(),
    loadGame: vi.fn().mockReturnValue(null),
    saveGame: vi.fn(),
    storageError: { value: false },
    loadStreak: vi.fn().mockReturnValue({ count: 0, lastSolvedDate: '' }),
    saveStreak: vi.fn(),
    updateStreakOnWin: vi.fn(),
    updateStreakOnLoss: vi.fn(),
    checkAndMaybeResetStreak: vi.fn(),
  }),
}))

vi.mock('vue-router', () => ({
  RouterView: { template: '<div />' },
  useRouter: () => ({}),
  useRoute: () => ({}),
}))

function mockMatchMedia(matches = false) {
  const listeners: Array<(e: MediaQueryListEvent) => void> = []
  const mql = {
    matches,
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.push(cb),
    removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => {
      const idx = listeners.indexOf(cb)
      if (idx >= 0) listeners.splice(idx, 1)
    },
    dispatchChange(newMatches: boolean) {
      mql.matches = newMatches
      listeners.forEach(cb => cb({ matches: newMatches } as MediaQueryListEvent))
    },
  }
  window.matchMedia = vi.fn().mockReturnValue(mql)
  return mql
}

describe('App.vue deuteranopia watchEffect', () => {
  let pinia: ReturnType<typeof createPinia>
  let wrapper: VueWrapper

  beforeEach(() => {
    document.documentElement.classList.remove('deuteranopia')
    document.documentElement.classList.remove('theme-light')
    mockMatchMedia(true) // default to dark OS
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    wrapper.unmount()
    document.documentElement.classList.remove('deuteranopia')
    document.documentElement.classList.remove('theme-light')
  })

  it('adds deuteranopia class to html when store is set to true', async () => {
    wrapper = mount(App, { global: { plugins: [pinia] } })
    const settingsStore = useSettingsStore()
    settingsStore.setDeuteranopia(true)
    await nextTick()
    expect(document.documentElement.classList.contains('deuteranopia')).toBe(true)
  })

  it('removes deuteranopia class from html when store is set to false', async () => {
    wrapper = mount(App, { global: { plugins: [pinia] } })
    const settingsStore = useSettingsStore()
    settingsStore.setDeuteranopia(true)
    await nextTick()
    settingsStore.setDeuteranopia(false)
    await nextTick()
    expect(document.documentElement.classList.contains('deuteranopia')).toBe(false)
  })

  it('applies persisted deuteranopia preference immediately on mount', async () => {
    mockLoadSettings.mockReturnValueOnce({ hardMode: false, deuteranopia: true, theme: 'system' })
    wrapper = mount(App, { global: { plugins: [pinia] } })
    await nextTick()
    expect(document.documentElement.classList.contains('deuteranopia')).toBe(true)
  })
})

describe('App.vue theme resolution', () => {
  let pinia: ReturnType<typeof createPinia>
  let wrapper: VueWrapper

  beforeEach(() => {
    document.documentElement.classList.remove('theme-light')
    document.documentElement.classList.remove('deuteranopia')
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    wrapper.unmount()
    document.documentElement.classList.remove('theme-light')
    document.documentElement.classList.remove('deuteranopia')
  })

  it('applies theme-light class when theme is set to light', async () => {
    mockMatchMedia(true)
    wrapper = mount(App, { global: { plugins: [pinia] } })
    const settingsStore = useSettingsStore()
    settingsStore.setTheme('light')
    await nextTick()
    expect(document.documentElement.classList.contains('theme-light')).toBe(true)
  })

  it('removes theme-light class when theme is set to dark', async () => {
    mockMatchMedia(false)
    wrapper = mount(App, { global: { plugins: [pinia] } })
    const settingsStore = useSettingsStore()
    settingsStore.setTheme('light')
    await nextTick()
    expect(document.documentElement.classList.contains('theme-light')).toBe(true)
    settingsStore.setTheme('dark')
    await nextTick()
    expect(document.documentElement.classList.contains('theme-light')).toBe(false)
  })

  it('uses OS preference when theme is system — OS light', async () => {
    mockMatchMedia(false) // OS is light (not dark)
    wrapper = mount(App, { global: { plugins: [pinia] } })
    await nextTick()
    expect(document.documentElement.classList.contains('theme-light')).toBe(true)
  })

  it('uses OS preference when theme is system — OS dark', async () => {
    mockMatchMedia(true) // OS is dark
    wrapper = mount(App, { global: { plugins: [pinia] } })
    await nextTick()
    expect(document.documentElement.classList.contains('theme-light')).toBe(false)
  })

  it('responds to OS theme change in real time when set to system', async () => {
    const mql = mockMatchMedia(true) // start dark
    wrapper = mount(App, { global: { plugins: [pinia] } })
    await nextTick()
    expect(document.documentElement.classList.contains('theme-light')).toBe(false)
    mql.dispatchChange(false) // OS switches to light
    await nextTick()
    expect(document.documentElement.classList.contains('theme-light')).toBe(true)
  })
})
