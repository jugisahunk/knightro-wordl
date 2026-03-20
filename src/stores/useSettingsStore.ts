import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', () => {
  const hardMode = ref(false)
  const deuteranopia = ref(false)

  function setHardMode(value: boolean): void {
    hardMode.value = value
  }

  function setDeuteranopia(value: boolean): void {
    deuteranopia.value = value
  }

  return { hardMode, deuteranopia, setHardMode, setDeuteranopia }
})
