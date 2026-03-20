# Story 1.4: Pinia Stores and Persistence Schema

Status: done

## Story

As a developer,
I want the three Pinia stores implemented with correct boundaries and the localStorage schema established,
so that all subsequent UI stories have reactive state and safe persistence to build on.

## Acceptance Criteria

1. **Given** `src/stores/useGameStore.ts`, **When** reviewed, **Then** it uses Pinia composition style (`defineStore` with `setup` function) **And** it contains only reactive state (`boardState`, `activeRow`, `gamePhase`, `funnelData`) — no game logic **And** all game logic calls are delegated to `useGameEngine` composable functions

2. **Given** `src/stores/useSettingsStore.ts`, **When** reviewed, **Then** it exposes `hardMode: boolean` and `deuteranopia: boolean` as reactive state **And** it contains no localStorage access directly

3. **Given** `src/stores/usePersistenceStore.ts`, **When** reviewed, **Then** it is the only file in the codebase that calls `localStorage.getItem` or `localStorage.setItem` **And** all reads use a `safeRead<T>(key, fallback)` pattern wrapped in try/catch **And** it exposes a reactive `storageError: boolean` flag that is set `true` when any read fails (NFR12)

4. **Given** `usePersistenceStore` and the `myrdle_` key schema, **When** `myrdle_settings`, `myrdle_streak`, or `myrdle_game_YYYY-MM-DD` keys are read from localStorage, **Then** each key is validated independently — corruption in one key does not affect reads of other keys **And** a missing or unparseable key returns the defined fallback value without throwing

5. **Given** `src/types/game.ts`, `src/types/persistence.ts`, and `src/types/etymology.ts`, **When** reviewed, **Then** `TileState` is defined as `'empty' | 'filled' | 'correct' | 'present' | 'absent'` **And** `GamePhase` is defined as an enum with at minimum `PLAYING`, `WON`, `LOST` values **And** no file in the project uses raw strings where `TileState` or `GamePhase` are appropriate

6. **Given** `src/constants/game.ts` and `src/constants/timing.ts`, **When** reviewed, **Then** `WORD_LENGTH`, `MAX_GUESSES`, and `EPOCH_DATE` are defined in `game.ts` **And** `AUTO_ADVANCE_MS`, `TILE_FLIP_MS`, `TILE_STAGGER_MS`, and `BOARD_DIM_MS` are defined in `timing.ts` **And** no component or composable contains hardcoded numeric timing values

## Tasks / Subtasks

- [x] Task 1: Populate `src/types/persistence.ts` and `src/types/etymology.ts` (AC: 5)
  - [x] 1.1: Define `SettingsData`, `StreakData`, `GameRecord` interfaces in `persistence.ts`
  - [x] 1.2: Define `EtymologyEntry` and `EtymologyMap` types in `etymology.ts`

- [x] Task 2: Populate `src/constants/timing.ts` (AC: 6)
  - [x] 2.1: Define `TILE_FLIP_MS = 400`, `TILE_STAGGER_MS = 100`, `BOARD_DIM_MS = 500`, `AUTO_ADVANCE_MS = 4000`

- [x] Task 3: Implement `src/stores/useSettingsStore.ts` (AC: 2)
  - [x] 3.1: Expose `hardMode` and `deuteranopia` as `ref<boolean>` with setter actions
  - [x] 3.2: No localStorage access — settings read/write delegated to `usePersistenceStore`

- [x] Task 4: Implement `src/stores/usePersistenceStore.ts` (AC: 3, 4)
  - [x] 4.1: Implement `safeRead<T>` pattern (try/catch, returns fallback on any failure)
  - [x] 4.2: Implement `loadSettings`, `saveSettings`, `loadStreak`, `saveStreak`, `loadGame`, `saveGame`
  - [x] 4.3: Each key read independently — `myrdle_settings`, `myrdle_streak`, `myrdle_game_YYYY-MM-DD`
  - [x] 4.4: Expose reactive `storageError: boolean` flag

- [x] Task 5: Implement `src/stores/useGameStore.ts` (AC: 1)
  - [x] 5.1: Reactive state only: `boardState`, `activeRow`, `currentInput`, `funnelData`, `answerWord`
  - [x] 5.2: Delegate all logic to `useGameEngine` — `getTileStates`, `isValidWord`, `isHardModeValid`, `getValidWordsRemaining`, `getAnswerForDate`
  - [x] 5.3: Implement `initGame`, `restoreGame`, `typeChar`, `deleteLast`, `submitGuess` actions
  - [x] 5.4: `submitGuess` returns `{ valid, hardModeViolation }` — no logic leaking to components

- [x] Task 6: Verify TypeScript strict mode compliance (AC: 5, 6)
  - [x] 6.1: `npx vue-tsc --noEmit` passes with zero errors
  - [x] 6.2: No `any` usage — `unknown` + type guards at all data boundaries
