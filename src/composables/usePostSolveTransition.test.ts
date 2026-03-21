import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { usePostSolveTransition } from './usePostSolveTransition'
import { AUTO_ADVANCE_MS, SOLVE_PAUSE_MS, BOARD_DIM_MS } from '@/constants/timing'
import { useGameStore } from '@/stores/useGameStore'
import { GamePhase } from '@/types/game'

vi.mock('@/composables/useSoundManager', () => ({
  useSoundManager: () => ({ trigger: vi.fn() }),
}))

let pinia: ReturnType<typeof createPinia>

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function withSetup() {
  let exposed: ReturnType<typeof usePostSolveTransition> | null = null
  const wrapper = mount(
    defineComponent({
      setup() {
        exposed = usePostSolveTransition()
        return () => h('div')
      },
    }),
    { global: { plugins: [pinia] } },
  )
  return { exposed: exposed!, wrapper }
}

describe('usePostSolveTransition', () => {
  describe('dismiss()', () => {
    it('sets phase to dismissed', () => {
      const { exposed } = withSetup()
      exposed.dismiss()
      expect(exposed.phase.value).toBe('dismissed')
    })

    it('is idempotent — calling twice stays dismissed', () => {
      const { exposed } = withSetup()
      exposed.dismiss()
      exposed.dismiss()
      expect(exposed.phase.value).toBe('dismissed')
    })
  })

  describe('advanceToEtymology()', () => {
    it('sets phase to etymology', () => {
      const { exposed } = withSetup()
      exposed.advanceToEtymology()
      expect(exposed.phase.value).toBe('etymology')
    })

    it('calling twice does not reset to funnel — phase stays etymology', () => {
      const { exposed } = withSetup()
      exposed.advanceToEtymology()
      exposed.advanceToEtymology()
      expect(exposed.phase.value).toBe('etymology')
    })
  })

  describe('startRitual via gamePhase watch', () => {
    it('transitions to dimming immediately when gamePhase becomes WON', async () => {
      const { exposed } = withSetup()
      const gameStore = useGameStore()
      gameStore.boardState.gamePhase = GamePhase.WON
      await nextTick()
      expect(exposed.phase.value).toBe('dimming')
    })

    it('transitions to dimming immediately when gamePhase becomes LOST', async () => {
      const { exposed } = withSetup()
      const gameStore = useGameStore()
      gameStore.boardState.gamePhase = GamePhase.LOST
      await nextTick()
      expect(exposed.phase.value).toBe('dimming')
    })

    it('transitions to funnel after SOLVE_PAUSE_MS + BOARD_DIM_MS', async () => {
      const { exposed } = withSetup()
      const gameStore = useGameStore()
      gameStore.boardState.gamePhase = GamePhase.WON
      await nextTick()
      vi.advanceTimersByTime(SOLVE_PAUSE_MS + BOARD_DIM_MS)
      await nextTick()
      expect(exposed.phase.value).toBe('funnel')
    })

    it('transitions to etymology after auto-advance timer fires', async () => {
      const { exposed } = withSetup()
      const gameStore = useGameStore()
      gameStore.boardState.gamePhase = GamePhase.WON
      await nextTick()
      vi.advanceTimersByTime(SOLVE_PAUSE_MS + BOARD_DIM_MS + AUTO_ADVANCE_MS)
      await nextTick()
      expect(exposed.phase.value).toBe('etymology')
    })

    it('re-entrance guard — second WON transition does not restart ritual mid-flight', async () => {
      const { exposed } = withSetup()
      const gameStore = useGameStore()
      gameStore.boardState.gamePhase = GamePhase.WON
      await nextTick()
      vi.advanceTimersByTime(SOLVE_PAUSE_MS + BOARD_DIM_MS) // reach funnel
      await nextTick()
      // Simulate a second startRitual attempt (phase is not 'idle')
      gameStore.boardState.gamePhase = GamePhase.LOST
      await nextTick()
      expect(exposed.phase.value).toBe('funnel') // not reset to dimming
    })
  })

  describe('timer double-fire prevention', () => {
    it('manual advance while auto-advance timer is pending — timer does not fire again', async () => {
      const { exposed } = withSetup()
      const gameStore = useGameStore()
      // Start the ritual to get a live auto-advance timer in funnel state
      gameStore.boardState.gamePhase = GamePhase.WON
      await nextTick()
      vi.advanceTimersByTime(SOLVE_PAUSE_MS + BOARD_DIM_MS) // reach funnel
      await nextTick()
      expect(exposed.phase.value).toBe('funnel')
      // Manual advance (simulates Space/Enter) — cancels the timer
      exposed.advanceToEtymology()
      expect(exposed.phase.value).toBe('etymology')
      // Timer fires — should not reset phase
      vi.advanceTimersByTime(AUTO_ADVANCE_MS)
      expect(exposed.phase.value).toBe('etymology')
    })
  })

  describe('Escape during dimming — dismiss prevents funnel from opening', () => {
    it('dismissing during dimming phase keeps phase dismissed after funnel timer fires', async () => {
      const { exposed } = withSetup()
      const gameStore = useGameStore()
      gameStore.boardState.gamePhase = GamePhase.WON
      await nextTick()
      expect(exposed.phase.value).toBe('dimming')
      exposed.dismiss()
      expect(exposed.phase.value).toBe('dismissed')
      // Funnel timer fires — dismissed guard must prevent re-opening
      vi.advanceTimersByTime(SOLVE_PAUSE_MS + BOARD_DIM_MS)
      await nextTick()
      expect(exposed.phase.value).toBe('dismissed')
    })
  })

  describe('boardDimmed computed', () => {
    it('is false when phase is idle (initial state)', () => {
      const { exposed } = withSetup()
      expect(exposed.boardDimmed.value).toBe(false)
    })

    it('is false when phase is dismissed', () => {
      const { exposed } = withSetup()
      exposed.dismiss()
      expect(exposed.boardDimmed.value).toBe(false)
    })

    it('is true when phase is etymology', () => {
      const { exposed } = withSetup()
      exposed.advanceToEtymology()
      expect(exposed.boardDimmed.value).toBe(true)
    })
  })

  describe('showFunnel computed', () => {
    it('is false in idle state', () => {
      const { exposed } = withSetup()
      expect(exposed.showFunnel.value).toBe(false)
    })

    it('is true in etymology state', () => {
      const { exposed } = withSetup()
      exposed.advanceToEtymology()
      expect(exposed.showFunnel.value).toBe(true)
    })
  })

  describe('showEtymology computed', () => {
    it('is false in idle state', () => {
      const { exposed } = withSetup()
      expect(exposed.showEtymology.value).toBe(false)
    })

    it('is true after advanceToEtymology()', () => {
      const { exposed } = withSetup()
      exposed.advanceToEtymology()
      expect(exposed.showEtymology.value).toBe(true)
    })
  })

  describe('lifecycle cleanup', () => {
    it('removes keydown listener on unmount', () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener')
      const { wrapper } = withSetup()
      wrapper.unmount()
      expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    })
  })
})
