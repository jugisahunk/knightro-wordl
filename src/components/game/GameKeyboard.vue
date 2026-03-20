<script setup lang="ts">
import type { KeyState } from '@/types/game'
import KeyboardKey from './KeyboardKey.vue'

const props = defineProps<{
  letterStates: Record<string, 'correct' | 'present' | 'absent'>
}>()

const emit = defineEmits<{
  'key-press': [key: string]
}>()

const ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['Enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'Backspace'],
] as const

function isLetter(key: string): boolean {
  return key.length === 1
}

function getLabel(key: string): string {
  if (key === 'Backspace') return '⌫'
  if (key.length === 1) return key.toUpperCase()
  return key // 'Enter' stays as 'Enter'
}

function getKeyState(letter: string): KeyState {
  return props.letterStates[letter.toLowerCase()] ?? 'default'
}
</script>

<template>
  <div class="keyboard-container">
    <div
      v-for="(row, rowIdx) in ROWS"
      :key="rowIdx"
      class="keyboard-row"
      :class="{ 'keyboard-row--middle': rowIdx === 1 }"
    >
      <KeyboardKey
        v-for="keyVal in row"
        :key="keyVal"
        :label="getLabel(keyVal)"
        :key-value="keyVal"
        :state="isLetter(keyVal) ? getKeyState(keyVal) : 'default'"
        :wide="keyVal === 'Enter' || keyVal === 'Backspace'"
        @key-press="emit('key-press', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.keyboard-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.keyboard-row {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.keyboard-row--middle {
  padding-left: 22px;
  padding-right: 22px;
}
</style>
