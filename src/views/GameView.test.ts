import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GameView from './GameView.vue'
import { useGameStore } from '@/stores/useGameStore'
import { GamePhase } from '@/types/game'

describe('GameView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
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
