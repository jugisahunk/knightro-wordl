<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import GameBoard from '@/components/game/GameBoard.vue'
import GameKeyboard from '@/components/game/GameKeyboard.vue'

const store = useGameStore()
const settingsStore = useSettingsStore()

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

onMounted(() => {
  store.initGame(getTodayUTC())
})

const letterStates = computed(() => {
  const states: Record<string, 'correct' | 'present' | 'absent'> = {}
  const priority = { correct: 3, present: 2, absent: 1 } as const

  store.boardState.guesses.forEach((guess, rowIdx) => {
    const tileResult = store.boardState.tileStates[rowIdx]
    if (!tileResult) return
    for (let i = 0; i < guess.length; i++) {
      const letter = guess[i].toLowerCase()
      const state = tileResult[i]
      if (state === 'correct' || state === 'present' || state === 'absent') {
        const existing = states[letter]
        if (!existing || priority[state] > priority[existing]) {
          states[letter] = state
        }
      }
    }
  })
  return states
})

function handleKeyPress(key: string): void {
  if (key === 'Enter') {
    store.submitGuess(settingsStore.hardMode)
  } else if (key === 'Backspace') {
    store.deleteLast()
  } else {
    store.typeChar(key)
  }
}
</script>

<template>
  <main class="game-root">
    <div class="board-area">
      <GameBoard
        :tile-states="store.boardState.tileStates"
        :guesses="store.boardState.guesses"
        :current-input="store.currentInput"
        :active-row="store.activeRow"
        :shaking-row="store.invalidGuessShake"
      />
    </div>
    <div class="keyboard-area">
      <GameKeyboard :letter-states="letterStates" @key-press="handleKeyPress" />
    </div>
  </main>

  <!-- Top-right reserved corner: StreakBadge + SettingsPanel wired in 2.5 -->
  <!-- Outside game-root to avoid overflow:hidden breaking position:fixed -->
  <div class="corner-reserved"></div>
</template>

<style scoped>
.game-root {
  min-height: 100vh; /* fallback for older browsers */
  min-height: 100dvh;
  background-color: var(--color-bg-base);
  color: var(--color-text-primary);
  position: relative;
}

.corner-reserved {
  position: fixed;
  top: 16px;
  right: 16px;
  min-width: max-content;
  min-height: max-content;
  z-index: 50;
  /* Reserved region for StreakBadge + SettingsPanel wired in 2.5 */
}

.board-area {
  display: flex;
  justify-content: center;
  padding-top: 10vh;
}

.keyboard-area {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding-bottom: 20px;
}
</style>
