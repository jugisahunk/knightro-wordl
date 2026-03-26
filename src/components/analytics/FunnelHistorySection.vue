<script setup lang="ts">
import type { DailyGameRecord } from '@/types/persistence'
import FunnelChart from '@/components/post-solve/FunnelChart.vue'

defineProps<{
  records: DailyGameRecord[]
}>()

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function resultLabel(record: DailyGameRecord): string {
  if (record.solved) {
    return `✓ ${record.guesses.length}/6`
  }
  return '✗ 6/6'
}
</script>

<template>
  <section role="region" aria-label="Funnel History" class="funnel-history" data-testid="funnel-history">
    <h2 class="section-heading">Funnel History</h2>

    <p v-if="records.length === 0" role="status" class="empty-message" data-testid="funnel-empty">
      Play your first puzzle to start building your history.
    </p>

    <div v-else class="funnel-list">
      <div
        v-for="record in records"
        :key="record.date"
        class="funnel-card"
        data-testid="funnel-card"
      >
        <div class="card-header">
          <span class="card-date" data-testid="card-date">{{ formatDate(record.date) }}</span>
          <span
            class="card-result"
            data-testid="card-result"
            :class="record.solved ? 'card-result--solved' : 'card-result--failed'"
          >{{ resultLabel(record) }}</span>
        </div>
        <FunnelChart :funnelData="record.funnelData" :solved="record.solved" />
      </div>

      <p
        v-if="records.length === 1"
        class="more-data-note"
        data-testid="funnel-more-data"
      >Play more puzzles to see trends over time.</p>
    </div>
  </section>
</template>

<style scoped>
.funnel-history {
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

.funnel-card {
  background-color: var(--color-bg-surface);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.card-date {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.card-result {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
}

.card-result--solved {
  color: var(--color-accent-streak);
}

.card-result--failed {
  color: var(--color-text-secondary);
}

.more-data-note {
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  text-align: center;
  margin-top: 4px;
}

</style>
