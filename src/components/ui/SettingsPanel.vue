<script setup lang="ts">
import { computed, onMounted, onUnmounted, nextTick, ref } from 'vue'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useGameStore } from '@/stores/useGameStore'

// Props / emits
const props = defineProps<{ modelValue: boolean; triggerEl?: HTMLElement | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

// Store refs
const settingsStore = useSettingsStore()
const gameStore = useGameStore()

// Local reactive state
const panelEl = ref<HTMLElement | null>(null)

// Computed properties
const isHardModeLocked = computed(
  () => gameStore.activeRow > 0 || gameStore.isComplete
)

// Functions / event handlers
function close() {
  props.triggerEl?.focus()
  emit('update:modelValue', false)
}

function handleHardModeToggle() {
  if (!isHardModeLocked.value) {
    settingsStore.setHardMode(!settingsStore.hardMode)
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) {
    close()
    return
  }
  if (e.key === 'Tab') {
    const focusable = Array.from(
      panelEl.value?.querySelectorAll<HTMLElement>('button:not([disabled])') ?? []
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }
}

function onOutsideClick(e: MouseEvent) {
  const target = e.target as Node | null
  if (!target) return
  if (
    panelEl.value &&
    !panelEl.value.contains(target) &&
    !props.triggerEl?.contains(target)
  ) {
    close()
  }
}

// Lifecycle hooks
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  document.addEventListener('mousedown', onOutsideClick)
  nextTick(() => {
    panelEl.value?.querySelector<HTMLElement>('button:not([disabled])')?.focus()
  })
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('mousedown', onOutsideClick)
})
</script>

<template>
  <!-- Panel -->
  <div ref="panelEl" class="settings-panel" role="dialog" aria-modal="true" aria-label="Settings">
    <div class="settings-panel__row">
      <span class="settings-panel__label">Hard mode</span>
      <button
        role="switch"
        aria-label="Hard mode"
        :aria-checked="settingsStore.hardMode"
        :disabled="isHardModeLocked || undefined"
        :aria-disabled="isHardModeLocked || undefined"
        class="settings-panel__toggle"
        :class="{ 'settings-panel__toggle--on': settingsStore.hardMode, 'settings-panel__toggle--locked': isHardModeLocked }"
        @click="handleHardModeToggle"
      />
    </div>
    <p v-if="isHardModeLocked" class="settings-panel__note">
      Available after today's puzzle
    </p>
    <div class="settings-panel__row">
      <span class="settings-panel__label">Color vision</span>
      <button
        role="switch"
        class="settings-panel__toggle"
        :class="{ 'settings-panel__toggle--on': settingsStore.deuteranopia }"
        :aria-checked="settingsStore.deuteranopia"
        aria-label="Deuteranopia colour scheme"
        @click="settingsStore.setDeuteranopia(!settingsStore.deuteranopia)"
      />
    </div>
  </div>
</template>

<style scoped>
.settings-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 220px;
  background-color: var(--color-bg-elevated, #1a1a2e);
  border: 1px solid var(--color-border, #444);
  border-radius: 8px;
  padding: 12px 16px;
  z-index: 51;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.settings-panel__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.settings-panel__label {
  font-size: 0.875rem;
  color: var(--color-text-primary);
}

.settings-panel__toggle {
  width: 40px;
  height: 22px;
  border-radius: 11px;
  border: none;
  cursor: pointer;
  background-color: var(--color-tile-absent, #3a3a3c);
  position: relative;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.settings-panel__toggle::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  transition: transform 0.2s ease;
}

.settings-panel__toggle--on {
  background-color: var(--color-tile-correct, #538d4e);
}

.settings-panel__toggle--on::after {
  transform: translateX(18px);
}

.settings-panel__toggle--locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.settings-panel__note {
  margin-top: 6px;
  margin-bottom: 0;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}
</style>
