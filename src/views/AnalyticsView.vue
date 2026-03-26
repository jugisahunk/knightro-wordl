<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAnalyticsData } from '@/composables/useAnalyticsData'
import FunnelHistorySection from '@/components/analytics/FunnelHistorySection.vue'
import StartingWordSection from '@/components/analytics/StartingWordSection.vue'
import PastPuzzleSection from '@/components/analytics/PastPuzzleSection.vue'

const router = useRouter()
const { getAllGameRecords } = useAnalyticsData()

const records = ref(getAllGameRecords())
</script>

<template>
  <main class="analytics-root" data-testid="analytics-root">
    <header class="analytics-header">
      <button
        type="button"
        class="back-button"
        data-testid="back-button"
        aria-label="Back to game"
        @click="router.push('/')"
      >&larr;</button>
      <h1>Analytics</h1>
    </header>

    <section class="analytics-content" data-testid="analytics-content">
      <p v-if="records.length > 0" class="record-count" data-testid="record-count">{{ records.length }} game{{ records.length === 1 ? '' : 's' }} played</p>
      <FunnelHistorySection :records="records" />
      <StartingWordSection :records="records" />
      <PastPuzzleSection :records="records" />
    </section>
  </main>
</template>

<style scoped>
.analytics-root {
  min-height: 100vh;
  min-height: 100dvh;
  background-color: var(--color-bg-base);
  color: var(--color-text-primary);
  padding: 16px;
}

.analytics-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.analytics-header h1 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.back-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  color: var(--color-text-secondary);
  padding: 4px 8px;
  line-height: 1;
}

.back-button:hover {
  color: var(--color-text-primary);
}

.back-button:focus-visible {
  outline: 2px solid var(--color-text-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

.record-count {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}
</style>
