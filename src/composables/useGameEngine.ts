import validWordsJson from '../data/valid-words.json'
import answersJson from '../data/answers.json'
import { WORD_LENGTH, EPOCH_DATE } from '../constants/game'
import type { TileState, GuessResult } from '../types/game'

const validWordsArray = validWordsJson as string[]
const answers = answersJson as string[]
const validWordSet = new Set<string>(validWordsArray)

function isValidWord(word: string): boolean {
  if (word.length !== WORD_LENGTH) return false
  return validWordSet.has(word)
}

function getTileStates(guess: string, answer: string): GuessResult {
  const result: TileState[] = Array(WORD_LENGTH).fill('absent')
  const answerLetterPool = answer.split('')

  // Pass 1: mark 'correct' and remove matched letters from pool
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answer[i]) {
      result[i] = 'correct'
      answerLetterPool[i] = ''
    }
  }

  // Pass 2: mark 'present' only if letter still in pool
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === 'correct') continue
    const poolIndex = answerLetterPool.indexOf(guess[i])
    if (poolIndex !== -1) {
      result[i] = 'present'
      answerLetterPool[poolIndex] = ''
    }
  }

  return result as GuessResult
}

function isWordConsistentWithConstraints(
  candidate: string,
  guesses: string[],
  tileStates: GuessResult[],
): boolean {
  for (let g = 0; g < guesses.length; g++) {
    const guess = guesses[g]
    const tiles = tileStates[g]
    for (let pos = 0; pos < WORD_LENGTH; pos++) {
      const letter = guess[pos]
      const state = tiles[pos]
      if (state === 'correct' && candidate[pos] !== letter) return false
      if (state === 'correct' && candidate[pos] === letter) continue
      if (state === 'present' && candidate[pos] === letter) return false
      if (state === 'present' && !candidate.includes(letter)) return false
      if (state === 'absent') {
        const letterAppearsElsewhere = tiles.some(
          (t, i) => i !== pos && guesses[g][i] === letter && (t === 'correct' || t === 'present'),
        )
        if (!letterAppearsElsewhere && candidate.includes(letter)) return false
      }
    }
  }
  return true
}

function getValidWordsRemaining(guesses: string[], tileStates: GuessResult[]): number[] {
  return guesses.map((_, i) =>
    validWordsArray.filter((word) =>
      isWordConsistentWithConstraints(word, guesses.slice(0, i + 1), tileStates.slice(0, i + 1)),
    ).length,
  )
}

function getAnswerForDate(date: string): string {
  const epoch = new Date(EPOCH_DATE).getTime()
  const target = new Date(date).getTime()
  const MS_PER_DAY = 24 * 60 * 60 * 1000
  const dayOffset = Math.floor((target - epoch) / MS_PER_DAY)
  return answers[((dayOffset % answers.length) + answers.length) % answers.length]
}

function isHardModeValid(
  newGuess: string,
  previousGuesses: string[],
  previousTileStates: GuessResult[],
): boolean {
  for (let g = 0; g < previousGuesses.length; g++) {
    for (let pos = 0; pos < WORD_LENGTH; pos++) {
      const letter = previousGuesses[g][pos]
      const state = previousTileStates[g][pos]
      if (state === 'correct' && newGuess[pos] !== letter) return false
      if (state === 'present' && !newGuess.includes(letter)) return false
    }
  }
  return true
}

export function useGameEngine() {
  return {
    isValidWord,
    getTileStates,
    getValidWordsRemaining,
    getAnswerForDate,
    isHardModeValid,
  }
}
