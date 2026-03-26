import type { DailyGameRecord } from '@/types/persistence'
import type { GuessResult } from '@/types/game'
import { useGameEngine } from '@/composables/useGameEngine'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const PREFIX = 'myrdle_game_'

export function getAllGameRecords(): DailyGameRecord[] {
  const records: DailyGameRecord[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(PREFIX)) continue
      const dateStr = key.slice(PREFIX.length)
      if (!DATE_RE.test(dateStr)) continue
      try {
        const raw = JSON.parse(localStorage.getItem(key)!)
        if (
          !Array.isArray(raw.guesses) ||
          typeof raw.solved !== 'boolean' ||
          !Array.isArray(raw.funnelData)
        )
          continue
        records.push({ guesses: raw.guesses, solved: raw.solved, funnelData: raw.funnelData, date: dateStr })
      } catch {
        continue
      }
    }
  } catch {
    return []
  }
  return records.sort((a, b) => a.date.localeCompare(b.date))
}

export interface StartingWordStats {
  averageRemaining: number
  mostUsedWord: string
  mostUsedCount: number
  totalGames: number
}

export const MIN_GAMES_FOR_STATS = 5

export function getStartingWordStats(
  records: DailyGameRecord[],
): { stats: StartingWordStats; validCount?: never } | { stats: null; validCount: number } {
  const valid = records.filter(
    (r) => Array.isArray(r.funnelData) && r.funnelData.length >= 2 && r.guesses.length >= 1,
  )
  if (valid.length < MIN_GAMES_FOR_STATS) return { stats: null, validCount: valid.length }

  const sum = valid.reduce((acc, r) => acc + r.funnelData[1], 0)
  const averageRemaining = Math.round(sum / valid.length)

  const freq = new Map<string, number>()
  for (const r of valid) {
    const word = r.guesses[0].toUpperCase()
    freq.set(word, (freq.get(word) ?? 0) + 1)
  }

  let mostUsedWord = ''
  let mostUsedCount = 0
  for (const [word, count] of freq) {
    if (count > mostUsedCount) {
      mostUsedWord = word
      mostUsedCount = count
    }
  }

  return { stats: { averageRemaining, mostUsedWord, mostUsedCount, totalGames: valid.length } }
}

const { getTileStates, getAnswerForDate } = useGameEngine()

export function getTileStatesForRecord(record: DailyGameRecord): GuessResult[] {
  const answer = getAnswerForDate(record.date)
  return record.guesses.map((guess) => getTileStates(guess, answer))
}

export function useAnalyticsData() {
  return { getAllGameRecords, getStartingWordStats, getTileStatesForRecord, getAnswerForDate }
}
