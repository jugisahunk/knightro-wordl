<script setup lang="ts">
import { onMounted } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import GameBoard from '@/components/game/GameBoard.vue'

const store = useGameStore()

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

onMounted(() => {
  store.initGame(getTodayUTC())
})
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
</style>
