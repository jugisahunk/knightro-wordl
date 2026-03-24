<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { usePersistenceStore } from '@/stores/usePersistenceStore'
import GameBoard from '@/components/game/GameBoard.vue'
import GameKeyboard from '@/components/game/GameKeyboard.vue'
import { useKeyboard } from '@/composables/useKeyboard'
import { GamePhase } from '@/types/game'
import StreakBadge from '@/components/ui/StreakBadge.vue'
import SettingsPanel from '@/components/ui/SettingsPanel.vue'
import ShortcutOverlay from '@/components/ui/ShortcutOverlay.vue'
import { useAudio } from '@/composables/useAudio'
import { usePostSolveTransition } from '@/composables/usePostSolveTransition'
import PostSolveTransition from '@/components/layout/PostSolveTransition.vue'
import { BOARD_DIM_MS } from '@/constants/timing'

const store = useGameStore()
const settingsStore = useSettingsStore()
const audio = useAudio()
const postSolve = usePostSolveTransition()
const persistenceStore = usePersistenceStore()

const dimMs = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ? 50
  : BOARD_DIM_MS

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

onMounted(() => {
  const date = getTodayUTC()
  const record = persistenceStore.loadGame(date)
  if (record) {
    store.restoreFromRecord(date, record)
  } else {
    store.initGame(date)
  }
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
  if (shortcutOverlayOpen.value || settingsPanelOpen.value) return
  audio.startBackground()
  if (key === 'Enter') {
    store.submitGuess(settingsStore.hardMode)
  } else if (key === 'Backspace') {
    store.deleteLast()
  } else {
    store.typeChar(key)
  }
}

useKeyboard(handleKeyPress)

const settingsPanelOpen = ref(false)
const triggerEl = ref<HTMLButtonElement | null>(null)
const shortcutOverlayOpen = ref(false)

function handleQuestionMark(e: KeyboardEvent) {
  if (e.repeat) return
  if (e.key === '?') {
    if (settingsPanelOpen.value) return
    shortcutOverlayOpen.value = !shortcutOverlayOpen.value
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleQuestionMark)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleQuestionMark)
})
</script>

<template>
  <main class="game-root">
    <p v-if="persistenceStore.storageError" class="storage-error">Unable to load saved data — your progress may be affected</p>
    <div
      class="board-area"
      :style="{ opacity: postSolve.boardDimmed.value ? 0.4 : 1, transition: `opacity ${dimMs}ms ease` }"
    >
      <GameBoard
        :tile-states="store.boardState.tileStates"
        :guesses="store.boardState.guesses"
        :current-input="store.currentInput"
        :active-row="store.activeRow"
        :shaking-row="store.invalidGuessShake"
        :game-phase="store.gamePhase"
        :answer-word="store.answerWord"
      />
      <p
        v-show="store.gamePhase === GamePhase.LOST"
        class="answer-reveal"
        aria-live="polite"
      >{{ store.answerWord.toUpperCase() }}</p>
    </div>
    <PostSolveTransition
      :show-funnel="postSolve.showFunnel.value"
      :show-etymology="postSolve.showEtymology.value"
      :dismiss="postSolve.dismiss"
    />
    <div class="keyboard-area">
      <GameKeyboard :letter-states="letterStates" @key-press="handleKeyPress" />
    </div>
  </main>

  <ShortcutOverlay v-if="shortcutOverlayOpen" v-model="shortcutOverlayOpen" />

  <!-- Top-right reserved corner: StreakBadge + SettingsPanel -->
  <!-- Outside game-root to avoid overflow:hidden breaking position:fixed -->
  <div class="corner-reserved">
    <StreakBadge />
    <button
      ref="triggerEl"
      type="button"
      class="settings-trigger"
      :aria-label="settingsPanelOpen ? 'Close settings' : 'Open settings'"
      @click="settingsPanelOpen = !settingsPanelOpen"
    >⚙</button>
    <SettingsPanel v-if="settingsPanelOpen" v-model="settingsPanelOpen" :trigger-el="triggerEl" />
  </div>
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 10vh;
}

.keyboard-area {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding-bottom: 20px;
}

.storage-error {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.settings-trigger {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  color: var(--color-text-secondary);
  padding: 2px 4px;
  line-height: 1;
  margin-left: 4px;
}

.settings-trigger:hover {
  color: var(--color-text-primary);
}

.answer-reveal {
  text-align: center;
  margin-top: 8px;
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--color-text-secondary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
</style>
