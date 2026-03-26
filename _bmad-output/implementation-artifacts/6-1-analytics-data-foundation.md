# Story 6.1: Analytics Data Foundation

Status: done

## Story

As a player,
I want each completed puzzle's data to be available for aggregation,
So that the analytics views have reliable historical data to draw from without any schema migration.

## Acceptance Criteria

1. **Given** `usePersistenceStore` after Epic 4 is complete **When** reviewed **Then** every `myrdle_game_YYYY-MM-DD` entry already includes `guesses: string[]`, `solved: boolean`, and `funnelData: number[]` — no schema change required (FR28)

2. **Given** `AnalyticsView.vue` **When** the player navigates to the analytics route **Then** the view loads and renders without error (route wired via Vue Router)

3. **Given** a utility function that reads all `myrdle_game_*` keys from localStorage **When** called **Then** it returns an array of `DailyGameRecord` objects sorted by date ascending **And** it skips and ignores any malformed or unreadable keys without throwing

## Tasks / Subtasks

- [x] Task 1: Verify existing GameRecord schema satisfies FR28 (AC: 1)
  - [x] Confirm `GameRecord` in `src/types/persistence.ts` already has `guesses`, `solved`, `funnelData`
  - [x] Write a unit test asserting the schema contract (type-level + runtime shape check)
- [x] Task 2: Create `DailyGameRecord` type and `getAllGameRecords()` utility (AC: 3)
  - [x] Add `DailyGameRecord` interface to `src/types/persistence.ts`: extends `GameRecord` with `date: string`
  - [x] Create `src/composables/useAnalyticsData.ts` composable
  - [x] Implement `getAllGameRecords(): DailyGameRecord[]` — enumerate `myrdle_game_*` keys, parse each, skip malformed, sort by date ascending
  - [x] Unit test: empty localStorage returns `[]`
  - [x] Unit test: mixed valid/invalid keys returns only valid records sorted by date
  - [x] Unit test: malformed JSON values are silently skipped (no throw)
  - [x] Unit test: keys with non-date suffixes (e.g. `myrdle_game_corrupt`) are skipped
- [x] Task 3: Wire analytics route and `AnalyticsView.vue` (AC: 2)
  - [x] Add `/analytics` route to `src/router/index.ts` with lazy-loaded `AnalyticsView`
  - [x] Replace stub content in `src/views/AnalyticsView.vue` with a minimal shell that imports `useAnalyticsData` and renders record count (placeholder for stories 6.2–6.4)
  - [x] Add navigation link/button from `GameView` to analytics (e.g. chart icon in `.corner-reserved` area)
  - [x] Add back-navigation from `AnalyticsView` to home
  - [x] E2E test: navigate to `/analytics`, verify page loads without error
  - [x] E2E test: navigate to `/analytics` with no game records, verify empty state renders

## Dev Notes

### Schema Verification (AC 1)

The existing `GameRecord` interface (`src/types/persistence.ts:11-14`) already contains all three required fields:
```typescript
export interface GameRecord {
  guesses: string[]
  solved: boolean
  funnelData: number[]
}
```
No schema migration or change is needed. Task 1 is a verification + test-lock step.

### localStorage Enumeration Pattern (AC 3)

`usePersistenceStore` (`src/stores/usePersistenceStore.ts`) uses the key factory `KEYS.game = (date) => myrdle_game_${date}`. The new utility must enumerate localStorage keys externally (not through the store's API, which only loads by specific date). Pattern:

```typescript
function getAllGameRecords(): DailyGameRecord[] {
  const records: DailyGameRecord[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith('myrdle_game_')) continue
    const dateStr = key.slice('myrdle_game_'.length)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue
    try {
      const raw = JSON.parse(localStorage.getItem(key)!)
      if (!Array.isArray(raw.guesses) || typeof raw.solved !== 'boolean' || !Array.isArray(raw.funnelData)) continue
      records.push({ ...raw, date: dateStr })
    } catch { continue }
  }
  return records.sort((a, b) => a.date.localeCompare(b.date))
}
```

Key decisions:
- Validate date suffix format with regex — skip keys like `myrdle_game_corrupt`
- Runtime shape validation (not just JSON.parse) — check `guesses` is array, `solved` is boolean, `funnelData` is array
- Sort by date string comparison (lexicographic = chronological for ISO dates)
- Use `usePersistenceStore`'s `storageError` pattern: silently skip, never throw

### Composable vs Store

Create as a composable (`useAnalyticsData`) not a Pinia store. Analytics data is derived/read-only — no reactive mutations needed. The composable can call `getAllGameRecords()` on demand when the analytics view mounts. This follows the project convention: stores for mutable state, composables for derived logic.

### Router Changes

Current router (`src/router/index.ts`) has a single `/` route. Add:
```typescript
{
  path: '/analytics',
  name: 'analytics',
  component: () => import('../views/AnalyticsView.vue'),
}
```
Use lazy loading (`() => import(...)`) since analytics is not needed on initial game load.

### Navigation UI

Add a chart/stats icon button in the `.corner-reserved` area of `GameView.vue` (alongside StreakBadge and Settings). Use a simple SVG bar-chart icon. Only show when game is complete or always visible — follow the existing pattern of the settings gear icon which is always available.

In `AnalyticsView.vue`, add a back arrow/link to return to `/` (home route).

### Project Structure Notes

- New file: `src/composables/useAnalyticsData.ts` — follows `useXxx` naming convention
- New file: `src/composables/useAnalyticsData.test.ts` — co-located unit tests (same pattern as `useGameEngine.test.ts`)
- Modified: `src/views/AnalyticsView.vue` — replace Phase 2 stub
- Modified: `src/router/index.ts` — add `/analytics` route
- Modified: `src/views/GameView.vue` — add navigation trigger to analytics
- New type: `DailyGameRecord` in `src/types/persistence.ts`

### Testing Standards

- **Unit tests** (Vitest): Test `getAllGameRecords()` in isolation with mocked `localStorage`. Test edge cases: empty, mixed valid/invalid, malformed JSON, non-date suffixes, sort order.
- **E2E tests** (Playwright): Navigate to `/analytics` route, verify renders. Seed localStorage with test records, verify they appear. Verify graceful empty state.
- Follow existing test patterns: co-located `.test.ts` files for composables, `e2e/` directory for Playwright specs.

### References

- [Source: `src/types/persistence.ts`] — GameRecord interface (lines 11-14)
- [Source: `src/stores/usePersistenceStore.ts`] — KEYS.game factory (line 8), safeRead pattern (lines 11-18), storageError handling (line 34)
- [Source: `src/router/index.ts`] — Current single-route config
- [Source: `src/views/AnalyticsView.vue`] — Phase 2 stub to replace
- [Source: `src/views/GameView.vue`] — `.corner-reserved` area for navigation trigger
- [Source: `_bmad-output/planning-artifacts/epics.md#Epic 6`] — Story 6.1 acceptance criteria
- [Source: `_bmad-output/planning-artifacts/prd.md#Analytics (Phase 2)`] — FR28, FR29, FR30, FR31

### Previous Epic Intelligence

From Epic 5 retro:
- E2E assertions should check behavioral state (CSS classes, computed values), not DOM presence
- Focus management patterns established: save `activeElement`, restore on close via `nextTick`
- All new UI should respect reduced-motion preferences (use `matchMedia` check)
- Verify contrast ratios meet WCAG AA (4.5:1) at token-definition time

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

None — clean implementation, no blockers encountered.

### Completion Notes List

- AC1: Verified `GameRecord` already contains `guesses`, `solved`, `funnelData` — no schema migration needed. Locked with a contract test.
- AC3: Created `DailyGameRecord` (extends `GameRecord` with `date: string`) and `getAllGameRecords()` in `useAnalyticsData` composable. Enumerates localStorage, validates date suffix regex + runtime shape, silently skips malformed entries, sorts chronologically. 8 unit tests cover empty, valid, mixed, malformed JSON, non-date suffixes, and invalid shapes.
- AC2: Added lazy-loaded `/analytics` route. Replaced AnalyticsView stub with minimal shell showing record count or empty state. Added bar-chart SVG icon in `.corner-reserved` area of GameView for navigation, plus back arrow in AnalyticsView. 5 E2E tests cover route loading, empty state, populated state, back navigation, and GameView trigger navigation.

### Code Review Notes

Review performed by Claude Opus 4.6 (1M context) — 3-layer adversarial review (Blind Hunter, Edge Case Hunter, Acceptance Auditor).

**Acceptance Auditor:** All 3 ACs satisfied, zero spec violations.

**4 patch items found and fixed:**
- P1: `computed` wrapping non-reactive `getAllGameRecords()` re-scanned localStorage on every render → replaced with `ref` populated once on setup
- P2: `{ ...raw, date }` spread leaked arbitrary localStorage properties into `DailyGameRecord` → explicit property pick
- P3: `.back-button` and `.analytics-trigger` missing `:focus-visible` styles (WCAG 2.4.7 regression) → added outline styles
- P4: `getAllGameRecords()` accessed `localStorage` without guard for restricted environments → outer try/catch returning `[]`

**2 deferred (pre-existing, not caused by this change):**
- D1: E2E tests use `waitForLoadState('networkidle')` — fragile for SPA (project-wide pattern)
- D2: No catch-all/404 route in router

**4 findings rejected as noise.**

### Change Log

- 2026-03-25: Story 6.1 implemented — analytics data foundation (schema verification, DailyGameRecord type, getAllGameRecords utility, analytics route and view, navigation UI)
- 2026-03-25: Code review fixes — computed→ref, explicit property pick, focus-visible styles, localStorage guard

### File List

- `src/types/persistence.ts` — added `DailyGameRecord` interface
- `src/types/persistence.test.ts` — new: GameRecord schema contract tests (2 tests)
- `src/composables/useAnalyticsData.ts` — new: `getAllGameRecords()` utility and `useAnalyticsData` composable
- `src/composables/useAnalyticsData.test.ts` — new: unit tests for getAllGameRecords (8 tests)
- `src/router/index.ts` — added `/analytics` lazy-loaded route
- `src/views/AnalyticsView.vue` — replaced stub with analytics shell (header, back button, record count, empty state)
- `src/views/GameView.vue` — added analytics bar-chart icon button in `.corner-reserved` area
- `e2e/analytics.spec.ts` — new: E2E tests for analytics view (5 tests)
