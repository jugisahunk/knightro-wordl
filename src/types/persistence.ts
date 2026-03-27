export interface SettingsData {
  hardMode: boolean
  deuteranopia: boolean
  musicEnabled?: boolean
  theme?: 'light' | 'dark' | 'system'
}

export interface StreakData {
  count: number
  lastSolvedDate: string // YYYY-MM-DD local
}

export interface GameRecord {
  guesses: string[]
  solved: boolean
  funnelData: number[]
}

export interface DailyGameRecord extends GameRecord {
  date: string // YYYY-MM-DD
}
