# Story 4.2: Streak Logic

Status: done

## Story

As a player,
I want my streak to increment when I solve and reset when I fail or miss a day,
So that the quiet motivator reflects my actual daily practice accurately.

## Acceptance Criteria

1. **Given** the player solves today's puzzle **When** `gamePhase` transitions to `WON` **Then** `usePersistenceStore` increments `myrdle_streak.count` by 1 and sets `lastSolvedDate` to today's UTC date (FR19)
   **And** `StreakBadge.vue` updates to reflect the new count immediately

2. **Given** the player fails today's puzzle (6 guesses, no solve) **When** `gamePhase` transitions to `LOST` **Then** `usePersistenceStore` resets `myrdle_streak.count` to 0 (FR20)
   **And** `StreakBadge.vue` displays 0 calmly — no animation, no shame state (UX-DR11)

3. **Given** the player opens the app and `myrdle_streak.lastSolvedDate` is not yesterday or today in UTC **When** the streak is read on load **Then** `myrdle_streak.count` is reset to 0 — a missed day breaks the streak (FR20)

4. **Given** streak date comparison logic **When** the player's device is in any timezone **Then** "today" and "yesterday" are always evaluated in UTC — not local time — so a midnight timezone edge case cannot incorrectly reset or preserve the streak (NFR13)

5. **Given** the player solves the puzzle and the streak increments **When** the page is reloaded **Then** the incremented streak count is still displayed — it persisted correctly (FR18, NFR9)

## Tasks / Subtasks

- [x] Task 1: Add reactive streak state and action methods to `usePersistenceStore` (AC: 1, 2, 3, 4, 5)
  - [x] 1.1: Add `streakData = ref<StreakData>({ ...DEFAULT_STREAK })` initialized from localStorage using IIFE with same try/catch pattern as `loadStreak()` — initialize it inline so `storageError` is set correctly on corrupt data
  - [x] 1.2: Update `saveStreak(data)` to also set `streakData.value = { ...data }` BEFORE calling `safeWrite` — keeps reactive ref in sync
  - [x] 1.3: Add private helper `isYesterdayUTC(dateStr: string, todayStr: string): boolean` — compute yesterday from todayStr as UTC date, compare to dateStr
  - [x] 1.4: Add `updateStreakOnWin(todayDate: string): void` — increment `streakData.value.count` by 1, set `lastSolvedDate` to `todayDate`, call `saveStreak`
  - [x] 1.5: Add `updateStreakOnLoss(): void` — set `streakData.value.count` to 0 (do NOT update `lastSolvedDate`), call `saveStreak`
  - [x] 1.6: Add `checkAndMaybeResetStreak(todayDate: string): void` — if `lastSolvedDate` is empty, today, or yesterday (UTC), do nothing; otherwise reset count to 0 and call `saveStreak`
  - [x] 1.7: Expose `streakData`, `updateStreakOnWin`, `updateStreakOnLoss`, `checkAndMaybeResetStreak` in the return object

- [x] Task 2: Wire streak logic into `useGameStore` (AC: 1, 2, 3)
  - [x] 2.1: In `submitGuess`, after `boardState.value` is set and `persistenceStore.saveGame` is called: if `won` → call `persistenceStore.updateStreakOnWin(todayDate.value)`; else if `lost` → call `persistenceStore.updateStreakOnLoss()`
  - [x] 2.2: In `initGame`, after setting initial state, call `persistenceStore.checkAndMaybeResetStreak(date)`
  - [x] 2.3: In `restoreFromRecord`, after calling `restoreGame(...)`, call `persistenceStore.checkAndMaybeResetStreak(date)`
  - [x] 2.4: Update the `usePersistenceStore` mock in `useGameStore.test.ts` to include `updateStreakOnWin`, `updateStreakOnLoss`, `checkAndMaybeResetStreak` as `vi.fn()` mocks

- [x] Task 3: Make `StreakBadge.vue` reactive (AC: 1, 2)
  - [x] 3.1: Change import from `{ ref }` to `{ computed }` in `<script setup>`
  - [x] 3.2: Replace `const count = ref(persistenceStore.loadStreak().count)` with `const count = computed(() => persistenceStore.streakData.count)`
  - [x] 3.3: No template changes needed — `count` is already used in template; `computed` is transparent

- [x] Task 4: Write tests (AC: 1–5)
  - [x] 4.1: `usePersistenceStore.test.ts` — `updateStreakOnWin`: increments count, sets lastSolvedDate, persists to localStorage
  - [x] 4.2: `usePersistenceStore.test.ts` — `updateStreakOnWin`: called twice → count is 2
  - [x] 4.3: `usePersistenceStore.test.ts` — `updateStreakOnLoss`: resets count to 0, does NOT update lastSolvedDate, persists to localStorage
  - [x] 4.4: `usePersistenceStore.test.ts` — `checkAndMaybeResetStreak`: no reset when lastSolvedDate is today
  - [x] 4.5: `usePersistenceStore.test.ts` — `checkAndMaybeResetStreak`: no reset when lastSolvedDate is yesterday (UTC)
  - [x] 4.6: `usePersistenceStore.test.ts` — `checkAndMaybeResetStreak`: resets count to 0 when lastSolvedDate is 2+ days ago
  - [x] 4.7: `usePersistenceStore.test.ts` — `checkAndMaybeResetStreak`: no reset (and no error) when lastSolvedDate is empty string
  - [x] 4.8: `usePersistenceStore.test.ts` — `streakData` reactive ref reflects updated count after `updateStreakOnWin`
  - [x] 4.9: `useGameStore.test.ts` — `submitGuess` with winning guess calls `updateStreakOnWin` with `todayDate`
  - [x] 4.10: `useGameStore.test.ts` — `submitGuess` with non-winning guess does NOT call `updateStreakOnWin` or `updateStreakOnLoss`
  - [x] 4.11: `useGameStore.test.ts` — `submitGuess` on 6th wrong guess calls `updateStreakOnLoss`
  - [x] 4.12: `useGameStore.test.ts` — `initGame` calls `checkAndMaybeResetStreak`
  - [x] 4.13: `useGameStore.test.ts` — `restoreFromRecord` calls `checkAndMaybeResetStreak`
  - [x] 4.14: `StreakBadge.test.ts` — count updates reactively when `persistenceStore.streakData.count` changes (mount badge, update store, assert DOM reflects new value)
  - [x] 4.15: Run `npm run test:unit` — all 222 pre-existing tests must still pass

## Dev Notes

### Critical: What Already Exists — Do NOT Reinvent

`usePersistenceStore` at `src/stores/usePersistenceStore.ts` already has:
- `loadStreak(): StreakData` — reads from localStorage, returns default on missing/corrupt
- `saveStreak(data: StreakData): void` — writes via `safeWrite`, sets `storageError` on failure
- `DEFAULT_STREAK: StreakData = { count: 0, lastSolvedDate: '' }`
- `KEYS.streak = 'myrdle_streak'`
- `storageError: Ref<boolean>` — reactive, already exposed

`src/types/persistence.ts` already defines:
```ts
interface StreakData {
  count: number
  lastSolvedDate: string // YYYY-MM-DD UTC
}
```

`StreakBadge.vue` at `src/components/ui/StreakBadge.vue` — currently uses a non-reactive one-time read. This is the root cause of AC1/2 (badge won't update without this fix).

`useGameStore` already has `todayDate.value` (set by `initGame`/`restoreGame`) available in `submitGuess`.

### Reactive `streakData` Initialization Pattern

Initialize `streakData` in the store using an IIFE so `storageError` can be set on corrupt data:

```ts
const storageError = ref(false)

const streakData = ref<StreakData>((() => {
  try {
    const raw = localStorage.getItem(KEYS.streak)
    if (!raw) return { ...DEFAULT_STREAK }
    return JSON.parse(raw) as StreakData
  } catch {
    storageError.value = true
    return { ...DEFAULT_STREAK }
  }
})())
```

This must come AFTER `storageError` is defined. The existing `loadStreak()` method can remain unchanged — it still reads from localStorage for backward compatibility. The reactive ref is the new source of truth for components.

### `saveStreak` Update

Update `saveStreak` to keep the reactive ref in sync:
```ts
function saveStreak(data: StreakData): void {
  streakData.value = { ...data }  // update reactive ref FIRST
  if (!safeWrite(KEYS.streak, data)) {
    storageError.value = true
  }
}
```

### UTC Date Helper

```ts
function isYesterdayUTC(dateStr: string, todayStr: string): boolean {
  const today = new Date(todayStr + 'T00:00:00Z')
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  return yesterday.toISOString().slice(0, 10) === dateStr
}
```

This is a private function inside `usePersistenceStore` (not exported). Never use `new Date()` with no args for "today" — always use the `todayDate` parameter passed in from `useGameStore` to keep UTC discipline.

### Streak Action Methods

```ts
function updateStreakOnWin(todayDate: string): void {
  const updated: StreakData = {
    count: streakData.value.count + 1,
    lastSolvedDate: todayDate,
  }
  saveStreak(updated)
}

function updateStreakOnLoss(): void {
  const updated: StreakData = {
    count: 0,
    lastSolvedDate: streakData.value.lastSolvedDate, // preserve, do NOT clear
  }
  saveStreak(updated)
}

function checkAndMaybeResetStreak(todayDate: string): void {
  const last = streakData.value.lastSolvedDate
  if (!last) return // never solved — nothing to reset
  if (last === todayDate) return // solved today — keep streak
  if (isYesterdayUTC(last, todayDate)) return // solved yesterday — still active
  // missed a day
  saveStreak({ count: 0, lastSolvedDate: last })
}
```

### Wiring in `submitGuess`

Place streak calls AFTER `persistenceStore.saveGame(...)` and BEFORE the `return`:

```ts
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
```

`won` and `lost` are already computed above `boardState.value` assignment — use them directly.

### Wiring in `initGame` and `restoreFromRecord`

```ts
function initGame(date: string): void {
  // ... existing init code ...
  persistenceStore.checkAndMaybeResetStreak(date)  // ADD at end
}

function restoreFromRecord(date: string, record: GameRecord): void {
  const answer = engine.getAnswerForDate(date)
  const tileStates = record.guesses.map((guess) => engine.getTileStates(guess, answer))
  restoreGame(date, record.guesses, tileStates, record.funnelData, record.solved)
  persistenceStore.checkAndMaybeResetStreak(date)  // ADD at end
}
```

### `StreakBadge.vue` Fix

```ts
// Before:
import { ref } from 'vue'
const count = ref(persistenceStore.loadStreak().count)

// After:
import { computed } from 'vue'
const count = computed(() => persistenceStore.streakData.count)
```

No template changes. The `count` binding in the template works identically for both `ref` and `computed`.

### `useGameStore.test.ts` Mock Update

The existing mock covers `saveGame` and `storageError`. Add the three new methods:

```ts
const mockUpdateStreakOnWin = vi.fn()
const mockUpdateStreakOnLoss = vi.fn()
const mockCheckAndMaybeResetStreak = vi.fn()

vi.mock('./usePersistenceStore', () => ({
  usePersistenceStore: () => ({
    saveGame: mockSaveGame,
    storageError: { value: false },
    updateStreakOnWin: mockUpdateStreakOnWin,
    updateStreakOnLoss: mockUpdateStreakOnLoss,
    checkAndMaybeResetStreak: mockCheckAndMaybeResetStreak,
  }),
}))
```

Add all three mock fns to `beforeEach` `.mockClear()` calls. All existing tests must still pass — they don't assert absence of streak calls, so adding the mocks is non-breaking.

### Test: 6th Guess LOST Scenario

To test that `updateStreakOnLoss` is called, you need to submit 6 wrong guesses. Use `store.initGame('2025-01-01')` and get `store.answerWord`. Submit 6 valid dictionary words that are NOT the answer:

```ts
// Submit 6 valid words that are not the answer
const wrongWords = ['crane', 'stale', 'light', 'drink', 'flump', 'bumps']
// Filter out any that might be the answer
```

Because the test needs to trigger `GamePhase.LOST`, use `restoreGame` directly with 5 pre-loaded guesses, then submit one more:

```ts
store.restoreGame(date, ['crane','stale','light','drink','flump'], [...tileStates], [100,80,60,40,20], false)
// now add one more valid non-answer word to hit 6 guesses
```

Or: mock `engine.isValidWord` to return true for any 5-letter string and submit a word you know is wrong.

### StreakBadge Reactivity Test

```ts
it('updates count reactively when persistenceStore.streakData changes', async () => {
  const wrapper = mount(StreakBadge, { global: { plugins: [pinia] } })
  expect(wrapper.text()).toBe('0')

  const store = usePersistenceStore()
  store.streakData.count = 5  // or call updateStreakOnWin and check
  await nextTick()

  expect(wrapper.text()).toBe('5')
})
```

This requires importing `nextTick` from vue and `usePersistenceStore` from the store.

### Pinia Store Style

All stores use composition style (`defineStore('id', () => { ... })`). Never switch to options style. Do NOT call `useGameStore()` from inside `usePersistenceStore` — avoid circular store dependencies.

### File Structure

| File | Action |
|------|--------|
| `src/stores/usePersistenceStore.ts` | MODIFY — add reactive `streakData`, update `saveStreak`, add `updateStreakOnWin`, `updateStreakOnLoss`, `checkAndMaybeResetStreak`, `isYesterdayUTC` helper |
| `src/stores/useGameStore.ts` | MODIFY — wire `updateStreakOnWin`/`updateStreakOnLoss` in `submitGuess`, wire `checkAndMaybeResetStreak` in `initGame` and `restoreFromRecord` |
| `src/components/ui/StreakBadge.vue` | MODIFY — replace `ref` with `computed` for reactive count |
| `src/stores/usePersistenceStore.test.ts` | MODIFY — add streak action tests |
| `src/stores/useGameStore.test.ts` | MODIFY — extend mock, add streak wiring tests |
| `src/components/ui/StreakBadge.test.ts` | MODIFY — add reactivity test |

**Do NOT modify:**
- `src/types/persistence.ts` — `StreakData` is correct as-is
- `src/composables/useGameEngine.ts` — no streak logic here

> **Note:** `src/views/GameView.vue` was originally listed as "do not modify" but the implementation requires it: the `onMounted` restore-or-init branch and the `storageError` banner must be wired here. The "do not modify" note was an oversight in the original spec.

### Previous Story Intelligence (from 4.1)

- **222 tests pass** after story 4.1. Confirm all 222 still pass.
- `useGameStore.test.ts` mocks `usePersistenceStore` with `vi.mock` — the mock must be extended (not replaced) for this story. Existing mock structure: `vi.mock('./usePersistenceStore', () => ({ usePersistenceStore: () => ({...}) }))` — add new fns to the returned object.
- `usePersistenceStore.test.ts` uses `localStorage.clear()` in `beforeEach` and real jsdom localStorage — follow same pattern for streak tests.
- Pinia: `setActivePinia(createPinia())` in `beforeEach` for every store test.
- `StreakBadge.test.ts` already imports `setActivePinia` and `createPinia` — follow existing setup.
- `StreakBadge.vue` already imports `usePersistenceStore` — the `computed` import replaces `ref` (same import line, just different named export).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#localStorage Schema]
- [Source: _bmad-output/planning-artifacts/architecture.md#Store Architecture]
- [Source: src/stores/usePersistenceStore.ts — loadStreak, saveStreak, DEFAULT_STREAK, KEYS]
- [Source: src/types/persistence.ts — StreakData shape]
- [Source: src/stores/useGameStore.ts — submitGuess, initGame, restoreFromRecord, todayDate]
- [Source: src/components/ui/StreakBadge.vue — current non-reactive implementation]
- [Source: FR18, FR19, FR20, NFR9, NFR13, UX-DR11]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `GameView.test.ts` mock for `usePersistenceStore` was missing `streakData` and the three new streak methods — added them to fix 17 failing tests. The mock is `reactive`, so `streakData: { count: 0, lastSolvedDate: '' }` unwraps correctly without needing a separate `ref`.

### Completion Notes List

- **Task 1**: Added `streakData` reactive ref (IIFE-initialized from localStorage), updated `saveStreak` to keep ref in sync, added `isYesterdayUTC` private helper, `updateStreakOnWin`, `updateStreakOnLoss`, `checkAndMaybeResetStreak` — all exposed in return object.
- **Task 2**: Wired `updateStreakOnWin`/`updateStreakOnLoss` after `saveGame` in `submitGuess`; wired `checkAndMaybeResetStreak` at end of `initGame` and `restoreFromRecord`; extended `useGameStore.test.ts` mock with three new vi.fn() mocks.
- **Task 3**: Replaced `ref(persistenceStore.loadStreak().count)` with `computed(() => persistenceStore.streakData.count)` in `StreakBadge.vue` — single import swap, no template changes.
- **Task 4**: Added 8 tests to `usePersistenceStore.test.ts`, 5 tests to `useGameStore.test.ts`, 1 test to `StreakBadge.test.ts`. All 236 tests pass (222 pre-existing + 14 new).

### File List

- `src/stores/usePersistenceStore.ts`
- `src/stores/useGameStore.ts`
- `src/components/ui/StreakBadge.vue`
- `src/stores/usePersistenceStore.test.ts`
- `src/stores/useGameStore.test.ts`
- `src/components/ui/StreakBadge.test.ts`
- `src/views/GameView.test.ts`

## Change Log

- 2026-03-21: Story 4.2 created — streak logic: reactive store state, win/loss/missed-day handlers, StreakBadge reactivity fix.
- 2026-03-21: Story 4.2 implemented — all tasks complete, 236 tests pass.
