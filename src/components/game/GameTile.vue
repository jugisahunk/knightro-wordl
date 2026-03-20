<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import type { TileState } from '@/types/game'
import { TILE_FLIP_MS, TILE_STAGGER_MS } from '@/constants/timing'

const props = defineProps<{
  letter: string
  state: TileState
  revealIndex: number
}>()

const isFlipping = ref(false)
const displayState = ref<TileState>(props.state)

const revealedStates: TileState[] = ['correct', 'present', 'absent']

const prefersReducedMotion =
  typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

let pendingTimers: ReturnType<typeof setTimeout>[] = []

watch(
  () => props.state,
  (newState, oldState) => {
    pendingTimers.forEach(clearTimeout)
    pendingTimers = []

    if (oldState === 'filled' && revealedStates.includes(newState)) {
      if (prefersReducedMotion) {
        displayState.value = newState
        return
      }
      const delay = props.revealIndex * TILE_STAGGER_MS
      const t1 = setTimeout(() => {
        isFlipping.value = true
        const t2 = setTimeout(() => {
          displayState.value = newState
        }, TILE_FLIP_MS / 2)
        const t3 = setTimeout(() => {
          isFlipping.value = false
        }, TILE_FLIP_MS)
        pendingTimers.push(t2, t3)
      }, delay)
      pendingTimers.push(t1)
    } else {
      displayState.value = newState
    }
  },
)

onUnmounted(() => {
  pendingTimers.forEach(clearTimeout)
  pendingTimers = []
})
</script>

<template>
  <div
    class="game-tile"
    :class="[`tile-state-${displayState}`, { 'tile-flipping': isFlipping }]"
    :aria-hidden="displayState === 'empty' || displayState === 'filled' ? 'true' : undefined"
    :aria-label="
      letter && revealedStates.includes(displayState)
        ? `${letter.toUpperCase()}, ${displayState}`
        : undefined
    "
    role="gridcell"
  >
    <span v-if="letter" class="tile-letter">{{ letter.toUpperCase() }}</span>
  </div>
</template>

<style scoped>
.game-tile {
  width: 62px;
  height: 62px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-tile-border-empty);
  background-color: var(--color-bg-surface);
}

.tile-letter {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 2rem;
  line-height: 1;
  color: var(--color-text-primary);
  text-transform: uppercase;
}

/* Filled state */
.tile-state-filled {
  border-color: var(--color-tile-border-active);
}

/* Revealed states */
.tile-state-correct {
  background-color: var(--color-tile-correct);
  border-color: var(--color-tile-correct);
}

.tile-state-present {
  background-color: var(--color-tile-present);
  border-color: var(--color-tile-present);
}

.tile-state-absent {
  background-color: var(--color-tile-absent);
  border-color: var(--color-tile-absent);
}

.tile-state-absent .tile-letter {
  color: var(--color-text-secondary);
}

/* Flip animation */
@keyframes tile-flip {
  0% {
    transform: rotateX(0deg);
  }
  50% {
    transform: rotateX(-90deg);
  }
  100% {
    transform: rotateX(0deg);
  }
}

.tile-flipping {
  animation: tile-flip v-bind('TILE_FLIP_MS + "ms"') ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
  .tile-flipping {
    animation: none;
  }
}
</style>
