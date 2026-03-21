<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  count: number
  isSolveRow: boolean
}>()

const widthPct = computed(() => Math.min(Math.max((props.count / 2315) * 100, 0), 100))

const barStyle = computed(() => ({
  width: `${widthPct.value}%`,
  minWidth: '2px',
  backgroundColor: props.isSolveRow
    ? 'var(--color-accent-streak)'
    : 'var(--color-tile-correct)',
}))

const labelInside = computed(() => widthPct.value >= 5)

const labelText = computed(() => (props.isSolveRow ? `✓ ${props.count}` : `${props.count}`))
</script>

<template>
  <div class="funnel-row">
    <div class="funnel-bar" :style="barStyle">
      <span v-if="labelInside" class="funnel-label funnel-label--inside">{{ labelText }}</span>
    </div>
    <span v-if="!labelInside" class="funnel-label funnel-label--outside">{{ labelText }}</span>
  </div>
</template>

<style scoped>
.funnel-row {
  display: flex;
  align-items: center;
  height: 28px;
  margin-bottom: 4px;
}

.funnel-bar {
  height: 100%;
  display: flex;
  align-items: center;
  overflow: hidden;
  border-radius: 2px;
}

.funnel-label {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.funnel-label--inside {
  padding-left: 6px;
  color: var(--color-text-primary);
}

.funnel-label--outside {
  padding-left: 6px;
  color: var(--color-text-secondary);
}
</style>
