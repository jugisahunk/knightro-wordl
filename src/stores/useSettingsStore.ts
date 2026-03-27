import { ref } from 'vue'
import { defineStore } from 'pinia'
import { usePersistenceStore } from './usePersistenceStore'

export const useSettingsStore = defineStore('settings', () => {
  const persistenceStore = usePersistenceStore()

  const saved = persistenceStore.loadSettings()
  const hardMode = ref(saved.hardMode)
  const deuteranopia = ref(saved.deuteranopia)
  const musicEnabled = ref(saved.musicEnabled ?? false)
  const theme = ref<'light' | 'dark' | 'system'>(saved.theme ?? 'system')

  function currentSettings() {
    return { hardMode: hardMode.value, deuteranopia: deuteranopia.value, musicEnabled: musicEnabled.value, theme: theme.value }
  }

  function setHardMode(value: boolean): void {
    hardMode.value = value
    persistenceStore.saveSettings({ ...currentSettings(), hardMode: value })
  }

  function setDeuteranopia(value: boolean): void {
    deuteranopia.value = value
    persistenceStore.saveSettings({ ...currentSettings(), deuteranopia: value })
  }

  function setMusicEnabled(value: boolean): void {
    musicEnabled.value = value
    persistenceStore.saveSettings({ ...currentSettings(), musicEnabled: value })
  }

  function setTheme(value: 'light' | 'dark' | 'system'): void {
    theme.value = value
    persistenceStore.saveSettings({ ...currentSettings(), theme: value })
  }

  return { hardMode, deuteranopia, musicEnabled, theme, setHardMode, setDeuteranopia, setMusicEnabled, setTheme }
})
