import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick, ref, reactive } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GameView from './GameView.vue'
import { useGameStore } from '@/stores/useGameStore'
import { GamePhase } from '@/types/game'

const startBackground = vi.fn()
const playBell = vi.fn()

const mockLoadGame = vi.fn().mockReturnValue(null)
const mockSaveGame = vi.fn()
const mockStorageError = ref(false)
const persistenceStoreMock = reactive({
  loadGame: mockLoadGame,
  saveGame: mockSaveGame,
  storageError: mockStorageError,
  streakData: { count: 0, lastSolvedDate: '' },
  loadStreak: vi.fn().mockReturnValue({ count: 0, lastSolvedDate: '' }),
  saveStreak: vi.fn(),
  updateStreakOnWin: vi.fn(),
  updateStreakOnLoss: vi.fn(),
  checkAndMaybeResetStreak: vi.fn(),
  loadSettings: vi.fn().mockReturnValue({ hardMode: false, deuteranopia: false }),
  saveSettings: vi.fn(),
})

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

vi.mock('@/stores/usePersistenceStore', () => ({
  usePersistenceStore: () => persistenceStoreMock,
}))

describe('GameView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    startBackground.mockClear()
    playBell.mockClear()
    mockLoadGame.mockClear()
    mockSaveGame.mockClear()
    mockLoadGame.mockReturnValue(null)
    mockStorageError.value = false
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

  describe('onMounted restore path (AC: 1, 2, 4, 5)', () => {
    it('calls restoreFromRecord when loadGame returns a record', async () => {
      const record = { guesses: ['crane'], solved: false, funnelData: [100] }
      mockLoadGame.mockReturnValue(record)
      const store = useGameStore()
      vi.spyOn(store, 'restoreFromRecord')
      const wrapper = mount(GameView, { global: { plugins: [pinia] } })
      await nextTick()
      expect(store.restoreFromRecord).toHaveBeenCalledTimes(1)
      expect(store.restoreFromRecord).toHaveBeenCalledWith(expect.any(String), record)
      wrapper.unmount()
    })

    it('calls initGame when loadGame returns null', async () => {
      mockLoadGame.mockReturnValue(null)
      const store = useGameStore()
      vi.spyOn(store, 'initGame')
      const wrapper = mount(GameView, { global: { plugins: [pinia] } })
      await nextTick()
      expect(store.initGame).toHaveBeenCalledTimes(1)
      wrapper.unmount()
    })

    it('does NOT call initGame when a saved record is found', async () => {
      const record = { guesses: ['crane'], solved: false, funnelData: [100] }
      mockLoadGame.mockReturnValue(record)
      const store = useGameStore()
      vi.spyOn(store, 'initGame')
      const wrapper = mount(GameView, { global: { plugins: [pinia] } })
      await nextTick()
      expect(store.initGame).not.toHaveBeenCalled()
      wrapper.unmount()
    })

    it('does NOT call restoreFromRecord when no record exists', async () => {
      mockLoadGame.mockReturnValue(null)
      const store = useGameStore()
      vi.spyOn(store, 'restoreFromRecord')
      const wrapper = mount(GameView, { global: { plugins: [pinia] } })
      await nextTick()
      expect(store.restoreFromRecord).not.toHaveBeenCalled()
      wrapper.unmount()
    })
  })

  describe('storageError banner', () => {
    it('shows banner when storageError is true', async () => {
      mockStorageError.value = true
      const wrapper = mount(GameView, { global: { plugins: [pinia] } })
      await nextTick()
      const banner = wrapper.find('.storage-error')
      expect(banner.exists()).toBe(true)
      expect(banner.text()).toContain('Unable to load saved data')
      wrapper.unmount()
    })

    it('hides banner when storageError is false', async () => {
      mockStorageError.value = false
      const wrapper = mount(GameView, { global: { plugins: [pinia] } })
      await nextTick()
      expect(wrapper.find('.storage-error').exists()).toBe(false)
      wrapper.unmount()
    })

    it('shows banner reactively when storageError changes to true after mount', async () => {
      mockStorageError.value = false
      const wrapper = mount(GameView, { global: { plugins: [pinia] } })
      await nextTick()
      expect(wrapper.find('.storage-error').exists()).toBe(false)
      mockStorageError.value = true
      await nextTick()
      expect(wrapper.find('.storage-error').exists()).toBe(true)
      wrapper.unmount()
    })
  })
})
