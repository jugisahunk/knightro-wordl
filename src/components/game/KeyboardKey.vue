<script setup lang="ts">
import type { KeyState } from '@/types/game'

const props = withDefaults(
  defineProps<{
    label: string
    keyValue: string
    state: KeyState
    wide?: boolean
  }>(),
  { state: 'default', wide: false },
)

const emit = defineEmits<{
  'key-press': [keyValue: string]
}>()

function handleClick(): void {
  emit('key-press', props.keyValue)
}
</script>

<template>
  <div
    role="button"
    tabindex="0"
    :aria-label="
      state !== 'default'
        ? `${label}, ${state}`
        : keyValue === 'Backspace'
          ? 'Delete'
          : label
    "
    class="keyboard-key"
    :class="{
      'keyboard-key--wide': wide,
      'keyboard-key--correct': state === 'correct',
      'keyboard-key--present': state === 'present',
      'keyboard-key--absent': state === 'absent',
    }"
    @click="handleClick"
    @keydown.enter.prevent="handleClick"
    @keydown.space.prevent="handleClick"
  >
    {{ label }}
  </div>
</template>

<style scoped>
.keyboard-key {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 43px;
  height: 58px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 0.8125rem; /* 13px */
  text-transform: uppercase;
  background-color: var(--color-bg-surface);
  color: var(--color-text-primary);
  transition:
    filter 0.1s,
    transform 0.1s;
}

.keyboard-key--wide {
  min-width: 65px;
}

.keyboard-key--correct {
  background-color: var(--color-tile-correct);
}

.keyboard-key--present {
  background-color: var(--color-tile-present);
}

.keyboard-key--absent {
  background-color: var(--color-tile-absent);
}

.keyboard-key:hover {
  filter: brightness(1.2);
}

.keyboard-key:active {
  transform: scale(0.95);
}

@media (prefers-reduced-motion: reduce) {
  .keyboard-key {
    transition: none;
  }
  .keyboard-key:active {
    transform: none;
  }
}
</style>
