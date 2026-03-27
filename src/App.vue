<script setup lang="ts">
import { ref, computed, watchEffect, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import { useSettingsStore } from '@/stores/useSettingsStore'

const settingsStore = useSettingsStore()

// OS dark mode detection
const mql = window.matchMedia('(prefers-color-scheme: dark)')
const osDark = ref(mql.matches)
const handleSchemeChange = (e: MediaQueryListEvent) => { osDark.value = e.matches }
mql.addEventListener('change', handleSchemeChange)
onUnmounted(() => mql.removeEventListener('change', handleSchemeChange))

const resolvedTheme = computed(() => {
  if (settingsStore.theme === 'system') return osDark.value ? 'dark' : 'light'
  return settingsStore.theme
})

watchEffect(() => {
  document.documentElement.classList.toggle('theme-light', resolvedTheme.value === 'light')
  const metaTheme = document.querySelector('meta[name="theme-color"]')
  if (metaTheme) {
    metaTheme.setAttribute('content', resolvedTheme.value === 'light' ? '#f5f5f7' : '#111118')
  }
})

watchEffect(() => {
  document.documentElement.classList.toggle('deuteranopia', settingsStore.deuteranopia)
})
</script>

<template>
  <RouterView />
</template>
