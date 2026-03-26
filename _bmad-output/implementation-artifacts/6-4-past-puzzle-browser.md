# Story 6.4: Past Puzzle Browser

Status: done

## Story

As a player,
I want to browse my past puzzles — their answers, my guesses, and the etymology — to revisit the words I've encountered,
So that vocabulary retention is reinforced beyond the single moment of the etymology card.

## Acceptance Criteria

1. **Given** the player has completed at least one puzzle **When** the Past Puzzles section of `AnalyticsView.vue` renders **Then** a list of past puzzle dates is shown in reverse chronological order (FR31) **And** each entry shows: the date, the answer word, whether it was solved or failed, and guess count

2. **Given** the player selects a past puzzle entry **When** the detail view renders **Then** the complete guess sequence is shown with tile state colors **And** the etymology card for that answer word is displayed (FR31) **And** if etymology data is missing for that word, the fallback text is shown — same as the live card

3. **Given** the past puzzle browser **When** reviewed **Then** it reads exclusively from `myrdle_game_*` localStorage keys via `usePersistenceStore` — no new data model required

## Tasks / Subtasks

- [x] Task 1: Add helper functions to `useAnalyticsData.ts` (AC: 1, 2)
  - [x] Add `getAnswerForDate(date: string): string` re-export from `useGameEngine` (or import directly in component — see Dev Notes)
  - [x] Add `getTileStatesForRecord(record: DailyGameRecord): TileState[][]` — calls `getTileStates(guess, answer)` for each guess in the record
  - [x] Export both from `useAnalyticsData()` return object

- [x] Task 2: Write Vitest unit tests for new analytics helpers (AC: 1, 2)
  - [x] In `src/composables/useAnalyticsData.test.ts`
  - [x] Test: `getTileStatesForRecord` returns correct tile states for a known record (e.g., guess "crane" against answer "spell")
  - [x] Test: `getTileStatesForRecord` returns empty array for record with no guesses
  - [x] Test: `getTileStatesForRecord` returns correct number of rows matching guesses length

- [x] Task 3: Create `PastPuzzleSection.vue` component (AC: 1, 2, 3)
  - [x] Create `src/components/analytics/PastPuzzleSection.vue`
  - [x] Accept `records: DailyGameRecord[]` prop (same contract as FunnelHistorySection and StartingWordSection)
  - [x] Empty state (0 records): "Play your first puzzle to start browsing your history." with `role="status"` and `data-testid="past-puzzles-empty"`
  - [x] List view: render each record as a clickable summary card in reverse chronological order
    - Date (formatted same as FunnelHistorySection: `new Date(year, month - 1, day).toLocaleDateString(...)`)
    - Answer word (uppercase)
    - Result badge: "✓ N/6" (solved) or "✗ 6/6" (failed) — same pattern as FunnelHistorySection
  - [x] Detail view: when a card is clicked, expand or navigate to show:
    - The guess sequence as a mini-board: 5 tiles per row, colored by tile state (correct/present/absent)
    - The etymology card for the answer word (reuse `EtymologyCard` component inline, NOT as a modal — no backdrop, no dismiss, just the card content rendered in-place)
  - [x] Back/collapse control to return to the list view
  - [x] Section wrapper: `<section role="region" aria-label="Past Puzzles">`
  - [x] Section heading: "Past Puzzles" — Inter, `--color-text-primary`, `font-weight: 600`

- [x] Task 4: Write Vitest unit tests for `PastPuzzleSection.vue` (AC: 1, 2, 3)
  - [x] Create `src/components/analytics/PastPuzzleSection.test.ts`
  - [x] Test: 0 records renders empty state with correct message and data-testid
  - [x] Test: multiple records renders list in reverse chronological order (latest first)
  - [x] Test: each card shows date, answer word, and result badge
  - [x] Test: clicking a card expands the detail view with guess tiles and etymology
  - [x] Test: section has correct `role="region"` and `aria-label`
  - [x] Test: solved record shows "✓ N/6" badge, failed record shows "✗ 6/6"

- [x] Task 5: Integrate `PastPuzzleSection` into `AnalyticsView.vue` (AC: 1, 2, 3)
  - [x] Import `PastPuzzleSection` into `AnalyticsView.vue`
  - [x] Place after `<StartingWordSection>` and remove `<!-- Placeholder for story 6.4 -->`
  - [x] Pass same `records` ref as prop

- [x] Task 6: Extend E2E tests for past puzzle browser (AC: 1, 2, 3)
  - [x] In `e2e/analytics.spec.ts`
  - [x] Test: seed 0 records → verify past puzzles empty state text
  - [x] Test: seed 3 records → verify 3 cards rendered in reverse chronological order with correct dates
  - [x] Test: seed records → verify answer word and result badge displayed on each card
  - [x] Test: click a card → verify guess tiles render with correct tile state colors
  - [x] Test: click a card → verify etymology content displayed for answer word
  - [x] Assert via `data-testid` attributes (Epic 5 retro lesson)

## Dev Notes

### Data Flow — No New Storage Required

The past puzzle browser reads exclusively from existing `myrdle_game_YYYY-MM-DD` localStorage keys. Each key already stores:
```typescript
interface GameRecord {
  guesses: string[]    // e.g., ["crane", "blimp", "spell"]
  solved: boolean
  funnelData: number[]
}
```

To recover the answer word for a given date, use `getAnswerForDate(date)` from `useGameEngine`. This is a pure function that computes the answer from the date and the static `answers.json` data.

To derive tile states for displaying the mini-board, use `getTileStates(guess, answer)` from `useGameEngine` for each guess in the record. This returns a `TileState[]` (`'correct' | 'present' | 'absent'`) for each letter position.

### Component Architecture

**List/Detail Pattern:** Use a reactive `selectedDate: Ref<string | null>` to toggle between list and detail views within the same component. When `selectedDate` is `null`, show the list. When a card is clicked, set `selectedDate` and render the detail view. A "Back to list" button (or "← Past Puzzles" breadcrumb) resets `selectedDate` to `null`.

Do NOT use Vue Router for this — it's an in-component state toggle, not a page navigation.

**Etymology in Detail View:** Import `etymologyJson` from `@/data/etymology.json` (same pattern as `PostSolveTransition.vue`). Look up `etymologyJson[answer.toUpperCase()]` to get the `EtymologyEntry`. For the detail view, render etymology data inline — do NOT render `EtymologyCard` as a modal with backdrop/dismiss. Instead, either:
- (Preferred) Create a simple inline etymology display that reuses the same data and styling but without the modal wrapper/dismiss behavior, OR
- Render `EtymologyCard` with a wrapper that suppresses the backdrop and keyboard dismiss behavior

The simplest approach: render the etymology fields directly in the detail template using the same Lora serif styling as `EtymologyCard.vue`. This avoids fighting the modal component's dismiss UX.

### Mini-Board Tile Display

For showing the guess sequence in the detail view, render a simple grid of colored tiles. Do NOT reuse `GameTile.vue` (it has flip animations and reveal logic that's irrelevant here). Instead, render simple `<span>` elements with:
- Letter text (uppercase)
- Background color based on tile state:
  - `correct` → `var(--color-tile-correct)`
  - `present` → `var(--color-tile-present)`
  - `absent` → `var(--color-tile-absent)`
- Text color: white (`var(--color-tile-text)` or `#fff`)
- Fixed size: ~36px × 36px with 2px gap
- `aria-label` on each tile: e.g., "C correct" / "R present" / "A absent"

This is a read-only static display — no animations, no interactions.

### Reverse Chronological Order

`getAllGameRecords()` returns records sorted ascending by date. For the past puzzle list, display in **reverse** order (latest first). Use `[...records].reverse()` or `records.slice().reverse()` — do NOT mutate the prop.

### Date Formatting

Reuse the exact same date formatting approach as `FunnelHistorySection`:
```typescript
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
```
This avoids the timezone bug (lesson from commit `2a44508`). Do NOT use `new Date(dateStr)` directly.

### Styling Requirements

Follow existing analytics section patterns:
- Section heading: `.section-heading` — Inter, `--color-text-primary`, `font-weight: 600`, `font-size: 1rem`
- Card container: `--color-bg-surface` background, `border-radius: 8px`, `padding: 12px 16px`, `margin-bottom: 12px`
- Card header: flex row with date (left) and result badge (right) — same layout as FunnelHistorySection cards
- Answer word in list: uppercase, `--color-text-primary`, `font-weight: 600`, `font-size: 0.875rem`
- Result badge: `--color-accent-streak` for solved, `--color-text-secondary` for failed, `font-size: 0.75rem`, `font-weight: 600`
- Empty state: `--color-text-secondary`, centered, `font-size: 0.875rem`
- Detail view etymology: Lora serif, same sizing as `EtymologyCard.vue` styles
- Cards should have `cursor: pointer` and subtle hover effect (e.g., slight background change)
- Use existing design tokens only — no new color definitions

### Accessibility

- Section: `role="region"` with `aria-label="Past Puzzles"`
- Empty state: `role="status"` so screen readers announce it
- List cards: use `<button>` or `role="button"` with `tabindex="0"` for keyboard accessibility — cards must be focusable and activatable via Enter/Space
- Each card: `aria-label` describing the entry, e.g., "Mar 18, 2026 — CRANE — Solved in 3 guesses"
- Mini-board tiles: each tile has `aria-label` with letter and state (e.g., "C correct")
- Back button in detail view: standard `<button>` with descriptive label
- Respect `prefers-reduced-motion`: skip any fade or slide transitions via CSS `@media (prefers-reduced-motion: reduce)`
- `:focus-visible` styles on interactive elements (cards, back button)

### Data-testid Attributes

Follow the project convention (Epic 5 retro: use `data-testid`, not CSS classes):
- `past-puzzles-section` — section wrapper
- `past-puzzles-empty` — empty/insufficient state message
- `past-puzzle-card` — each card in the list (multiple)
- `past-puzzle-date` — date label on each card
- `past-puzzle-answer` — answer word on each card
- `past-puzzle-result` — result badge on each card
- `past-puzzle-detail` — detail view container
- `past-puzzle-detail-board` — mini-board in detail view
- `past-puzzle-tile` — individual tile in the mini-board (multiple)
- `past-puzzle-etymology` — etymology content in detail view
- `past-puzzle-back` — back/collapse button in detail view

### Performance

- `getAnswerForDate` is O(1) — simple index lookup
- `getTileStates` is O(n) per guess (5 letters) — negligible
- Tile state computation should be done lazily only for the selected record (detail view), not precomputed for all records in the list
- Etymology JSON import is already tree-shaken and cached — single import, no runtime fetch
- Record list reversal is O(n) — computed once when records change

### Import Pattern for Etymology and Game Engine

```typescript
// In PastPuzzleSection.vue
import etymologyJson from '@/data/etymology.json'
import type { EtymologyEntry } from '@/types/etymology'
import { useGameEngine } from '@/composables/useGameEngine'

const { getAnswerForDate, getTileStates } = useGameEngine()

// Look up etymology for a date's answer
function getEtymologyForDate(date: string): EtymologyEntry | null {
  const answer = getAnswerForDate(date)
  const data = etymologyJson as Record<string, EtymologyEntry>
  return data[answer.toUpperCase()] ?? null
}
```

This is the same pattern used in `PostSolveTransition.vue` (line 7, 18-22).

### Project Structure Notes

- **New:** `src/components/analytics/PastPuzzleSection.vue`
- **New:** `src/components/analytics/PastPuzzleSection.test.ts`
- **Modified:** `src/composables/useAnalyticsData.ts` — add helper function re-exports (optional — component can import directly from useGameEngine)
- **Modified or unchanged:** `src/composables/useAnalyticsData.test.ts` — add tests if helpers added to composable
- **Modified:** `src/views/AnalyticsView.vue` — import and render PastPuzzleSection, remove placeholder
- **Modified:** `e2e/analytics.spec.ts` — add past puzzle E2E tests
- **Unchanged:** `src/components/post-solve/EtymologyCard.vue` — NOT modified (modal UX is wrong for inline display)
- **Unchanged:** `src/components/game/GameTile.vue` — NOT reused (animation logic is irrelevant)
- **Unchanged:** `src/composables/useGameEngine.ts` — consumed, not modified
- **Unchanged:** `src/data/etymology.json` — consumed, not modified
- **Unchanged:** `src/types/persistence.ts` — already has DailyGameRecord

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story 6.4`] — Acceptance criteria (FR31)
- [Source: `_bmad-output/planning-artifacts/prd.md`] — FR31: past puzzle browser
- [Source: `src/composables/useAnalyticsData.ts`] — `getAllGameRecords()` data source
- [Source: `src/composables/useGameEngine.ts:74-80`] — `getAnswerForDate(date)` function
- [Source: `src/composables/useGameEngine.ts:15`] — `getTileStates(guess, answer)` function
- [Source: `src/types/persistence.ts:17-19`] — `DailyGameRecord` interface
- [Source: `src/types/etymology.ts:1-9`] — `EtymologyEntry` interface
- [Source: `src/components/layout/PostSolveTransition.vue:7,18-22`] — Etymology JSON import pattern
- [Source: `src/components/analytics/FunnelHistorySection.vue`] — Reference pattern for analytics section (card layout, date formatting, result badge)
- [Source: `src/components/analytics/StartingWordSection.vue`] — Reference pattern for analytics section (empty state, stat display)
- [Source: `src/components/post-solve/EtymologyCard.vue`] — Etymology display styling reference (Lora serif, font sizes)
- [Source: `src/views/AnalyticsView.vue:31`] — Integration point: `<!-- Placeholder for story 6.4 -->`

### Previous Story Intelligence (Story 6.3)

Key learnings from story 6.3 implementation:
- `StartingWordSection` followed `FunnelHistorySection` patterns exactly — this story should do the same for list cards
- Pure function pattern (not reactive `computed`) for data computation — call once with records prop
- `data-testid` on all testable elements — Epic 5 retro requirement
- Total: 335 unit tests + 12 E2E analytics tests passing after 6.3 — no regressions allowed
- Date formatting: use `new Date(year, month - 1, day)` constructor — never `new Date(dateStr)` (timezone bug fix from commit 2a44508)
- Each analytics section handles its own empty state independently
- E2E tests seed data via `page.evaluate(() => localStorage.setItem(...))` pattern

### Epic 5 Retro Intelligence

- E2E assertions should use `data-testid` attributes, not CSS classes or DOM structure
- All new UI must respect `prefers-reduced-motion`
- Verify contrast ratios meet WCAG AA (4.5:1) — existing design tokens already verified
- `:focus-visible` styles required on any interactive elements (cards and back button in this story)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

None — clean implementation with no debugging issues.

### Completion Notes List

- Added `getTileStatesForRecord` and `getAnswerForDate` re-exports to `useAnalyticsData.ts` composable
- Created `PastPuzzleSection.vue` with list/detail toggle pattern using reactive `selectedDate` ref
- List view shows records in reverse chronological order with date, answer word (uppercase), and result badge
- Detail view renders mini-board with colored tiles (36px, correct/present/absent) and inline etymology (Lora serif styling matching EtymologyCard)
- Cards use `<button>` elements for keyboard accessibility with `aria-label`, `:focus-visible` styles, and `cursor: pointer`
- Etymology rendered inline (no modal wrapper) — directly displays all fields from etymology JSON
- Date formatting uses `new Date(year, month - 1, day)` constructor to avoid timezone bug
- All `data-testid` attributes per story spec and Epic 5 retro requirement
- `prefers-reduced-motion` media query included
- 345 unit tests passing (10 new: 3 composable + 7 component), 0 regressions
- 17 analytics E2E tests passing (5 new), 40 total E2E tests passing, 0 regressions

### Change Log

- 2026-03-26: Story 6.4 implemented — Past Puzzle Browser with list/detail view, mini-board tiles, inline etymology, full test coverage

### File List

- `src/composables/useAnalyticsData.ts` (modified) — added `getTileStatesForRecord`, `getAnswerForDate` re-export
- `src/composables/useAnalyticsData.test.ts` (modified) — 3 new tests for `getTileStatesForRecord`
- `src/components/analytics/PastPuzzleSection.vue` (new) — past puzzle browser component
- `src/components/analytics/PastPuzzleSection.test.ts` (new) — 7 unit tests for PastPuzzleSection
- `src/views/AnalyticsView.vue` (modified) — imported and rendered PastPuzzleSection, removed placeholder
- `e2e/analytics.spec.ts` (modified) — 5 new E2E tests for past puzzle browser
