<script setup lang="ts">
import { computed } from 'vue'
import FunnelBar from './FunnelBar.vue'

const props = defineProps<{
  funnelData: number[]
  solved: boolean
}>()

const ariaLabel = computed(() => {
  const prefix = props.solved ? 'Solve funnel' : 'Fail funnel'
  const parts: string[] = [`${prefix}: 2315 words at start`]

  props.funnelData.forEach((count, index) => {
    const guessNum = index + 1
    const isLast = index === props.funnelData.length - 1
    if (props.solved && isLast) {
      parts.push(`solved on guess ${guessNum}`)
    } else {
      parts.push(`${count} after guess ${guessNum}`)
    }
  })

  return parts.join(', ')
})
</script>

<template>
  <div role="img" :aria-label="ariaLabel" class="funnel-chart">
    <FunnelBar
      v-for="(count, index) in funnelData"
      :key="index"
      :count="count"
      :isSolveRow="solved && index === funnelData.length - 1"
    />
  </div>
</template>

<style scoped>
.funnel-chart {
  width: 100%;
  padding: 8px 0;
}
</style>
