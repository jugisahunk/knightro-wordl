import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePersistenceStore } from './usePersistenceStore'

const GAME_KEY = (date: string) => `myrdle_game_${date}`
const STREAK_KEY = 'myrdle_streak'

describe('usePersistenceStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  describe('loadGame', () => {
    it('returns null when key is absent — no storageError set', () => {
      const store = usePersistenceStore()
      const result = store.loadGame('2025-01-01')
      expect(result).toBeNull()
      expect(store.storageError).toBe(false)
    })

    it('returns the saved record for the correct date', () => {
      const store = usePersistenceStore()
      const record = { guesses: ['crane'], solved: false, funnelData: [100] }
      localStorage.setItem(GAME_KEY('2025-01-01'), JSON.stringify(record))
      const result = store.loadGame('2025-01-01')
      expect(result).toEqual(record)
    })

    it('returns null for a different date — does not load previous day', () => {
      const store = usePersistenceStore()
      const record = { guesses: ['crane'], solved: false, funnelData: [100] }
      localStorage.setItem(GAME_KEY('2025-01-01'), JSON.stringify(record))
      const result = store.loadGame('2025-01-02')
      expect(result).toBeNull()
    })

    it('sets storageError and returns null on malformed JSON', () => {
      const store = usePersistenceStore()
      localStorage.setItem(GAME_KEY('2025-01-01'), 'not-valid-json{{{')
      const result = store.loadGame('2025-01-01')
      expect(result).toBeNull()
      expect(store.storageError).toBe(true)
    })

    it('leaves previous day key untouched when loading a different date', () => {
      const store = usePersistenceStore()
      const record = { guesses: ['crane'], solved: true, funnelData: [0] }
      localStorage.setItem(GAME_KEY('2025-01-01'), JSON.stringify(record))
      store.loadGame('2025-01-02')
      const previousEntry = localStorage.getItem(GAME_KEY('2025-01-01'))
      expect(previousEntry).not.toBeNull()
      expect(JSON.parse(previousEntry!)).toEqual(record)
    })
  })

  describe('updateStreakOnWin', () => {
    it('increments count by 1, sets lastSolvedDate, persists to localStorage', () => {
      const store = usePersistenceStore()
      store.updateStreakOnWin('2026-03-21')
      expect(store.streakData.count).toBe(1)
      expect(store.streakData.lastSolvedDate).toBe('2026-03-21')
      const raw = localStorage.getItem(STREAK_KEY)
      expect(raw).not.toBeNull()
      const parsed = JSON.parse(raw!)
      expect(parsed.count).toBe(1)
      expect(parsed.lastSolvedDate).toBe('2026-03-21')
    })

    it('called twice → count is 2', () => {
      const store = usePersistenceStore()
      store.updateStreakOnWin('2026-03-20')
      store.updateStreakOnWin('2026-03-21')
      expect(store.streakData.count).toBe(2)
    })
  })

  describe('updateStreakOnLoss', () => {
    it('resets count to 0, does NOT update lastSolvedDate, persists to localStorage', () => {
      localStorage.setItem(STREAK_KEY, JSON.stringify({ count: 5, lastSolvedDate: '2026-03-20' }))
      const store = usePersistenceStore()
      store.updateStreakOnLoss()
      expect(store.streakData.count).toBe(0)
      expect(store.streakData.lastSolvedDate).toBe('2026-03-20')
      const raw = localStorage.getItem(STREAK_KEY)
      const parsed = JSON.parse(raw!)
      expect(parsed.count).toBe(0)
      expect(parsed.lastSolvedDate).toBe('2026-03-20')
    })
  })

  describe('checkAndMaybeResetStreak', () => {
    it('does not reset when lastSolvedDate is today', () => {
      localStorage.setItem(STREAK_KEY, JSON.stringify({ count: 3, lastSolvedDate: '2026-03-21' }))
      const store = usePersistenceStore()
      store.checkAndMaybeResetStreak('2026-03-21')
      expect(store.streakData.count).toBe(3)
    })

    it('does not reset when lastSolvedDate is yesterday (UTC)', () => {
      localStorage.setItem(STREAK_KEY, JSON.stringify({ count: 3, lastSolvedDate: '2026-03-20' }))
      const store = usePersistenceStore()
      store.checkAndMaybeResetStreak('2026-03-21')
      expect(store.streakData.count).toBe(3)
    })

    it('resets count to 0 when lastSolvedDate is 2+ days ago', () => {
      localStorage.setItem(STREAK_KEY, JSON.stringify({ count: 3, lastSolvedDate: '2026-03-15' }))
      const store = usePersistenceStore()
      store.checkAndMaybeResetStreak('2026-03-21')
      expect(store.streakData.count).toBe(0)
      expect(store.streakData.lastSolvedDate).toBe('2026-03-15')
    })

    it('does not reset (and no error) when lastSolvedDate is empty string', () => {
      const store = usePersistenceStore()
      expect(() => store.checkAndMaybeResetStreak('2026-03-21')).not.toThrow()
      expect(store.streakData.count).toBe(0)
    })
  })

  describe('streakData reactive ref', () => {
    it('reflects updated count after updateStreakOnWin', () => {
      const store = usePersistenceStore()
      expect(store.streakData.count).toBe(0)
      store.updateStreakOnWin('2026-03-21')
      expect(store.streakData.count).toBe(1)
    })
  })

  describe('saveGame', () => {
    it('saves a game record that can be round-tripped via loadGame', () => {
      const store = usePersistenceStore()
      const record = { guesses: ['crane', 'stale'], solved: false, funnelData: [100, 80] }
      store.saveGame('2025-01-01', record)
      const loaded = store.loadGame('2025-01-01')
      expect(loaded).toEqual(record)
    })

    it('saves under the correct localStorage key', () => {
      const store = usePersistenceStore()
      const record = { guesses: ['light'], solved: false, funnelData: [50] }
      store.saveGame('2025-06-15', record)
      const raw = localStorage.getItem(GAME_KEY('2025-06-15'))
      expect(raw).not.toBeNull()
      expect(JSON.parse(raw!)).toEqual(record)
    })

    it('overwrites an existing entry for the same date', () => {
      const store = usePersistenceStore()
      const first = { guesses: ['crane'], solved: false, funnelData: [100] }
      const second = { guesses: ['crane', 'stale'], solved: false, funnelData: [100, 80] }
      store.saveGame('2025-01-01', first)
      store.saveGame('2025-01-01', second)
      const loaded = store.loadGame('2025-01-01')
      expect(loaded).toEqual(second)
    })

    it('round-trips a solved game correctly', () => {
      const store = usePersistenceStore()
      const record = { guesses: ['crane', 'light', 'solid'], solved: true, funnelData: [100, 60, 0] }
      store.saveGame('2025-03-21', record)
      const loaded = store.loadGame('2025-03-21')
      expect(loaded).toEqual(record)
      expect(loaded?.solved).toBe(true)
    })
  })
})
