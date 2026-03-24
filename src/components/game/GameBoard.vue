<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { GuessResult, TileState } from '@/types/game'
import { GamePhase } from '@/types/game'
import GameTile from './GameTile.vue'

const props = defineProps<{
  tileStates: GuessResult[]
  guesses: string[]
  currentInput: string
  activeRow: number
  shakingRow: boolean
  gamePhase?: GamePhase
  answerWord?: string
}>()

const shakeActive = ref(false)
const announceText = ref('')

watch(
  () => props.shakingRow,
  (val) => {
    shakeActive.value = val
  },
  { immediate: true },
)

watch(
  () => props.activeRow,
  (newRow, oldRow) => {
    if (oldRow === undefined || newRow <= oldRow) return
    const rowIdx = newRow - 1
    const guess = props.guesses[rowIdx]
    const tiles = props.tileStates[rowIdx]
    if (!guess || !tiles) return

    const stateNames: Record<string, string> = {
      correct: 'correct',
      present: 'present',
      absent: 'absent',
    }
    const parts = guess
      .split('')
      .map((letter, i) => `${letter.toUpperCase()} ${stateNames[tiles[i]] ?? tiles[i]}`)
    let text = `Row ${newRow}: ${parts.join(', ')}`

    if (props.gamePhase === GamePhase.WON) {
      text += `. Solved in ${newRow} ${newRow === 1 ? 'guess' : 'guesses'}!`
    } else if (props.gamePhase === GamePhase.LOST) {
      text += `. Not solved. The answer was ${props.answerWord?.toUpperCase() ?? 'unknown'}.`
    }

    // Clear then set via nextTick to guarantee screen readers detect the change
    announceText.value = ''
    nextTick(() => {
      announceText.value = text
    })
  },
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
  <div aria-live="polite" aria-atomic="true" class="sr-only" id="board-announcer">{{ announceText }}</div>
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

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

@keyframes row-flash {
  0% { outline-color: transparent; }
  30% { outline-color: var(--color-text-secondary); }
  100% { outline-color: transparent; }
}

@media (prefers-reduced-motion: reduce) {
  .row-shaking {
    animation: row-flash 300ms ease;
    outline: 2px solid transparent;
    outline-offset: -2px;
  }
}
</style>
