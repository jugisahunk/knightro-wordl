# Story 4.4: Storage Corruption Handling

Status: done

## Story

As a player,
I want the app to tell me clearly if my saved data can't be read, and still show me a working board,
So that a storage failure never leaves me with a broken or silently incorrect game state.

## Acceptance Criteria

1. **Given** `localStorage.getItem('myrdle_streak')` returns a malformed JSON string **When** `usePersistenceStore` reads the key **Then** `storageError` is set to `true` **And** streak falls back to `{ count: 0, lastSolvedDate: '' }` **And** no unhandled exception is thrown (NFR12)

2. **Given** `localStorage.getItem('myrdle_game_YYYY-MM-DD')` returns a malformed JSON string **When** `usePersistenceStore` reads the key **Then** `storageError` is set to `true` **And** a clean initial board state (`null`) is returned — not an incorrect or partial state (NFR12)

3. **Given** `storageError` is `true` in `usePersistenceStore` **When** `GameView.vue` renders **Then** a visible error message is displayed: "Unable to load saved data — your progress may be affected" (NFR12) **And** the board renders in a clean, playable initial state — the error does not block gameplay

4. **Given** `storageError` is `false` **When** `GameView.vue` renders **Then** no error message is shown — the error UI is invisible under normal conditions

5. **Given** `myrdle_settings` is corrupted but `myrdle_streak` is valid **When** both keys are read **Then** only `myrdle_settings` falls back to defaults — `myrdle_streak` reads correctly **And** `storageError` is set to `true` (corruption in one key does not suppress reporting)

## Tasks / Subtasks

- [x] Task 1: Add streak corruption unit tests to `src/stores/usePersistenceStore.test.ts` (AC: 1)
  - [x] 1.1: Test — `loadStreak()` with malformed JSON: set `myrdle_streak` to `'not-valid-json{{{'`, call `store.loadStreak()`, assert result equals `{ count: 0, lastSolvedDate: '' }` AND `store.storageError` is `true`
  - [x] 1.2: Test — `streakData` IIFE on store instantiation with malformed streak: set `myrdle_streak` to malformed JSON BEFORE calling `usePersistenceStore()`, assert `store.storageError` is `true` AND `store.streakData.count` is `0`
  - [x] 1.3: Test — absent `myrdle_streak` key does NOT set storageError: call `store.loadStreak()` with no key in localStorage, assert result equals default AND `store.storageError` is `false`

- [x] Task 2: Add settings corruption unit tests to `src/stores/usePersistenceStore.test.ts` (AC: 5)
  - [x] 2.1: Test — `loadSettings()` with malformed JSON: set `myrdle_settings` to `'corrupted{{{'`, call `store.loadSettings()`, assert result equals `{ hardMode: false, deuteranopia: false }` AND `store.storageError` is `true`
  - [x] 2.2: Test — absent `myrdle_settings` key does NOT set storageError: call `store.loadSettings()` with no key, assert result is defaults AND `store.storageError` is `false`
  - [x] 2.3: Test — independent key isolation (AC5): set `myrdle_settings` to malformed JSON AND set `myrdle_streak` to valid JSON `{ count: 3, lastSolvedDate: '2026-03-20' }`, call `store.loadSettings()` then `store.loadStreak()`, assert `store.storageError` is `true` AND streak result has `count: 3`

- [x] Task 3: Run full test suite (AC: all)
  - [x] 3.1: Run `npm run test:unit` — all existing tests must still pass (current count: 236), plus all new tests must pass

## Dev Notes

### CRITICAL: What Already Exists — Implementation is Complete, Only Tests Are Missing

**The corruption-handling implementation already ships in the codebase. Do NOT modify the implementation.**

`src/stores/usePersistenceStore.ts` already has:
- `storageError = ref(false)` reactive flag declared at store top
- `streakData` IIFE initialization with try/catch that sets `storageError.value = true` on parse failure
- `loadSettings()` with try/catch that sets `storageError.value = true` on parse failure
- `loadStreak()` with try/catch that sets `storageError.value = true` on parse failure
- `loadGame()` with try/catch that sets `storageError.value = true` on parse failure
- All keys are independent — corruption in one cannot affect reads of others

`src/views/GameView.vue` already has:
```html
<p v-if="persistenceStore.storageError" class="storage-error">Unable to load saved data — your progress may be affected</p>
```

`src/views/GameView.test.ts` already has 3 storageError banner tests (lines 207–236) — do NOT duplicate them.

`src/stores/usePersistenceStore.test.ts` already tests `loadGame()` malformed JSON (line 38–44) — do NOT duplicate.

**This story's work is entirely writing new unit tests for the untested paths (streak, settings).**

### Existing Test File Pattern (follow exactly)

[src/stores/usePersistenceStore.test.ts](src/stores/usePersistenceStore.test.ts) — follow the exact same describe/it structure:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePersistenceStore } from './usePersistenceStore'

const STREAK_KEY = 'myrdle_streak'
const SETTINGS_KEY = 'myrdle_settings'  // add this constant

describe('usePersistenceStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })
  // ... existing tests unchanged ...

  describe('loadStreak', () => {
    it('sets storageError and returns default on malformed JSON', () => {
      const store = usePersistenceStore()
      localStorage.setItem(STREAK_KEY, 'not-valid-json{{{')
      const result = store.loadStreak()
      expect(result).toEqual({ count: 0, lastSolvedDate: '' })
      expect(store.storageError).toBe(true)
    })
    // ... more tests
  })
})
```

**Key pattern:** `setActivePinia(createPinia())` in `beforeEach`, `localStorage.clear()` in `beforeEach`. To test the IIFE initialization path, set localStorage data BEFORE calling `usePersistenceStore()` (same pattern as existing `updateStreakOnLoss` test at line 79–90).

### streak IIFE Corruption Test (Task 1.2) — Exact Pattern

The `streakData` ref is initialized via an IIFE at store creation time. To trigger the IIFE error path:

```ts
it('sets storageError on store instantiation when myrdle_streak is malformed', () => {
  // Set malformed data BEFORE creating the store — IIFE runs on defineStore setup
  localStorage.setItem(STREAK_KEY, '{invalid-json')
  const store = usePersistenceStore()
  expect(store.storageError).toBe(true)
  expect(store.streakData.count).toBe(0)
  expect(store.streakData.lastSolvedDate).toBe('')
})
```

### Default Values (use these exact values in assertions)

```ts
const DEFAULT_STREAK = { count: 0, lastSolvedDate: '' }  // lastSolvedDate is '' not null
const DEFAULT_SETTINGS = { hardMode: false, deuteranopia: false }
```

Note: The epics spec says `lastSolvedDate: null` but `StreakData.lastSolvedDate` is typed as `string` in [src/types/persistence.ts](src/types/persistence.ts). The correct fallback is `''` (empty string), matching the store's `DEFAULT_STREAK`. Use `''` in test assertions.

### localStorage Key Constants

Defined in [src/stores/usePersistenceStore.ts](src/stores/usePersistenceStore.ts) (file-private, not exported):

```ts
const KEYS = {
  settings: 'myrdle_settings',
  streak: 'myrdle_streak',
  game: (date: string) => `myrdle_game_${date}`,
}
```

The test file already defines `GAME_KEY` and `STREAK_KEY` as local constants (lines 5–6). Add `SETTINGS_KEY = 'myrdle_settings'` for the new tests.

### Architecture Constraints

- **Only `usePersistenceStore` touches localStorage** — no other store, composable, or component reads/writes storage directly (architecture rule)
- `safeRead<T>` utility exists in the store but individual methods use their own try/catch with explicit `storageError.value = true` — this is correct and intentional
- `storageError` is a reactive `ref<boolean>` — components read it reactively via `persistenceStore.storageError`
- TypeScript strict mode: no `any`, use typed return values

### No e2e Tests Needed

This story adds only unit tests to `usePersistenceStore.test.ts`. The Playwright suite (`e2e/`) does not need changes.

### File Structure

| File | Action |
|------|--------|
| `src/stores/usePersistenceStore.test.ts` | MODIFY — add `describe('loadStreak')` and `describe('loadSettings')` blocks with corruption and isolation tests |

**Do NOT modify:**
- `src/stores/usePersistenceStore.ts` — implementation is complete
- `src/views/GameView.vue` — error banner already ships
- `src/views/GameView.test.ts` — banner tests already exist, do not duplicate
- Any e2e files — no e2e changes needed
- Any other source files

### Previous Story Intelligence (from 4.3)

- Unit test count after 4.3: **236 tests** in `src/`. All must still pass after adding new tests.
- New tests added in this story increment that count — final count should be 236 + number of new tests.
- Vitest setup uses `jsdom` environment; `localStorage` is available and `localStorage.clear()` works in `beforeEach`.
- `setActivePinia(createPinia())` in `beforeEach` is required — Pinia stores are stateful across tests otherwise.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns — localStorage corruption handling]
- [Source: src/stores/usePersistenceStore.ts — complete implementation]
- [Source: src/views/GameView.vue — storageError banner, lines 73]
- [Source: src/stores/usePersistenceStore.test.ts — existing test patterns to follow]
- [Source: src/views/GameView.test.ts — storageError banner tests already written, lines 207–236]
- [Source: src/types/persistence.ts — StreakData.lastSolvedDate typed as string]
- [Source: NFR12]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

No issues encountered. Implementation was already complete; story work was exclusively adding unit tests.

### Completion Notes List

- Added `SETTINGS_KEY` constant to test file
- Added `describe('loadStreak')` block with 3 tests covering: malformed JSON (AC1), IIFE instantiation path (AC1), absent key no-error
- Added `describe('loadSettings')` block with 3 tests covering: malformed JSON (AC5), absent key no-error, independent key isolation (AC5)
- All 6 new tests pass; full suite now 242 tests (236 → 242), zero regressions

### File List

- `src/stores/usePersistenceStore.test.ts`

## Change Log

- 2026-03-21: Story created — storage corruption handling; implementation already complete, story tasks are exclusively unit test additions for streak and settings corruption paths
- 2026-03-21: Implementation complete — added 6 unit tests to usePersistenceStore.test.ts covering streak and settings corruption paths; all 242 tests pass
