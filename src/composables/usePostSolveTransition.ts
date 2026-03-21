import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { SOLVE_PAUSE_MS, BOARD_DIM_MS, AUTO_ADVANCE_MS } from '@/constants/timing'
import { useSoundManager } from '@/composables/useSoundManager'
import { useGameStore } from '@/stores/useGameStore'
import { GamePhase } from '@/types/game'

type RitualPhase = 'idle' | 'dimming' | 'funnel' | 'etymology' | 'dismissed'

export function usePostSolveTransition() {
  const gameStore = useGameStore()
  const soundManager = useSoundManager()

  const phase = ref<RitualPhase>('idle')
  let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null
  let soundTimer: ReturnType<typeof setTimeout> | null = null
  let funnelTimer: ReturnType<typeof setTimeout> | null = null

  const boardDimmed = computed(() => phase.value !== 'idle' && phase.value !== 'dismissed')
  const showFunnel = computed(() => phase.value === 'funnel' || phase.value === 'etymology')
  const showEtymology = computed(() => phase.value === 'etymology')
  const isActive = computed(() => phase.value !== 'idle' && phase.value !== 'dismissed')

  function startAutoAdvanceTimer(): void {
    if (autoAdvanceTimer !== null) clearTimeout(autoAdvanceTimer)
    autoAdvanceTimer = setTimeout(() => {
      autoAdvanceTimer = null
      advanceToEtymology()
    }, AUTO_ADVANCE_MS)
  }

  function advanceToEtymology(): void {
    if (autoAdvanceTimer !== null) {
      clearTimeout(autoAdvanceTimer)
      autoAdvanceTimer = null
    }
    phase.value = 'etymology'
  }

  function dismiss(): void {
    if (soundTimer !== null) { clearTimeout(soundTimer); soundTimer = null }
    if (funnelTimer !== null) { clearTimeout(funnelTimer); funnelTimer = null }
    if (autoAdvanceTimer !== null) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null }
    phase.value = 'dismissed'
  }

  function startRitual(outcome: 'won' | 'lost'): void {
    if (phase.value !== 'idle') return
    phase.value = 'dimming'
    soundTimer = setTimeout(() => {
      soundTimer = null
      if (phase.value === 'dismissed') return
      soundManager.trigger(outcome)
    }, SOLVE_PAUSE_MS)
    funnelTimer = setTimeout(() => {
      funnelTimer = null
      if (phase.value === 'dismissed') return
      phase.value = 'funnel'
      startAutoAdvanceTimer()
    }, SOLVE_PAUSE_MS + BOARD_DIM_MS)
  }

  watch(
    () => gameStore.gamePhase,
    (newPhase) => {
      if (newPhase === GamePhase.WON || newPhase === GamePhase.LOST) {
        startRitual(newPhase === GamePhase.WON ? 'won' : 'lost')
      }
    },
  )

  function handleKeydown(event: KeyboardEvent): void {
    if (!isActive.value) return
    if (event.key === 'Escape') {
      dismiss()
    } else if ((event.key === ' ' || event.key === 'Enter') && phase.value === 'funnel') {
      advanceToEtymology()
    }
  }

  onMounted(() => window.addEventListener('keydown', handleKeydown))
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
    if (soundTimer !== null) clearTimeout(soundTimer)
    if (funnelTimer !== null) clearTimeout(funnelTimer)
    if (autoAdvanceTimer !== null) clearTimeout(autoAdvanceTimer)
  })

  return { phase, boardDimmed, showFunnel, showEtymology, advanceToEtymology, dismiss }
}
