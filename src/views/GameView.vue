<template>
  <main class="game-root">
    <!-- Board placeholder: centered, upper-center of viewport -->
    <div class="board-area">
      <div class="board-placeholder"></div>
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

.board-placeholder {
  width: 350px;
  /* 5×6 grid: 62px tiles + 5px gaps = 350px */
  min-width: 0;
}
</style>
