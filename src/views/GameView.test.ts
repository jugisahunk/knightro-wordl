import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GameView from './GameView.vue'
import { useGameStore } from '@/stores/useGameStore'
import { GamePhase } from '@/types/game'

const startBackground = vi.fn()
const playBell = vi.fn()

vi.mock('@/composables/useAudio', () => ({
  useAudio: () => ({ startBackground, playBell }),
}))

vi.mock('@/composables/usePostSolveTransition', () => ({
  usePostSolveTransition: () => ({
    phase: { value: 'idle' },
    boardDimmed: { value: false },
    showFunnel: { value: false },
    showEtymology: { value: false },
    advanceToEtymology: vi.fn(),
    dismiss: vi.fn(),
  }),
}))

describe('GameView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    startBackground.mockClear()
    playBell.mockClear()
  })

  describe('answer-reveal', () => {
    it('is hidden during PLAYING phase', async () => {
      const wrapper = mount(GameView, { global: { plugins: [pinia] } })
      await nextTick()
      expect(useGameStore().gamePhase).toBe(GamePhase.PLAYING)
      expect(wrapper.find('.answer-reveal').isVisible()).toBe(false)
      wrapper.unmount()
    })

    it('is visible and shows the answer when LOST', async () => {
      const wrapper = mount(GameView, { global: { plugins: [pinia] } })
      await nextTick()
      const store = useGameStore()
      store.boardState.gamePhase = GamePhase.LOST
      store.answerWord = 'crane'
      await nextTick()
      const el = wrapper.find('.answer-reveal')
      expect(el.isVisible()).toBe(true)
      expect(el.text()).toBe('CRANE')
      wrapper.unmount()
    })

    it('is hidden when WON', async () => {
      const wrapper = mount(GameView, { global: { plugins: [pinia] } })
      await nextTick()
      useGameStore().boardState.gamePhase = GamePhase.WON
      await nextTick()
      expect(wrapper.find('.answer-reveal').isVisible()).toBe(false)
      wrapper.unmount()
    })
  })

  describe('audio', () => {
    it('calls startBackground on first keypress', async () => {
      const wrapper = mount(GameView, { global: { plugins: [pinia] } })
      await nextTick()
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
      expect(startBackground).toHaveBeenCalledTimes(1)
      wrapper.unmount()
    })

    it('calls startBackground on every keypress (idempotency handled inside composable)', async () => {
      const wrapper = mount(GameView, { global: { plugins: [pinia] } })
      await nextTick()
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }))
      expect(startBackground).toHaveBeenCalledTimes(2)
      wrapper.unmount()
    })

    it('does not call playBell when gamePhase transitions to WON (sound owned by usePostSolveTransition)', async () => {
      const wrapper = mount(GameView, { global: { plugins: [pinia] } })
      await nextTick()
      useGameStore().boardState.gamePhase = GamePhase.WON
      await nextTick()
      expect(playBell).not.toHaveBeenCalled()
      wrapper.unmount()
    })

    it('does not call playBell when gamePhase transitions to LOST', async () => {
      const wrapper = mount(GameView, { global: { plugins: [pinia] } })
      await nextTick()
      useGameStore().boardState.gamePhase = GamePhase.LOST
      await nextTick()
      expect(playBell).not.toHaveBeenCalled()
      wrapper.unmount()
    })

    it('does not call playBell while still PLAYING', async () => {
      const wrapper = mount(GameView, { global: { plugins: [pinia] } })
      await nextTick()
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
      await nextTick()
      expect(playBell).not.toHaveBeenCalled()
      wrapper.unmount()
    })
  })

  describe('keyboard input lock (AC8)', () => {
    it('does not accept letter input in LOST phase', async () => {
      const wrapper = mount(GameView, { global: { plugins: [pinia] } })
      await nextTick()
      useGameStore().boardState.gamePhase = GamePhase.LOST
      await nextTick()
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
      expect(useGameStore().currentInput).toBe('')
      wrapper.unmount()
    })

    it('does not accept letter input in WON phase', async () => {
      const wrapper = mount(GameView, { global: { plugins: [pinia] } })
      await nextTick()
      useGameStore().boardState.gamePhase = GamePhase.WON
      await nextTick()
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
      expect(useGameStore().currentInput).toBe('')
      wrapper.unmount()
    })
  })
})
