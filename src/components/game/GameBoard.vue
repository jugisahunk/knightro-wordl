<script setup lang="ts">
import { ref, watch } from 'vue'
import type { GuessResult, TileState } from '@/types/game'
import GameTile from './GameTile.vue'

const props = defineProps<{
  tileStates: GuessResult[]
  guesses: string[]
  currentInput: string
  activeRow: number
  shakingRow: boolean
}>()

const shakeActive = ref(false)

watch(
  () => props.shakingRow,
  (val) => {
    shakeActive.value = val
  },
  { immediate: true },
)

function getRowLetter(rowIndex: number, colIndex: number): string {
  if (rowIndex < props.activeRow) {
    return props.guesses[rowIndex]?.[colIndex] ?? ''
  }
  if (rowIndex === props.activeRow) {
    return props.currentInput[colIndex] ?? ''
  }
  return ''
}

function getTileState(rowIndex: number, colIndex: number): TileState {
  if (rowIndex < props.activeRow) {
    return props.tileStates[rowIndex]?.[colIndex] ?? 'empty'
  }
  if (rowIndex === props.activeRow) {
    return props.currentInput[colIndex] ? 'filled' : 'empty'
  }
  return 'empty'
}
</script>

<template>
  <div role="grid" aria-label="Myrdl game board" class="game-board">
    <div
      v-for="rowIndex in 6"
      :key="rowIndex"
      role="row"
      :class="{ 'row-shaking': shakeActive && rowIndex - 1 === activeRow }"
      class="board-row"
      @animationend="shakeActive = false"
    >
      <GameTile
        v-for="colIndex in 5"
        :key="colIndex"
        :letter="getRowLetter(rowIndex - 1, colIndex - 1)"
        :state="getTileState(rowIndex - 1, colIndex - 1)"
        :reveal-index="colIndex - 1"
      />
    </div>
  </div>
  <div aria-live="polite" aria-atomic="true" class="sr-only" id="board-announcer"></div>
</template>

<style scoped>
.game-board {
  display: grid;
  grid-template-rows: repeat(6, 62px);
  gap: 5px;
}

.board-row {
  display: flex;
  gap: 5px;
  perspective: 250px;
}

/* Shake animation */
@keyframes row-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-6px);
  }
  40% {
    transform: translateX(6px);
  }
  60% {
    transform: translateX(-4px);
  }
  80% {
    transform: translateX(4px);
  }
}

.row-shaking {
  animation: row-shake 300ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .row-shaking {
    animation: none;
    outline: 2px solid var(--color-text-secondary);
  }
}
</style>
