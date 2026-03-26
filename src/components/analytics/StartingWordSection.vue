<script setup lang="ts">
import { computed } from 'vue'
import type { DailyGameRecord } from '@/types/persistence'
import { getStartingWordStats, MIN_GAMES_FOR_STATS } from '@/composables/useAnalyticsData'

const props = defineProps<{
  records: DailyGameRecord[]
}>()

const statsResult = computed(() => getStartingWordStats(props.records))
const stats = computed(() => statsResult.value.stats)
const gamesNeeded = computed(() => {
  const r = statsResult.value
  return r.stats === null ? MIN_GAMES_FOR_STATS - r.validCount : 0
})
</script>

<template>
  <section
    role="region"
    aria-label="Starting Word Effectiveness"
    class="starting-word"
    data-testid="starting-word-section"
  >
    <h2 class="section-heading">Starting Word</h2>

    <p
      v-if="!stats"
      role="status"
      class="empty-message"
      data-testid="starting-word-empty"
    >Play {{ gamesNeeded }} more puzzle{{ gamesNeeded === 1 ? '' : 's' }} to unlock starting word insights.</p>

    <div v-else class="stat-card">
      <div class="stat-group" aria-label="Most used opening word">
        <span class="stat-label">Your go-to opener</span>
        <span class="stat-opener" data-testid="starting-word-opener">{{ stats.mostUsedWord }}</span>
        <span class="stat-label" data-testid="starting-word-opener-count">{{ stats.mostUsedCount }} of {{ stats.totalGames }} games</span>
      </div>

      <div class="stat-group" aria-label="Average words remaining after first guess">
        <span class="stat-label">Average words remaining</span>
        <span class="stat-label">after first guess: <strong class="stat-value" data-testid="starting-word-average">{{ stats.averageRemaining }}</strong></span>
      </div>

      <p class="contextual-hint">(Lower is better — a strong opener eliminates more words)</p>
    </div>
  </section>
</template>

<style scoped>
.starting-word {
  margin-top: 16px;
}

.section-heading {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 12px;
}

.empty-message {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  text-align: center;
  margin-top: 24px;
}

.stat-card {
  background-color: var(--color-bg-surface);
  border-radius: 8px;
  padding: 12px 16px;
}

.stat-group {
  margin-bottom: 12px;
}

.stat-group:last-of-type {
  margin-bottom: 8px;
}

.stat-label {
  display: block;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.stat-opener {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-accent-streak);
  text-transform: uppercase;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.contextual-hint {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-style: italic;
  margin: 0;
}

@media (prefers-reduced-motion: reduce) {
  .starting-word * {
    animation: none !important;
    transition: none !important;
  }
}
</style>
