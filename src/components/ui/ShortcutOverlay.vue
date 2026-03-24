<script setup lang="ts">
import { onMounted, onUnmounted, nextTick, ref } from 'vue'

// Props / emits
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

// Refs
const overlayEl = ref<HTMLElement | null>(null)
const previouslyFocused = ref<HTMLElement | null>(null)

// Functions
function restoreFocus() {
  previouslyFocused.value?.focus()
  previouslyFocused.value = null
}

function close() {
  restoreFocus()
  emit('update:modelValue', false)
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) {
    e.stopImmediatePropagation()
    close()
    return
  }
  if (e.key === 'Tab') {
    // Focus trap: keep focus within overlay
    const focusable = Array.from(
      overlayEl.value?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) ?? []
    )
    if (focusable.length === 0) {
      e.preventDefault()
      return
    }
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

function onBackdropClick(e: MouseEvent) {
  const target = e.target as HTMLElement | null
  if (target?.classList.contains('shortcut-overlay__backdrop')) {
    close()
  }
}

// Lifecycle
onMounted(() => {
  previouslyFocused.value = document.activeElement as HTMLElement | null
  window.addEventListener('keydown', handleKeyDown)
  nextTick(() => {
    overlayEl.value?.focus()
  })
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  restoreFocus()
})
</script>

<template>
  <div
    class="shortcut-overlay__backdrop"
    @mousedown="onBackdropClick"
  >
    <div
      ref="overlayEl"
      class="shortcut-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      tabindex="-1"
    >
      <p class="shortcut-overlay__title">Keyboard Shortcuts</p>
      <table class="shortcut-overlay__table">
        <tbody>
          <tr class="shortcut-overlay__row">
            <td class="shortcut-overlay__key">A – Z</td>
            <td class="shortcut-overlay__action">Type letter</td>
          </tr>
          <tr class="shortcut-overlay__row">
            <td class="shortcut-overlay__key">Enter</td>
            <td class="shortcut-overlay__action">Submit guess / advance post-solve</td>
          </tr>
          <tr class="shortcut-overlay__row">
            <td class="shortcut-overlay__key">Backspace</td>
            <td class="shortcut-overlay__action">Delete last letter</td>
          </tr>
          <tr class="shortcut-overlay__row">
            <td class="shortcut-overlay__key">Space</td>
            <td class="shortcut-overlay__action">Advance post-solve</td>
          </tr>
          <tr class="shortcut-overlay__row">
            <td class="shortcut-overlay__key">Escape</td>
            <td class="shortcut-overlay__action">Return to board</td>
          </tr>
          <tr class="shortcut-overlay__row">
            <td class="shortcut-overlay__key">?</td>
            <td class="shortcut-overlay__action">Show / hide shortcuts</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.shortcut-overlay__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: shortcut-overlay-fade-in 150ms ease-in;
}

.shortcut-overlay {
  max-width: 360px;
  width: 90%;
  background-color: var(--color-bg-surface);
  border-radius: 12px;
  padding: 24px;
  outline: none;
}

.shortcut-overlay__title {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-secondary);
  margin: 0 0 16px;
}

.shortcut-overlay__table {
  width: 100%;
  border-collapse: collapse;
}

.shortcut-overlay__row td {
  padding: 6px 0;
}

.shortcut-overlay__key {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  width: 100px;
}

.shortcut-overlay__action {
  font-size: 13px;
  color: var(--color-text-secondary);
}

@keyframes shortcut-overlay-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .shortcut-overlay__backdrop {
    animation: none;
  }
}
</style>
