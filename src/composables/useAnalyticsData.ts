import type { DailyGameRecord } from '@/types/persistence'

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

export function useAnalyticsData() {
  return { getAllGameRecords }
}
