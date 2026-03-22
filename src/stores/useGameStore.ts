import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useGameEngine } from '../composables/useGameEngine'
import { GamePhase } from '../types/game'
import type { GuessResult, BoardState } from '../types/game'
import { MAX_GUESSES } from '../constants/game'
import { usePersistenceStore } from './usePersistenceStore'
import type { GameRecord } from '../types/persistence'

export const useGameStore = defineStore('game', () => {
  const engine = useGameEngine()
  const persistenceStore = usePersistenceStore()

  // Reactive state only — no game logic lives here
  const boardState = ref<BoardState>({
    guesses: [],
    tileStates: [],
    gamePhase: GamePhase.PLAYING,
  })
  const activeRow = ref(0)
  const currentInput = ref('')
  const funnelData = ref<number[]>([])
  const todayDate = ref('')
  const answerWord = ref('')
  const invalidGuessShake = ref(false)

  // Computed
  const gamePhase = computed(() => boardState.value.gamePhase)
  const isPlaying = computed(() => boardState.value.gamePhase === GamePhase.PLAYING)
  const isComplete = computed(
    () =>
      boardState.value.gamePhase === GamePhase.WON ||
      boardState.value.gamePhase === GamePhase.LOST,
  )

  // Actions — delegate all logic to useGameEngine
  function initGame(date: string): void {
    todayDate.value = date
    answerWord.value = engine.getAnswerForDate(date)
    boardState.value = {
      guesses: [],
      tileStates: [],
      gamePhase: GamePhase.PLAYING,
    }
    activeRow.value = 0
    currentInput.value = ''
    funnelData.value = []
    persistenceStore.checkAndMaybeResetStreak(date)
  }

  function restoreGame(
    date: string,
    guesses: string[],
    tileStates: GuessResult[],
    funnel: number[],
    solved: boolean,
  ): void {
    todayDate.value = date
    answerWord.value = engine.getAnswerForDate(date)
    const phase = solved
      ? GamePhase.WON
      : guesses.length >= MAX_GUESSES
        ? GamePhase.LOST
        : GamePhase.PLAYING
    boardState.value = { guesses, tileStates, gamePhase: phase }
    activeRow.value = guesses.length
    funnelData.value = funnel
    currentInput.value = ''
  }

  function restoreFromRecord(date: string, record: GameRecord): void {
    const answer = engine.getAnswerForDate(date)
    const tileStates = record.guesses.map((guess) => engine.getTileStates(guess, answer))
    restoreGame(date, record.guesses, tileStates, record.funnelData, record.solved)
    persistenceStore.checkAndMaybeResetStreak(date)
  }

  function typeChar(char: string): void {
    if (!isPlaying.value) return
    if (currentInput.value.length >= 5) return
    currentInput.value += char.toLowerCase()
  }

  function deleteLast(): void {
    if (!isPlaying.value) return
    currentInput.value = currentInput.value.slice(0, -1)
  }

  function submitGuess(hardMode: boolean): { valid: boolean; hardModeViolation: boolean } {
    if (!isPlaying.value) return { valid: false, hardModeViolation: false }

    const guess = currentInput.value
    if (!engine.isValidWord(guess)) {
      triggerShake()
      return { valid: false, hardModeViolation: false }
    }

    if (
      hardMode &&
      !engine.isHardModeValid(guess, boardState.value.guesses, boardState.value.tileStates)
    ) {
      triggerShake()
      return { valid: false, hardModeViolation: true }
    }

    const tileResult = engine.getTileStates(guess, answerWord.value)
    const newGuesses = [...boardState.value.guesses, guess]
    const newTileStates = [...boardState.value.tileStates, tileResult]

    // Update funnel data for this guess
    const newFunnel = engine.getValidWordsRemaining(newGuesses, newTileStates)

    const won = tileResult.every((t) => t === 'correct')
    const lost = !won && newGuesses.length >= MAX_GUESSES
    const newPhase = won ? GamePhase.WON : lost ? GamePhase.LOST : GamePhase.PLAYING

    boardState.value = {
      guesses: newGuesses,
      tileStates: newTileStates,
      gamePhase: newPhase,
    }
    activeRow.value = newGuesses.length
    funnelData.value = newFunnel
    currentInput.value = ''

    persistenceStore.saveGame(todayDate.value, {
      guesses: newGuesses,
      solved: won,
      funnelData: newFunnel,
    })

    if (won) {
      persistenceStore.updateStreakOnWin(todayDate.value)
    } else if (lost) {
      persistenceStore.updateStreakOnLoss()
    }

    return { valid: true, hardModeViolation: false }
  }

  function triggerShake(): void {
    invalidGuessShake.value = true
    setTimeout(() => {
      invalidGuessShake.value = false
    }, 300)
  }

  return {
    // State
    boardState,
    activeRow,
    currentInput,
    funnelData,
    todayDate,
    answerWord,
    invalidGuessShake,
    // Computed
    gamePhase,
    isPlaying,
    isComplete,
    // Actions
    initGame,
    restoreGame,
    restoreFromRecord,
    typeChar,
    deleteLast,
    submitGuess,
  }
})
