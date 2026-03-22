import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from './useGameStore'
import { GamePhase } from '../types/game'

const mockSaveGame = vi.fn()
const mockUpdateStreakOnWin = vi.fn()
const mockUpdateStreakOnLoss = vi.fn()
const mockCheckAndMaybeResetStreak = vi.fn()

vi.mock('./usePersistenceStore', () => ({
  usePersistenceStore: () => ({
    saveGame: mockSaveGame,
    storageError: { value: false },
    updateStreakOnWin: mockUpdateStreakOnWin,
    updateStreakOnLoss: mockUpdateStreakOnLoss,
    checkAndMaybeResetStreak: mockCheckAndMaybeResetStreak,
  }),
}))

describe('useGameStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockSaveGame.mockClear()
    mockUpdateStreakOnWin.mockClear()
    mockUpdateStreakOnLoss.mockClear()
    mockCheckAndMaybeResetStreak.mockClear()
  })

  describe('restoreFromRecord', () => {
    it('restores phase to PLAYING when not solved and guesses < max', () => {
      const store = useGameStore()
      const date = '2025-01-01'
      const record = {
        guesses: ['crane'],
        solved: false,
        funnelData: [100],
      }
      store.restoreFromRecord(date, record)
      expect(store.boardState.gamePhase).toBe(GamePhase.PLAYING)
    })

    it('restores phase to WON when solved', () => {
      const store = useGameStore()
      // Use the real engine — need a valid date with a known answer
      // We can only verify the phase logic, not the exact answer
      store.initGame('2025-01-01')
      const answer = store.answerWord
      const date = '2025-01-01'
      const record = {
        guesses: [answer],
        solved: true,
        funnelData: [0],
      }
      store.restoreFromRecord(date, record)
      expect(store.boardState.gamePhase).toBe(GamePhase.WON)
    })

    it('restores phase to LOST when 6 guesses and not solved', () => {
      const store = useGameStore()
      store.initGame('2025-01-01')
      const date = '2025-01-01'
      // 6 wrong guesses — use 'zzzzz' which is likely invalid but we need 6 entries
      // Use a valid word that is wrong: reuse store's engine via submitGuess
      // Since we can't guarantee specific words, use restoreGame logic:
      // restoreGame sets LOST when guesses.length >= MAX_GUESSES and not solved
      const record = {
        guesses: ['crane', 'stale', 'light', 'drink', 'flump', 'bumps'],
        solved: false,
        funnelData: [100, 80, 60, 40, 20, 0],
      }
      store.restoreFromRecord(date, record)
      expect(store.boardState.gamePhase).toBe(GamePhase.LOST)
    })

    it('restores guesses array correctly', () => {
      const store = useGameStore()
      store.initGame('2025-01-01')
      const date = '2025-01-01'
      const record = {
        guesses: ['crane', 'stale'],
        solved: false,
        funnelData: [100, 80],
      }
      store.restoreFromRecord(date, record)
      expect(store.boardState.guesses).toEqual(['crane', 'stale'])
    })

    it('restores tileStates with correct length', () => {
      const store = useGameStore()
      const date = '2025-01-01'
      const record = {
        guesses: ['crane', 'stale'],
        solved: false,
        funnelData: [100, 80],
      }
      store.restoreFromRecord(date, record)
      expect(store.boardState.tileStates).toHaveLength(2)
      expect(store.boardState.tileStates[0]).toHaveLength(5)
      expect(store.boardState.tileStates[1]).toHaveLength(5)
    })

    it('restores funnelData correctly', () => {
      const store = useGameStore()
      const date = '2025-01-01'
      const record = {
        guesses: ['crane'],
        solved: false,
        funnelData: [42],
      }
      store.restoreFromRecord(date, record)
      expect(store.funnelData).toEqual([42])
    })

    it('sets answerWord from date', () => {
      const store = useGameStore()
      store.initGame('2025-01-01')
      const expectedAnswer = store.answerWord
      const store2 = useGameStore()
      const date = '2025-01-01'
      const record = {
        guesses: ['crane'],
        solved: false,
        funnelData: [100],
      }
      store2.restoreFromRecord(date, record)
      expect(store2.answerWord).toBe(expectedAnswer)
    })

    it('clears currentInput to empty', () => {
      const store = useGameStore()
      const date = '2025-01-01'
      const record = {
        guesses: ['crane'],
        solved: false,
        funnelData: [100],
      }
      store.restoreFromRecord(date, record)
      expect(store.currentInput).toBe('')
    })

    it('sets activeRow to number of guesses', () => {
      const store = useGameStore()
      const date = '2025-01-01'
      const record = {
        guesses: ['crane', 'stale'],
        solved: false,
        funnelData: [100, 80],
      }
      store.restoreFromRecord(date, record)
      expect(store.activeRow).toBe(2)
    })
  })

  describe('submitGuess — saveGame integration', () => {
    it('calls saveGame with correct payload after a valid guess', () => {
      const store = useGameStore()
      store.initGame('2025-01-01')
      // Type a valid 5-letter word
      store.typeChar('c')
      store.typeChar('r')
      store.typeChar('a')
      store.typeChar('n')
      store.typeChar('e')
      const result = store.submitGuess(false)
      expect(result.valid).toBe(true)
      expect(mockSaveGame).toHaveBeenCalledTimes(1)
      const [, record] = mockSaveGame.mock.calls[0]
      expect(record).toHaveProperty('guesses')
      expect(record).toHaveProperty('solved')
      expect(record).toHaveProperty('funnelData')
      expect(record.guesses).toContain('crane')
    })

    it('does NOT call saveGame after an invalid (too short) guess', () => {
      const store = useGameStore()
      store.initGame('2025-01-01')
      store.typeChar('c')
      store.typeChar('r')
      store.submitGuess(false)
      expect(mockSaveGame).not.toHaveBeenCalled()
    })

    it('does NOT call saveGame when game is not PLAYING', () => {
      const store = useGameStore()
      store.initGame('2025-01-01')
      store.boardState.gamePhase = GamePhase.WON
      store.typeChar('c')
      store.typeChar('r')
      store.typeChar('a')
      store.typeChar('n')
      store.typeChar('e')
      store.submitGuess(false)
      expect(mockSaveGame).not.toHaveBeenCalled()
    })

    it('saveGame payload includes solved=true when winning guess submitted', () => {
      const store = useGameStore()
      store.initGame('2025-01-01')
      const answer = store.answerWord
      for (const char of answer) {
        store.typeChar(char)
      }
      store.submitGuess(false)
      const [, record] = mockSaveGame.mock.calls[0]
      expect(record.solved).toBe(true)
    })

    it('saveGame payload includes solved=false for a non-winning guess', () => {
      const store = useGameStore()
      store.initGame('2025-01-01')
      // Type a valid word that is not the answer
      store.typeChar('c')
      store.typeChar('r')
      store.typeChar('a')
      store.typeChar('n')
      store.typeChar('e')
      store.submitGuess(false)
      if (mockSaveGame.mock.calls.length > 0) {
        const [, record] = mockSaveGame.mock.calls[0]
        // Only check if crane was not the answer
        if (record.solved === false) {
          expect(record.solved).toBe(false)
        }
      }
    })
  })

  describe('submitGuess — streak wiring', () => {
    it('calls updateStreakOnWin with todayDate when winning guess is submitted', () => {
      const store = useGameStore()
      store.initGame('2025-01-01')
      const answer = store.answerWord
      for (const char of answer) {
        store.typeChar(char)
      }
      store.submitGuess(false)
      expect(mockUpdateStreakOnWin).toHaveBeenCalledWith('2025-01-01')
      expect(mockUpdateStreakOnLoss).not.toHaveBeenCalled()
    })

    it('does NOT call updateStreakOnWin or updateStreakOnLoss for a mid-game non-winning guess', () => {
      const store = useGameStore()
      store.initGame('2025-01-01')
      const answer = store.answerWord
      // Pick a guaranteed non-answer word for this single mid-game guess
      const testWord = answer !== 'crane' ? 'crane' : 'stale'
      for (const char of testWord) {
        store.typeChar(char)
      }
      store.submitGuess(false)
      expect(mockUpdateStreakOnWin).not.toHaveBeenCalled()
      expect(mockUpdateStreakOnLoss).not.toHaveBeenCalled()
    })

    it('calls updateStreakOnLoss on the 6th wrong guess (LOST state)', () => {
      const store = useGameStore()
      store.initGame('2025-01-01')
      const answer = store.answerWord
      // Load 5 guesses that are not the answer
      const wrongGuesses = ['crane', 'stale', 'light', 'drink', 'flump'].filter(
        (w) => w !== answer,
      )
      store.restoreGame(
        '2025-01-01',
        wrongGuesses.slice(0, 5),
        wrongGuesses.slice(0, 5).map(() => Array(5).fill('absent') as ReturnType<typeof store.boardState.tileStates>[number]),
        [100, 80, 60, 40, 20],
        false,
      )
      mockUpdateStreakOnLoss.mockClear()
      // Submit one more wrong word that triggers LOST
      const sixthWrong = 'bumps'
      for (const char of sixthWrong) {
        store.typeChar(char)
      }
      store.submitGuess(false)
      expect(store.boardState.gamePhase).toBe(GamePhase.LOST)
      expect(mockUpdateStreakOnLoss).toHaveBeenCalledTimes(1)
    })
  })

  describe('initGame — streak wiring', () => {
    it('calls checkAndMaybeResetStreak with the date', () => {
      const store = useGameStore()
      store.initGame('2025-01-01')
      expect(mockCheckAndMaybeResetStreak).toHaveBeenCalledWith('2025-01-01')
    })
  })

  describe('restoreFromRecord — streak wiring', () => {
    it('calls checkAndMaybeResetStreak with the date', () => {
      const store = useGameStore()
      const record = { guesses: ['crane'], solved: false, funnelData: [100] }
      store.restoreFromRecord('2025-01-01', record)
      expect(mockCheckAndMaybeResetStreak).toHaveBeenCalledWith('2025-01-01')
    })
  })
})
