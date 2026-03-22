# Story 4.5: Core Gameplay E2E Test Coverage

Status: done

## Story

As a developer,
I want Playwright smoke tests covering all shipped core user flows,
so that regressions in gameplay, post-solve ritual, persistence, and streak are caught before they reach users.

## Acceptance Criteria

1. **Given** the player types a valid 5-letter word and presses Enter **When** the first row resolves **Then** all 5 tiles in row 1 have a revealed state class (`tile-state-correct`, `tile-state-present`, or `tile-state-absent`)

2. **Given** the player solves the puzzle (types the correct answer and presses Enter) **When** the win state triggers **Then** the post-solve overlay (`FunnelChart`) is visible in the DOM

3. **Given** the puzzle has been solved and the post-solve ritual runs **When** Enter is pressed to advance past the funnel **Then** both `.funnel-chart` and `.etymology-card` are rendered in the DOM

4. **Given** the player submits a complete guess row **When** the page is reloaded **Then** the revealed tiles in row 1 are still present (persistence restore from localStorage)

5. **Given** the player solves today's puzzle **When** the post-solve state renders **Then** StreakBadge shows `.streak-count--active` (count ≥ 1)

## Tasks / Subtasks

- [x] Task 1: Create `e2e/gameplay.spec.ts` with helper to derive today's answer (AC: all)
  - [x] 1.1: Add `getTodayAnswer()` helper using `../src/data/answers.json` and `EPOCH_DATE = '2021-06-19'` — matches game engine logic exactly
  - [x] 1.2: Test — AC1: navigate, type `crane`, Enter, assert 5 revealed tiles in row 1

- [x] Task 2: Add win-state and post-solve ritual tests (AC: 2, 3)
  - [x] 2.1: Test — AC2: navigate, type today's answer, Enter, `await expect('.funnel-chart').toBeVisible({ timeout: 2000 })`
  - [x] 2.2: Test — AC3: solve puzzle, wait for funnel, press Enter to advance to etymology, assert both `.funnel-chart` AND `.etymology-card` visible

- [x] Task 3: Add persistence and streak tests (AC: 4, 5)
  - [x] 3.1: Test — AC4: navigate, submit `crane`, wait for row 1 to reveal, `page.reload()`, assert row 1 still has 5 revealed tiles
  - [x] 3.2: Test — AC5: solve puzzle, wait for funnel phase, assert `.streak-count--active` is visible in DOM

- [x] Task 4: Run full e2e suite (AC: all)
  - [x] 4.1: Run `npm run test:e2e` with dev server running — all 5 new tests must pass, existing audio and PWA tests must not regress

## Dev Notes

### CRITICAL: AC4 Interpretation — `currentInput` Is NOT Persisted

The epics spec says "typed 2 letters into the current guess row" but `GameRecord` only stores:
```ts
interface GameRecord { guesses: string[]; solved: boolean; funnelData: number[] }
```
`currentInput` (in-progress letters) is never saved. `saveGame()` is only called inside `submitGuess()` after a full guess is submitted. **Implement AC4 by submitting one complete 5-letter guess then reloading** — this tests actual persistence behaviour. Do NOT attempt to persist in-progress letters; that is out of scope.

### Deriving Today's Answer in Playwright Tests

Game engine logic (from `src/composables/useGameEngine.ts` and `src/constants/game.ts`):
```ts
// EPOCH_DATE is '2021-06-19' — hardcode this constant in the test file
// answers is imported from '../src/data/answers.json'
function getTodayAnswer(): string {
  const EPOCH = new Date('2021-06-19').getTime()
  const today = new Date().toISOString().slice(0, 10)
  const dayOffset = Math.floor((new Date(today).getTime() - EPOCH) / 86400000)
  const arr = answers as string[]
  return arr[((dayOffset % arr.length) + arr.length) % arr.length]
}
```
Do NOT use `@/` alias — Playwright does not apply the Vite resolver. Use `'../src/data/answers.json'` and `'@playwright/test'` imports only.

### Post-Solve Timing — Critical for AC2 and AC3

The PostSolveTransition phases after a win:
1. `phase = 'dimming'` immediately on win
2. After `SOLVE_PAUSE_MS` (300ms): still dimming
3. After `BOARD_DIM_MS` (500ms): `phase = 'funnel'` → `.funnel-chart` becomes visible (total ~800ms)
4. After `AUTO_ADVANCE_MS` (4000ms) OR on Enter/Space keypress: `phase = 'etymology'` → `.etymology-card` appears

For AC2: `await expect(page.locator('.funnel-chart')).toBeVisible({ timeout: 2000 })` — 2s is enough headroom.
For AC3: after `.funnel-chart` appears, `await page.keyboard.press('Enter')` to advance to etymology phase, then assert both.

### Key DOM Selectors

| Selector | Component | Notes |
|----------|-----------|-------|
| `.board-row` | `GameBoard` → rows | 6 rows always in DOM |
| `.tile-state-correct`, `.tile-state-present`, `.tile-state-absent` | `GameTile` | Applied after reveal |
| `.funnel-chart` | `FunnelChart` | `v-if="showFunnel"` — visible in both funnel and etymology phases |
| `.etymology-card` | `EtymologyCard` | `v-if="showEtymology"` — only in etymology phase (inside `.etymology-backdrop`) |
| `.streak-badge` | `StreakBadge` | Always in DOM (`.corner-reserved` outside `game-root`) |
| `.streak-count--active` | `StreakBadge` | Applied when `count > 0` |
| `.post-solve-container` | `PostSolveTransition` | Wrapper — always in DOM, empty when not active |

### Existing Tests — Do NOT Duplicate

- `e2e/audio.spec.ts` "game remains fully playable with audio present" — types `crane`, asserts 5 revealed tiles. AC1 adds a dedicated **gameplay** smoke test with the same assertion; duplication is acceptable for different describe context.
- `e2e/first-launch.spec.ts` — all SW/PWA/offline tests. Do not modify this file.

### File Structure

| File | Action |
|------|--------|
| `e2e/gameplay.spec.ts` | CREATE — new file with 5 tests covering all ACs |

**Do NOT modify:**
- `e2e/audio.spec.ts` — audio tests, do not touch
- `e2e/first-launch.spec.ts` — PWA tests, do not touch
- Any `src/` file — this story is tests only, no implementation changes

### Test File Skeleton

```ts
import { test, expect } from '@playwright/test'
import answers from '../src/data/answers.json'

function getTodayAnswer(): string {
  const EPOCH = new Date('2021-06-19').getTime()
  const today = new Date().toISOString().slice(0, 10)
  const dayOffset = Math.floor((new Date(today).getTime() - EPOCH) / 86400000)
  const arr = answers as string[]
  return arr[((dayOffset % arr.length) + arr.length) % arr.length]
}

test.describe('core gameplay', () => {
  // AC1: row reveals after valid guess
  test('submitting a valid word reveals all 5 tiles in row 1', async ({ page }) => { ... })

  // AC2: solving shows post-solve overlay
  test('solving the puzzle shows the post-solve funnel overlay', async ({ page }) => { ... })

  // AC3: both FunnelChart and EtymologyCard render
  test('advancing past funnel shows both FunnelChart and EtymologyCard', async ({ page }) => { ... })

  // AC4: submitted guess persists on reload
  test('submitted guess row is restored after page reload', async ({ page }) => { ... })

  // AC5: streak badge increments on win
  test('solving the puzzle activates the streak badge', async ({ page }) => { ... })
})
```

### Previous Story Intelligence (from 4.4)

- Unit test count: **242 tests** in `src/` (Vitest) — this story adds Playwright e2e tests which run via `npm run test:e2e`, not `npm run test:unit`. Unit count stays at 242.
- Playwright config: dev server on `localhost:5173`, headed by default. Tests run via `npm run test:e2e`.
- Each Playwright test gets a fresh browser context → clean localStorage. No need to manually clear state between tests.
- Vitest uses `jsdom`; Playwright uses real Chromium — different execution environments. Do not mix.

### Architecture Constraints

- Playwright tests live in `e2e/` — never in `src/`
- No Vite/`@/` aliases in e2e tests — use relative paths only
- Test isolation: Playwright creates a new browser context per test — each test starts with empty localStorage
- `npm run test:e2e` requires the dev server already running (or it starts it via `webServer` config) — the `playwright.config.ts` `webServer` block handles this automatically

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.5]
- [Source: src/composables/useGameEngine.ts — `getAnswerForDate` and `EPOCH_DATE`]
- [Source: src/constants/game.ts — `EPOCH_DATE = '2021-06-19'`]
- [Source: src/components/layout/PostSolveTransition.vue — `.post-solve-container`, FunnelChart v-if, EtymologyCard v-if]
- [Source: src/components/ui/StreakBadge.vue — `.streak-count--active`]
- [Source: src/composables/usePostSolveTransition.ts — phase timing: SOLVE_PAUSE_MS + BOARD_DIM_MS before funnel]
- [Source: src/constants/timing.ts — TILE_FLIP_MS=400, SOLVE_PAUSE_MS=300, BOARD_DIM_MS=500]
- [Source: src/types/persistence.ts — GameRecord has no currentInput field]
- [Source: e2e/audio.spec.ts — existing Playwright pattern to follow]
- [Source: playwright.config.ts — webServer config, baseURL]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- JSON import required `with { type: 'json' }` attribute in Node 24 ESM context — the bare `import answers from '...'` syntax used in the story skeleton fails at runtime. Fixed by adding the import attribute.

### Completion Notes List

- Created `e2e/gameplay.spec.ts` with 5 Playwright tests covering all ACs
- `getTodayAnswer()` mirrors game engine logic exactly (EPOCH_DATE `2021-06-19`, modular index into answers array)
- AC1: types `crane`, asserts 5 revealed tiles in row 1
- AC2: solves with today's answer, asserts `.funnel-chart` visible within 2s
- AC3: solves, waits for funnel, presses Enter to advance, asserts both `.funnel-chart` and `.etymology-card` visible
- AC4: submits `crane`, waits for reveal, reloads, asserts row 1 still has 5 revealed tiles
- AC5: solves, waits for funnel phase, asserts `.streak-count--active` visible
- All 8 e2e tests pass (3 pre-existing + 5 new); no regressions

### File List

- `e2e/gameplay.spec.ts`

## Change Log

- 2026-03-21: Story created — core gameplay e2e test coverage; creates `e2e/gameplay.spec.ts` with 5 Playwright tests covering tile reveal, win/post-solve, persistence restore, and streak increment
- 2026-03-21: Implementation complete — `e2e/gameplay.spec.ts` created; all 5 new tests pass alongside 3 pre-existing e2e tests (8 total)
