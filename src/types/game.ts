export type TileState = 'empty' | 'filled' | 'correct' | 'present' | 'absent'
export type KeyState = 'default' | 'correct' | 'present' | 'absent'

export const enum GamePhase {
  PLAYING,
  WON,
  LOST,
}

export type GuessResult = TileState[]

export interface BoardState {
  guesses: string[]
  tileStates: GuessResult[]
  gamePhase: GamePhase
}
