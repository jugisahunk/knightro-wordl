# Story 4.1: Game State Persistence and Restore

Status: done

## Story

As a player,
I want my puzzle progress saved automatically and restored when I return to the app,
so that a page reload, tab close, or browser restart never loses my in-progress or completed game.

## Acceptance Criteria

1. **Given** the player has submitted one or more guesses **When** the page is reloaded **Then** the board restores with all previously submitted rows intact and `currentInput` cleared to empty (FR25, NFR10)
   **And** the game phase is `PLAYING` — the puzzle continues from where it left off

2. **Given** the player has completed today's puzzle (WON or LOST) **When** the page is reloaded **Then** the board restores in its completed state with all guesses and tile states visible (FR24, NFR9)
   **And** the game phase is `WON` or `LOST` — no new input is accepted

3. **Given** a valid guess is submitted **When** `submitGuess` completes successfully **Then** `usePersistenceStore.saveGame(date, record)` is called immediately — not deferred (NFR10)
   **And** the saved record includes `guesses: string[]`, `solved: boolean`, and `funnelData: number[]`

4. **Given** the player opens the app on a new calendar day **When** `usePersistenceStore.loadGame(todayDate)` is called **Then** `null` is returned — no previous day's game is loaded — a fresh board is presented (FR1)
   **And** the previous day's key remains in localStorage untouched

5. **Given** `usePersistenceStore.loadGame(date)` is called for the first time today **When** the key is absent **Then** `null` is returned with no error and no `storageError` — a clean fresh board is presented (FR25)

6. **Given** `myrdle_game_YYYY-MM-DD` contains malformed JSON **When** `loadGame` reads it **Then** `storageError` is set to `true` and `null` is returned — game initializes fresh (NFR12)

7. **Given** `persistenceStore.storageError` is `true` **When** `GameView.vue` renders **Then** a visible error banner is shown: `"Unable to load saved data — your progress may be affected"` (NFR12)
   **And** the board renders in a clean, playable initial state — the error does not block gameplay

8. **Given** `persistenceStore.storageError` is `false` **When** `GameView.vue` renders **Then** no error banner is visible

## Tasks / Subtasks

- [x] Task 1: Add `restoreFromRecord(date, record)` action to `useGameStore` (AC: 1, 2)
  - [x] 1.1: Add action that calls `engine.getAnswerForDate(date)` then maps `record.guesses` through `engine.getTileStates(guess, answer)` to reconstruct `tileStates`
  - [x] 1.2: Call existing `restoreGame(date, record.guesses, tileStates, record.funnelData, record.solved)` internally
  - [x] 1.3: Do NOT modify the existing `restoreGame` or `initGame` signatures

- [x] Task 2: Wire save into `submitGuess` in `useGameStore` (AC: 3)
  - [x] 2.1: Call `usePersistenceStore()` inside `useGameStore` at store init
  - [x] 2.2: After a valid guess (when `result.valid` would be `true`), call `persistenceStore.saveGame(todayDate.value, { guesses: newGuesses, solved: won, funnelData: newFunnel })` — save BEFORE returning
  - [x] 2.3: If `saveGame` fails (sets `storageError` internally), do not throw — `safeWrite` handles failure silently

- [x] Task 3: Wire restore into `GameView.vue` on mount (AC: 1, 2, 4, 5)
  - [x] 3.1: Import `usePersistenceStore` in `GameView.vue`
  - [x] 3.2: Replace the existing `onMounted` body:
    ```ts
    onMounted(() => {
      const date = getTodayUTC()
      const record = persistenceStore.loadGame(date)
      if (record) {
        store.restoreFromRecord(date, record)
      } else {
        store.initGame(date)
      }
    })
    ```
  - [x] 3.3: `getTodayUTC()` already exists in `GameView.vue` — do NOT duplicate it

- [x] Task 4: Add `storageError` banner to `GameView.vue` (AC: 7, 8)
  - [x] 4.1: Bind `persistenceStore.storageError` in the template
  - [x] 4.2: Render `<p v-if="persistenceStore.storageError" class="storage-error">Unable to load saved data — your progress may be affected</p>` inside `.game-root`, above `.board-area`
  - [x] 4.3: Add minimal CSS for `.storage-error` — centered, `color: var(--color-text-secondary)`, `font-size: 0.75rem`
  - [x] 4.4: Do NOT add animation or auto-dismiss — static text only per NFR12

- [x] Task 5: Write tests (AC: 1–8)
  - [x] 5.1: `useGameStore.test.ts` — add tests for `restoreFromRecord`: verifies phase, guesses, tileStates, funnelData, answerWord all set correctly
  - [x] 5.2: `useGameStore.test.ts` — add test that `submitGuess` calls `persistenceStore.saveGame` with correct payload after valid guess; does NOT call it after invalid guess
  - [x] 5.3: `usePersistenceStore.test.ts` — add tests for `loadGame`/`saveGame` round-trip using real `localStorage` (jsdom provides it); test malformed JSON sets `storageError`; test missing key returns `null` without setting `storageError`
  - [x] 5.4: `GameView.test.ts` — add test that mount with a mocked record calls `restoreFromRecord`; add test that mount without a record calls `initGame`; add test that `storageError = true` shows the banner; add test that `storageError = false` hides it
  - [x] 5.5: Run `npm run test:unit` — all 192 pre-existing tests must still pass (222 total pass)

## Dev Notes

### Critical: What Already Exists — Do NOT Reinvent

`usePersistenceStore` is **fully implemented** at `src/stores/usePersistenceStore.ts`. It already has:
- `loadGame(date: string): GameRecord | null` — returns `null` on missing key (no error) or parse failure (sets `storageError`)
- `saveGame(date: string, data: GameRecord): void` — writes via `safeWrite`, sets `storageError` on quota/security failure
- `storageError: Ref<boolean>` — reactive, used for banner display
- Internal `safeRead<T>` and `safeWrite` helpers — do NOT call these directly from outside the store

`src/types/persistence.ts` already defines:
```ts
interface GameRecord {
  guesses: string[]
  solved: boolean
  funnelData: number[]
}
```

`useGameStore` already has:
- `restoreGame(date, guesses, tileStates, funnel, solved)` — KEEP this signature unchanged, it's tested
- `initGame(date)` — KEEP this as-is for fresh start
- `engine = useGameEngine()` — already available inside the store for tileState reconstruction

### The TileStates Gap — Critical Implementation Detail

`GameRecord` does NOT store `tileStates`. But `restoreGame` requires them. The new `restoreFromRecord` action must reconstruct them:

```ts
function restoreFromRecord(date: string, record: GameRecord): void {
  const answer = engine.getAnswerForDate(date)
  const tileStates = record.guesses.map((guess) => engine.getTileStates(guess, answer))
  restoreGame(date, record.guesses, tileStates, record.funnelData, record.solved)
}
```

`engine.getTileStates(guess, answer)` returns `GuessResult` (`TileState[]`). This is the same function used during gameplay — reconstruction is deterministic.

### Save in `submitGuess` — Timing Detail

Save BEFORE returning from `submitGuess`. Use the local variables `newGuesses`, `won`, `newFunnel` that are already computed — do not read from `boardState.value` after the assignment as it may cause reactivity timing issues. The save call:

```ts
persistenceStore.saveGame(todayDate.value, {
  guesses: newGuesses,
  solved: won,
  funnelData: newFunnel,
})
```

This goes after the `boardState.value = { ... }` assignment, before `return { valid: true, hardModeViolation: false }`.

### localStorage Key Format

`myrdle_game_YYYY-MM-DD` — the date portion comes from `todayDate.value` (already set in `initGame`/`restoreGame`). `getTodayUTC()` in `GameView.vue` returns this format — it is the source of truth for the date string.

### Test Mocking Approach

`usePersistenceStore` tests: jsdom provides a working `localStorage`. Use `localStorage.clear()` in `beforeEach`. Use `localStorage.setItem(key, JSON.stringify(value))` to set up state; use `localStorage.getItem(key)` to verify saves. Do NOT mock `localStorage` — use it directly.

`useGameStore` tests: mock `usePersistenceStore` with `vi.mock('@/stores/usePersistenceStore', ...)`. Spy on `saveGame` to verify call count and arguments. Provide a mock `loadGame` return value.

`GameView.test.ts`: `usePersistenceStore` is already imported in `GameView.vue` — add a `vi.mock` for it alongside the existing mocks. The existing mock for `usePostSolveTransition` shows the pattern.

### `<script setup>` Import Order

Follow the established pattern from story 3.3/3.4 convention: imports → defineProps/defineEmits → refs/stores → computed → functions → lifecycle hooks.

### File Structure

| File | Action |
|------|--------|
| `src/stores/useGameStore.ts` | MODIFY — add `restoreFromRecord`, wire `saveGame` in `submitGuess` |
| `src/views/GameView.vue` | MODIFY — wire restore on mount, add `storageError` banner |
| `src/stores/useGameStore.test.ts` | MODIFY — add restore and save tests |
| `src/stores/usePersistenceStore.test.ts` | MODIFY (or CREATE if absent) — add loadGame/saveGame tests |
| `src/views/GameView.test.ts` | MODIFY — add restore path and banner tests |

**Do NOT modify:**
- `src/stores/usePersistenceStore.ts` — already fully implemented
- `src/types/persistence.ts` — `GameRecord` type is correct as-is
- `src/composables/useGameEngine.ts` — consume `getTileStates` and `getAnswerForDate` as-is

### Previous Story Intelligence (from 3.4)

- **192 tests pass** after story 3.4. Confirm all 192 still pass after this story.
- `GameView.vue` already has `usePostSolveTransition` mock in `GameView.test.ts` — new `usePersistenceStore` mock goes alongside it in the same `vi.mock` block pattern.
- `useGameStore` tests use `setActivePinia(createPinia())` in `beforeEach` — follow this pattern.
- Pinia composition style: `defineStore('id', () => { ... })` — the persistence store already follows this.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#localStorage Schema]
- [Source: _bmad-output/planning-artifacts/architecture.md#safeRead Pattern]
- [Source: _bmad-output/planning-artifacts/architecture.md#Store Architecture]
- [Source: src/stores/usePersistenceStore.ts — loadGame, saveGame, storageError API]
- [Source: src/types/persistence.ts — GameRecord shape]
- [Source: src/stores/useGameStore.ts — restoreGame, initGame, submitGuess, engine]
- [Source: src/views/GameView.vue — getTodayUTC, onMounted, existing mock patterns]
- [Source: FR24, FR25, NFR9, NFR10, NFR12]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Added `restoreFromRecord(date, record)` to `useGameStore` — reconstructs `tileStates` deterministically from `engine.getTileStates` then delegates to existing `restoreGame`. No existing signatures modified.
- Wired `persistenceStore.saveGame` into `submitGuess` — saves after board state is set, using local `newGuesses`/`won`/`newFunnel` variables per timing guidance. Save failures handled silently by `safeWrite`.
- Updated `GameView.vue` `onMounted` — calls `loadGame(date)`, routes to `restoreFromRecord` or `initGame` based on result.
- Added `storageError` banner in `GameView.vue` template (static, no animation) with `.storage-error` CSS.
- Created `useGameStore.test.ts` (14 tests) and `usePersistenceStore.test.ts` (8 tests); extended `GameView.test.ts` with 8 new tests covering restore paths and banner. 30 new tests total, all pass. Pre-existing 192 tests remain green (222 total).

### File List

- src/stores/useGameStore.ts
- src/views/GameView.vue
- src/stores/useGameStore.test.ts
- src/stores/usePersistenceStore.test.ts
- src/views/GameView.test.ts

## Change Log

- 2026-03-21: Implemented story 4.1 — game state persistence and restore. Added `restoreFromRecord` to `useGameStore`, wired `saveGame` into `submitGuess`, updated `GameView.vue` mount logic, added `storageError` banner. Created store test files; 30 new tests, 222 total passing.
