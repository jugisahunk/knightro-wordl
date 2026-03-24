import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from './App.vue'
import { useSettingsStore } from '@/stores/useSettingsStore'

const mockLoadSettings = vi.hoisted(() =>
  vi.fn().mockReturnValue({ hardMode: false, deuteranopia: false }),
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

describe('App.vue deuteranopia watchEffect', () => {
  let pinia: ReturnType<typeof createPinia>
  let wrapper: VueWrapper

  beforeEach(() => {
    document.documentElement.classList.remove('deuteranopia')
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    wrapper.unmount()
    document.documentElement.classList.remove('deuteranopia')
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
    mockLoadSettings.mockReturnValueOnce({ hardMode: false, deuteranopia: true })
    wrapper = mount(App, { global: { plugins: [pinia] } })
    await nextTick()
    expect(document.documentElement.classList.contains('deuteranopia')).toBe(true)
  })
})
