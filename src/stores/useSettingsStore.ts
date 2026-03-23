import { ref } from 'vue'
import { defineStore } from 'pinia'
import { usePersistenceStore } from './usePersistenceStore'

export const useSettingsStore = defineStore('settings', () => {
  const persistenceStore = usePersistenceStore()

  const saved = persistenceStore.loadSettings()
  const hardMode = ref(saved.hardMode)
  const deuteranopia = ref(saved.deuteranopia)

  function setHardMode(value: boolean): void {
    hardMode.value = value
    persistenceStore.saveSettings({ hardMode: value, deuteranopia: deuteranopia.value })
  }

  function setDeuteranopia(value: boolean): void {
    deuteranopia.value = value
    persistenceStore.saveSettings({ hardMode: hardMode.value, deuteranopia: value })
  }

  return { hardMode, deuteranopia, setHardMode, setDeuteranopia }
})
