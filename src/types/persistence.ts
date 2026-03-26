export interface SettingsData {
  hardMode: boolean
  deuteranopia: boolean
}

export interface StreakData {
  count: number
  lastSolvedDate: string // YYYY-MM-DD UTC
}

export interface GameRecord {
  guesses: string[]
  solved: boolean
  funnelData: number[]
}

export interface DailyGameRecord extends GameRecord {
  date: string // YYYY-MM-DD
}
