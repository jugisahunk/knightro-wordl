<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { GamePhase } from '@/types/game'
import FunnelChart from '@/components/post-solve/FunnelChart.vue'
import EtymologyCard from '@/components/post-solve/EtymologyCard.vue'
import etymologyJson from '@/data/etymology.json'
import type { EtymologyEntry } from '@/types/etymology'

withDefaults(defineProps<{
  showFunnel: boolean
  showEtymology: boolean
  dismiss: () => void
  horizontal: boolean
}>(), {
  horizontal: false,
})

const gameStore = useGameStore()

const etymologyEntry = computed((): EtymologyEntry | null => {
  const key = gameStore.answerWord.toUpperCase()
  const data = etymologyJson as Record<string, EtymologyEntry>
  return data[key] ?? null
})

const isSolved = computed(() => gameStore.gamePhase === GamePhase.WON)
</script>

<template>
  <div :class="['post-solve-container', { 'post-solve-horizontal': horizontal }]" :data-testid="horizontal ? 'post-solve-horizontal' : undefined">
    <Transition name="funnel">
      <FunnelChart
        v-if="showFunnel"
        :funnel-data="gameStore.funnelData"
        :solved="isSolved"
      />
    </Transition>
    <slot v-if="horizontal" name="center" />
    <Transition name="etymology">
      <EtymologyCard
        v-if="showEtymology"
        :word="gameStore.answerWord"
        :entry="etymologyEntry"
        @dismiss="dismiss"
      />
    </Transition>
  </div>
</template>

<style scoped>
.post-solve-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.post-solve-horizontal {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: start;
  gap: 24px;
  max-height: 100dvh;
  overflow-y: auto;
  padding: 16px;
}

.post-solve-horizontal :deep(.etymology-card) {
  max-width: none;
}

.funnel-enter-active {
  transition: opacity 400ms ease, transform 400ms ease;
}
.funnel-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.funnel-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.etymology-enter-active {
  transition: opacity 400ms ease;
}
.etymology-enter-from {
  opacity: 0;
}
.etymology-enter-to {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .funnel-enter-active,
  .etymology-enter-active {
    transition-duration: 50ms !important;
  }
  .funnel-enter-from {
    transform: none;
  }
}
</style>
