<script setup lang="ts">
import { watchEffect } from 'vue'
import { RouterView } from 'vue-router'
import { useSettingsStore } from '@/stores/useSettingsStore'

const settingsStore = useSettingsStore()

watchEffect(() => {
  document.documentElement.classList.toggle('deuteranopia', settingsStore.deuteranopia)
})
</script>

<template>
  <RouterView />
</template>
