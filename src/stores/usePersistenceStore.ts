import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { SettingsData, StreakData, GameRecord } from '../types/persistence'

const KEYS = {
  settings: 'myrdle_settings',
  streak: 'myrdle_streak',
  game: (date: string) => `myrdle_game_${date}`,
} as const

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function safeWrite(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

const DEFAULT_SETTINGS: SettingsData = { hardMode: false, deuteranopia: false }
const DEFAULT_STREAK: StreakData = { count: 0, lastSolvedDate: '' }

export const usePersistenceStore = defineStore('persistence', () => {
  const storageError = ref(false)

  const streakData = ref<StreakData>((() => {
    try {
      const raw = localStorage.getItem(KEYS.streak)
      if (!raw) return { ...DEFAULT_STREAK }
      return JSON.parse(raw) as StreakData
    } catch {
      storageError.value = true
      return { ...DEFAULT_STREAK }
    }
  })())

  function loadSettings(): SettingsData {
    try {
      const raw = localStorage.getItem(KEYS.settings)
      if (!raw) return { ...DEFAULT_SETTINGS }
      return JSON.parse(raw) as SettingsData
    } catch {
      storageError.value = true
      return { ...DEFAULT_SETTINGS }
    }
  }

  function saveSettings(data: SettingsData): void {
    if (!safeWrite(KEYS.settings, data)) {
      storageError.value = true
    }
  }

  function loadStreak(): StreakData {
    try {
      const raw = localStorage.getItem(KEYS.streak)
      if (!raw) return { ...DEFAULT_STREAK }
      return JSON.parse(raw) as StreakData
    } catch {
      storageError.value = true
      return { ...DEFAULT_STREAK }
    }
  }

  function saveStreak(data: StreakData): void {
    streakData.value = { ...data }
    if (!safeWrite(KEYS.streak, data)) {
      storageError.value = true
    }
  }

  function isYesterday(dateStr: string, todayStr: string): boolean {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/
    if (!datePattern.test(dateStr) || !datePattern.test(todayStr)) return false
    const [y, m, d] = todayStr.split('-').map(Number)
    const today = new Date(y, m - 1, d)
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
    return yStr === dateStr
  }

  function updateStreakOnWin(todayDate: string): void {
    const updated: StreakData = {
      count: streakData.value.count + 1,
      lastSolvedDate: todayDate,
    }
    saveStreak(updated)
  }

  function updateStreakOnLoss(): void {
    const updated: StreakData = {
      count: 0,
      lastSolvedDate: streakData.value.lastSolvedDate,
    }
    saveStreak(updated)
  }

  function checkAndMaybeResetStreak(todayDate: string): void {
    const last = streakData.value.lastSolvedDate
    if (!last) return
    if (last === todayDate) return
    if (isYesterday(last, todayDate)) return
    saveStreak({ count: 0, lastSolvedDate: last })
  }

  function loadGame(date: string): GameRecord | null {
    try {
      const raw = localStorage.getItem(KEYS.game(date))
      if (!raw) return null
      return JSON.parse(raw) as GameRecord
    } catch {
      storageError.value = true
      return null
    }
  }

  function saveGame(date: string, data: GameRecord): void {
    if (!safeWrite(KEYS.game(date), data)) {
      storageError.value = true
    }
  }

  // Expose safeRead for consumers needing generic reads (internal use)
  function readKey<T>(key: string, fallback: T): T {
    try {
      return safeRead(key, fallback)
    } catch {
      storageError.value = true
      return fallback
    }
  }

  return {
    storageError,
    streakData,
    loadSettings,
    saveSettings,
    loadStreak,
    saveStreak,
    updateStreakOnWin,
    updateStreakOnLoss,
    checkAndMaybeResetStreak,
    loadGame,
    saveGame,
    readKey,
  }
})
