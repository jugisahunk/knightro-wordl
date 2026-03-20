<script setup lang="ts">
import { ref } from 'vue'
import { usePersistenceStore } from '@/stores/usePersistenceStore'

const persistenceStore = usePersistenceStore()
const count = ref(persistenceStore.loadStreak().count)
</script>

<template>
  <div class="streak-badge" role="status" :aria-label="`Current streak: ${count} ${count === 1 ? 'day' : 'days'}`">
    <span :class="count > 0 ? 'streak-count--active' : 'streak-count--zero'">{{ count }}</span>
  </div>
</template>

<style scoped>
.streak-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;
}

.streak-count--active {
  color: var(--color-accent-streak);
  font-weight: 700;
  font-size: 1rem;
}

.streak-count--zero {
  color: var(--color-text-secondary);
  font-weight: 700;
  font-size: 1rem;
}
</style>
