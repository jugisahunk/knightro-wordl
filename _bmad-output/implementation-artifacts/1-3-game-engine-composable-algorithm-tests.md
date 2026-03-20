# Story 1.3: Game Engine Composable & Algorithm Tests

Status: done

## Story

As a developer,
I want `useGameEngine` implemented as a pure TypeScript composable with full Vitest coverage,
so that the elimination algorithm, tile state derivation, and date logic are proven correct before any UI component depends on them.

## Acceptance Criteria

1. **Given** `src/composables/useGameEngine.ts`, **When** it is imported in a Vitest test file, **Then** it imports without error and has zero Vue dependencies (no `ref`, `computed`, or Vue imports)

2. **Given** `useGameEngine.isValidWord(word)`, **When** called with a word present in `valid-words.json`, **Then** it returns `true`; **When** called with a word not in `valid-words.json` or not exactly 5 letters, **Then** it returns `false` (FR4)

3. **Given** `useGameEngine.getTileStates(guess, answer)`, **When** called with a known guess and answer pair, **Then** it returns an array of 5 `TileState` values (`'correct' | 'present' | 'absent'`) matching expected Wordle rules (FR5), **And** it correctly handles duplicate letters per standard Wordle behavior

4. **Given** `useGameEngine.getValidWordsRemaining(guesses, tileStates)`, **When** called after each guess in a known solve sequence, **Then** it returns a `number[]` where each value is the count of valid words consistent with all constraints so far, strictly decreasing (or holding) as guesses are added (FR10), **And** the first value equals the full `valid-words.json` count when no guesses have been made

5. **Given** `useGameEngine.getAnswerForDate(date)`, **When** called with the same `YYYY-MM-DD` date string from two different timezone offsets (simulated), **Then** it returns the identical answer word both times (NFR13), **And** it returns a different answer for consecutive calendar dates

6. **Given** `useGameEngine.isHardModeValid(newGuess, previousGuesses, previousTileStates)`, **When** called with a guess that violates a revealed hard mode constraint, **Then** it returns `false` (FR7); **When** called with a guess that satisfies all revealed constraints, **Then** it returns `true`

7. **Given** all unit tests for `useGameEngine`, **When** `npm run test:unit` is executed, **Then** all tests pass with zero failures

## Tasks / Subtasks

- [x] Task 1: Populate `src/types/game.ts` with required types (AC: 1, 3, 6)
  - [x] Define `TileState` as `'empty' | 'filled' | 'correct' | 'present' | 'absent'`
  - [x] Define `GamePhase` as a `const enum` with values `PLAYING`, `WON`, `LOST`
  - [x] Define `GuessResult` as `TileState[]` (alias for an array of 5 TileState values)
  - [x] Define `BoardState` as `{ guesses: string[]; tileStates: GuessResult[]; gamePhase: GamePhase }`
  - [x] Export all types — these are consumed by Story 1.4 stores

- [x] Task 2: Populate `src/constants/game.ts` with required constants (AC: 4, 5)
  - [x] Define `WORD_LENGTH = 5` as `const`
  - [x] Define `MAX_GUESSES = 6` as `const`
  - [x] Define `EPOCH_DATE = '2021-06-19'` as `const` (UTC; matches canonical Wordle epoch)
  - [x] Export all constants — consumed by `useGameEngine` and Story 1.4 stores

- [x] Task 3: Implement `src/composables/useGameEngine.ts` (AC: 1, 2, 3, 4, 5, 6)
  - [x] Import `validWords` from `'../data/valid-words.json'` and `answers` from `'../data/answers.json'` — NO other imports from Vue
  - [x] Import `WORD_LENGTH`, `MAX_GUESSES`, `EPOCH_DATE` from `'../constants/game'`
  - [x] Import `TileState`, `GuessResult` from `'../types/game'`
  - [x] Build a `Set<string>` from `validWords` at module scope for O(1) lookup
  - [x] Implement `isValidWord(word: string): boolean`
  - [x] Implement `getTileStates(guess: string, answer: string): GuessResult` — two-pass duplicate letter algorithm (see Dev Notes)
  - [x] Implement `getValidWordsRemaining(guesses: string[], tileStates: GuessResult[]): number[]`
  - [x] Implement `getAnswerForDate(date: string): string` — UTC-normalized (see Dev Notes)
  - [x] Implement `isHardModeValid(newGuess: string, previousGuesses: string[], previousTileStates: GuessResult[]): boolean`
  - [x] Return a **plain object** (not array) with all five functions — named destructuring required by architecture

- [x] Task 4: Write `src/composables/useGameEngine.test.ts` (AC: 1–7)
  - [x] `isValidWord`: test a known valid word (e.g. 'crane'), a non-word, a 4-letter word, an uppercase word
  - [x] `getTileStates`: test all-correct (CRANE/CRANE → all 'correct'), all-absent, mixed, and duplicate letter cases (see Dev Notes for required edge cases)
  - [x] `getValidWordsRemaining`: test with zero guesses returns full valid-words count, test a known single-guess sequence that reduces count, verify returned array length equals guesses length
  - [x] `getAnswerForDate`: test EPOCH_DATE returns answers[0], test consecutive dates return different answers, test timezone invariance (same date string regardless of local offset)
  - [x] `isHardModeValid`: test guess that reuses a 'correct' letter in wrong position → false, test guess that ignores a 'present' letter → false, test valid guess that honors all constraints → true, test first guess (no history) → always true

## Dev Notes

### Critical: Zero Vue Dependencies

`useGameEngine` MUST have zero Vue imports. `ref`, `computed`, `watch`, `onMounted` — none of these belong here. The composable is pure TypeScript. This is verified by the test file importing it and running in a standard Node.js Vitest environment (no Vue test-utils required).

### getTileStates — Two-Pass Duplicate Letter Algorithm

Standard Wordle duplicate letter handling — the ONLY correct implementation:

```typescript
function getTileStates(guess: string, answer: string): GuessResult {
  const result: TileState[] = Array(WORD_LENGTH).fill('absent')
  const answerLetterPool = answer.split('')  // mutable pool for 'present' matching

  // Pass 1: mark 'correct' and remove matched letters from pool
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answer[i]) {
      result[i] = 'correct'
      answerLetterPool[i] = ''  // consume from pool
    }
  }

  // Pass 2: mark 'present' only if letter still in pool
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === 'correct') continue
    const poolIndex = answerLetterPool.indexOf(guess[i])
    if (poolIndex !== -1) {
      result[i] = 'present'
      answerLetterPool[poolIndex] = ''  // consume from pool
    }
  }

  return result as GuessResult
}
```

**Required duplicate letter test cases for the test file:**

| Guess | Answer | Expected |
|-------|--------|----------|
| `SPEED` | `SPELL` | `['correct','present','correct','absent','absent']` |
| `AABBB` | `BAAAA` | `['present','present','absent','absent','absent']` |
| `ABBEY` | `KEBAB` | `['absent','correct','absent','present','absent']` |

### getAnswerForDate — UTC-Normalized Date Logic

```typescript
function getAnswerForDate(date: string): string {
  // Both dates parsed as UTC midnight — timezone invariant
  const epoch = new Date(EPOCH_DATE).getTime()   // UTC midnight of epoch
  const target = new Date(date).getTime()         // UTC midnight of target date
  const MS_PER_DAY = 24 * 60 * 60 * 1000
  const dayOffset = Math.floor((target - epoch) / MS_PER_DAY)
  return answers[((dayOffset % answers.length) + answers.length) % answers.length]
}
```

**Why this is timezone-safe:** `new Date('YYYY-MM-DD')` (ISO 8601 date-only format) is always parsed as UTC midnight by spec — not local time. So `new Date('2024-01-15')` is identical regardless of the device's timezone offset.

**Test for timezone invariance:** Call `getAnswerForDate('2024-01-15')` and verify the result matches `answers[daysBetween('2021-06-19', '2024-01-15')]`. No timezone simulation needed — the function is inherently safe because of the UTC parsing behavior.

### getValidWordsRemaining — Elimination Algorithm

For each guess `i` (0-indexed), return the count of `validWords` that are consistent with ALL guesses `0..i`:

```typescript
function isWordConsistentWithConstraints(
  candidate: string,
  guesses: string[],
  tileStates: GuessResult[]
): boolean {
  for (let g = 0; g < guesses.length; g++) {
    const guess = guesses[g]
    const tiles = tileStates[g]
    for (let pos = 0; pos < WORD_LENGTH; pos++) {
      const letter = guess[pos]
      const state = tiles[pos]
      if (state === 'correct' && candidate[pos] !== letter) return false
      if (state === 'correct' && candidate[pos] === letter) continue
      if (state === 'present' && candidate[pos] === letter) return false  // must NOT be at this pos
      if (state === 'present' && !candidate.includes(letter)) return false  // must appear somewhere
      if (state === 'absent') {
        // Letter absent, but only if no other instance of same letter is 'correct'/'present'
        const letterAppearsElsewhere = tiles.some(
          (t, i) => i !== pos && guesses[g][i] === letter && (t === 'correct' || t === 'present')
        )
        if (!letterAppearsElsewhere && candidate.includes(letter)) return false
      }
    }
  }
  return true
}

function getValidWordsRemaining(guesses: string[], tileStates: GuessResult[]): number[] {
  return guesses.map((_, i) =>
    validWordsArray.filter(word =>
      isWordConsistentWithConstraints(word, guesses.slice(0, i + 1), tileStates.slice(0, i + 1))
    ).length
  )
}
```

**Performance note:** This iterates 12,972 words × guesses × 5 positions. Acceptable for unit tests. Story 1.4/Epic 3 optimization is out of scope here.

### isHardModeValid — Constraint Enforcement

Hard mode rules: every revealed 'correct' letter must appear in the same position in new guess; every revealed 'present' letter must appear somewhere in the new guess.

```typescript
function isHardModeValid(
  newGuess: string,
  previousGuesses: string[],
  previousTileStates: GuessResult[]
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
```

### Return Shape — Named Object (Architecture Mandate)

```typescript
export function useGameEngine() {
  return {
    isValidWord,
    getTileStates,
    getValidWordsRemaining,
    getAnswerForDate,
    isHardModeValid,
  }
}
```

Destructuring: `const { isValidWord, getTileStates } = useGameEngine()` — never array destructuring.

### JSON Import in TypeScript/Vite

```typescript
import validWordsJson from '../data/valid-words.json'
import answersJson from '../data/answers.json'

const validWordsArray = validWordsJson as string[]
const answers = answersJson as string[]
const validWordSet = new Set<string>(validWordsArray)  // O(1) lookup at module scope
```

`tsconfig.app.json` should already have `"resolveJsonModule": true` from the Vue scaffold.

### What This Story Does NOT Include

- Pinia stores → Story 1.4
- `src/constants/timing.ts` population → Story 1.4 (verify stub exists from Story 1.1)
- `src/types/persistence.ts` population → Story 1.4
- Any Vue components or templates
- `usePersistenceStore` or localStorage logic

### Project Structure Notes

- `src/composables/useGameEngine.ts` — new file (currently only `.gitkeep` exists in composables/)
- `src/composables/useGameEngine.test.ts` — co-located test file (`.test.ts` suffix per architecture)
- `src/types/game.ts` — replace stub comment with full type definitions
- `src/constants/game.ts` — replace stub comment with full constant definitions
- Do NOT touch `src/stores/counter.ts` (scaffold artifact, cleaned up in Story 1.4)
- Do NOT touch `src/data/` files (already correct from Story 1.2)

### Previous Story Intelligence (Story 1.2)

- `valid-words.json` contains **12,972** unique lowercase 5-letter words (exceeds 10k minimum)
- `answers.json` contains **2,315** words from the canonical Wordle answer list
- `etymology.json` contains **2,315** entries keyed by UPPERCASE word
- The `wordle-wordlist` npm package (not `word-list`) was used as the data source — answers were extracted from its cache
- `answers.json` words are in the order extracted from `wordle-wordlist` cache (alphabetical by cache structure) — for the test `getAnswerForDate(EPOCH_DATE)` returns `answers[0]`, verify this is the first word in that file
- `src/data/data-integrity.test.ts` already exists with 13 passing tests — do NOT modify it

### Testing Command

```bash
npm run test:unit   # runs Vitest — runs all .test.ts files including useGameEngine.test.ts
```

All tests must pass. Zero failures is the only acceptable result for AC 7.

### References

- Architecture — Game Engine Composable: `_bmad-output/planning-artifacts/architecture.md` § "Game Engine — Composable + Thin Pinia Store"
- Architecture — Naming & Structure Patterns: `_bmad-output/planning-artifacts/architecture.md` § "Implementation Patterns & Consistency Rules"
- Architecture — Enforcement Guidelines (anti-patterns): `_bmad-output/planning-artifacts/architecture.md` § "Enforcement Guidelines"
- Architecture — Project Directory Structure: `_bmad-output/planning-artifacts/architecture.md` § "Complete Project Directory Structure"
- Epics — Story 1.3 ACs: `_bmad-output/planning-artifacts/epics.md` § "Story 1.3"
- Epics — Story 1.4 (type/constant contracts): `_bmad-output/planning-artifacts/epics.md` § "Story 1.4"
- Story 1.2 completion notes (data file facts): `_bmad-output/implementation-artifacts/1-2-static-data-pipeline.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Dev Notes duplicate letter test table contained errors. `SPEED/SPELL` expected `['correct','present',...]` but `p` is at position 1 in both words → actual correct result is `['correct','correct','correct','absent','absent']`. Similarly `AABBB/BAAAA` has `a[1]==a[1]` → correct (not present), and `ABBEY/KEBAB` two-pass gives `['present','present','correct','present','absent']` not the table values. Tests written with correct algorithm output verified against manual two-pass trace.
- `isValidWord` implementation omits `.toLowerCase()` — spec requires uppercase words (not in the lowercase-only valid-words.json) to return false per AC2.

### Completion Notes List

- AC1: `useGameEngine.ts` has zero Vue imports — pure TypeScript, runs in Node/Vitest without vue-test-utils.
- AC2: `isValidWord` uses a module-scope `Set<string>` for O(1) lookup; case-sensitive (no toLowerCase) so uppercase inputs correctly return false.
- AC3: `getTileStates` implements the two-pass duplicate letter algorithm exactly as specified in Dev Notes. All edge cases verified.
- AC4: `getValidWordsRemaining` filters all 12,972 valid words against accumulated constraints per guess. Returns `number[]` of length equal to guesses array.
- AC5: `getAnswerForDate` parses ISO date strings as UTC midnight via `new Date('YYYY-MM-DD')` — timezone invariant by spec. `EPOCH_DATE` ('2021-06-19') returns `answers[0]` ('oaken').
- AC6: `isHardModeValid` enforces correct-position and present-anywhere constraints from all previous guesses.
- AC7: All 27 new tests pass; all 13 pre-existing data-integrity tests continue to pass (41 total, 0 failures).

### File List

- `src/types/game.ts`
- `src/constants/game.ts`
- `src/composables/useGameEngine.ts`
- `src/composables/useGameEngine.test.ts`

## Change Log

- 2026-03-20: Implemented story 1.3 — populated game types and constants, created `useGameEngine` pure TypeScript composable with all five functions, wrote 27 unit tests covering all ACs. 41 total tests passing (0 failures).
