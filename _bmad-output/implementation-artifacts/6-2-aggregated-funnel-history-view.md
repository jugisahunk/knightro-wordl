# Story 6.2: Aggregated Funnel History View

Status: review

## Story

As a player,
I want to see how my solution-space elimination has trended over my last N sessions,
So that I can identify whether my technique is improving, stalling, or changing shape.

## Acceptance Criteria

1. **Given** the player has at least 2 completed puzzle records **When** the Funnel History section of `AnalyticsView.vue` renders **Then** it displays each session's funnel data in chronological order (FR29) **And** the visual representation makes narrowing trends readable across sessions — shape before data

2. **Given** the player has only 1 completed puzzle record **When** the Funnel History section renders **Then** a single session is shown with a graceful note that more data will appear over time — not suppressed, not broken

3. **Given** the player has no completed puzzle records **When** the Funnel History section renders **Then** an empty state is shown: "Play your first puzzle to start building your history."

## Tasks / Subtasks

- [x] Task 1: Create `FunnelHistorySection.vue` component (AC: 1, 2, 3)
  - [x] Create `src/components/analytics/FunnelHistorySection.vue`
  - [x] Accept `records: DailyGameRecord[]` as prop
  - [x] Render empty state when `records.length === 0` (AC 3)
  - [x] Render single-record state with note when `records.length === 1` (AC 2)
  - [x] Render chronological funnel grid when `records.length >= 2` (AC 1)
  - [x] Each record renders a date label + `FunnelChart` (reuse existing component)
  - [x] Vertical stack layout — most recent at bottom, chronological reading order
  - [x] Respect `prefers-reduced-motion` for any fade-in animation

- [x] Task 2: Integrate `FunnelHistorySection` into `AnalyticsView.vue` (AC: 1, 2, 3)
  - [x] Import `FunnelHistorySection` into `AnalyticsView.vue`
  - [x] Replace the `<!-- Placeholder for stories 6.2–6.4 -->` comment
  - [x] Pass `records` ref to the section component
  - [x] Remove the view-level empty state — delegate all empty/populated states to section components

- [x] Task 3: Write Vitest unit tests for `FunnelHistorySection` (AC: 1, 2, 3)
  - [x] Create `src/components/analytics/FunnelHistorySection.test.ts`
  - [x] Test: 0 records renders empty state message
  - [x] Test: 1 record renders single FunnelChart + "more data" note
  - [x] Test: 2+ records renders one FunnelChart per record with date labels
  - [x] Test: records render in chronological order (ascending by date)

- [x] Task 4: Extend E2E tests for funnel history (AC: 1, 2, 3)
  - [x] In `e2e/analytics.spec.ts`, add test: seed 0 records → verify funnel empty state text
  - [x] Add test: seed 1 record → verify single funnel renders with "more data" note
  - [x] Add test: seed 3+ records → verify multiple funnel charts render in chronological order
  - [x] Assert via CSS classes and `data-testid` attributes, not DOM structure (Epic 5 retro lesson)

## Dev Notes

### Component Architecture — Reuse FunnelChart, Don't Modify It

`FunnelChart.vue` (`src/components/post-solve/FunnelChart.vue`) and `FunnelBar.vue` (`src/components/post-solve/FunnelBar.vue`) are pure, reusable components already shipped in story 3.2. **Do NOT modify them.** They accept:

```typescript
// FunnelChart props
{ funnelData: number[], solved: boolean }
```

Wrap each `FunnelChart` instance with a date label in the new `FunnelHistorySection` component. The chart renders 1–6 `FunnelBar` children depending on guess count, with proportional widths based on `count / 2315`.

### Layout: Vertical Stack, Chronological

Use a vertical stack layout (not horizontal scroll). Each entry is a labeled card:

```
┌─────────────────────────────┐
│ Mar 20, 2026         ✓ 4/6  │  ← date + solve status
│ ████████████████████████████ │  ← FunnelChart (funnelData)
│ ██████████████               │
│ ████████                     │
│ ██ ✓ 1                       │
└─────────────────────────────┘
┌─────────────────────────────┐
│ Mar 21, 2026         ✗ 6/6  │
│ ████████████████████████████ │
│ ...                          │
└─────────────────────────────┘
```

This preserves "shape before data" — the silhouette of each funnel immediately communicates how aggressively the player narrowed. Side-by-side vertical funnels let the eye scan for trends: improving funnels get narrower faster, stalling funnels stay wide.

Order: ascending chronological (oldest at top, newest at bottom) — matches `getAllGameRecords()` sort order.

### DailyGameRecord Shape

Already defined in `src/types/persistence.ts`:

```typescript
export interface GameRecord {
  guesses: string[]
  solved: boolean
  funnelData: number[]
}

export interface DailyGameRecord extends GameRecord {
  date: string // YYYY-MM-DD
}
```

`funnelData` length varies (1–6 entries) depending on guess count. Handle variable heights gracefully — shorter funnels simply end earlier.

### Data Source — useAnalyticsData

`src/composables/useAnalyticsData.ts` already exports `getAllGameRecords()` which:
- Enumerates all `myrdle_game_*` localStorage keys
- Validates date suffix format + runtime shape
- Silently skips malformed entries
- Returns `DailyGameRecord[]` sorted ascending by date

The composable is already called in `AnalyticsView.vue` — pass the `records` ref as a prop to `FunnelHistorySection`.

### Empty/Sparse State Messaging

Match the project's calm, analytical voice:
- **0 records:** "Play your first puzzle to start building your history."
- **1 record:** Show the single funnel, then below it: "Play more puzzles to see trends over time."
- **2+ records:** No special messaging — the data speaks for itself.

Do NOT hide the section structure when empty — substitute content, not presence (UX empty-state pattern).

### Solve Status Display

Each funnel card should show:
- **Date:** formatted as `Mon DD, YYYY` (e.g., "Mar 20, 2026") — use `Date` constructor + `toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })`
- **Result badge:** `✓ N/6` for solved (where N = guess count), `✗ 6/6` for failed
- Solved badge uses `--color-accent-streak`, failed uses `--color-text-secondary`

### Styling Requirements

- Section heading: "Funnel History" — Inter, `--color-text-primary`, `font-weight: 600`
- Card container: `--color-bg-surface` background, subtle border-radius (8px), padding 12–16px, margin-bottom 12px
- Date label: Inter, `--color-text-secondary`, `font-size: 0.75rem`
- Result badge: same row as date, right-aligned
- Use existing design tokens — no new color definitions needed
- Deuteranopia support is inherited: FunnelChart/FunnelBar already use `--color-tile-correct` which swaps via `html.deuteranopia`

### Accessibility

- Section has `role="region"` with `aria-label="Funnel History"`
- Each funnel card: FunnelChart already has comprehensive `aria-label` (built into component)
- Date + result badge: visible text, no special ARIA needed
- Empty state: `role="status"` so screen readers announce it
- Keyboard navigation: no interactive elements within funnel cards (read-only display)
- Respect `prefers-reduced-motion`: skip any fade-in transitions via `matchMedia('(prefers-reduced-motion: reduce)')` check or CSS media query

### Performance

- `getAllGameRecords()` scans localStorage once on mount — O(n) where n = total localStorage keys
- FunnelChart/FunnelBar are stateless pure components — no re-render overhead
- No virtual scrolling needed for reasonable history sizes (< 365 entries/year)
- Consider limiting display to last 30 sessions initially, with a "Show all" toggle if total exceeds 30

### Project Structure Notes

- **New:** `src/components/analytics/FunnelHistorySection.vue`
- **New:** `src/components/analytics/FunnelHistorySection.test.ts`
- **Modified:** `src/views/AnalyticsView.vue` — import and render FunnelHistorySection
- **Modified:** `e2e/analytics.spec.ts` — add funnel history E2E tests
- **Unchanged:** `src/components/post-solve/FunnelChart.vue` — reused as-is
- **Unchanged:** `src/components/post-solve/FunnelBar.vue` — reused as-is
- **Unchanged:** `src/composables/useAnalyticsData.ts` — already complete
- **Unchanged:** `src/types/persistence.ts` — already has DailyGameRecord

### References

- [Source: `src/components/post-solve/FunnelChart.vue`] — Reusable funnel component (props: `funnelData: number[]`, `solved: boolean`)
- [Source: `src/components/post-solve/FunnelBar.vue`] — Bar component (props: `count: number`, `isSolveRow: boolean`), 28px height, proportional width
- [Source: `src/composables/useAnalyticsData.ts`] — `getAllGameRecords()` utility returning sorted `DailyGameRecord[]`
- [Source: `src/types/persistence.ts:17-19`] — `DailyGameRecord` interface
- [Source: `src/views/AnalyticsView.vue`] — Current analytics shell with placeholder comment at line 30
- [Source: `_bmad-output/planning-artifacts/epics.md#Story 6.2`] — Acceptance criteria (FR29)
- [Source: `_bmad-output/planning-artifacts/prd.md`] — FR29: aggregated funnel history view

### Previous Story Intelligence (Story 6.1)

Key learnings from story 6.1 implementation and code review:
- `computed` wrapping non-reactive `getAllGameRecords()` caused unnecessary re-scans → use `ref` populated once on setup (already fixed in 6.1)
- Explicit property pick when spreading localStorage data to prevent leaking arbitrary properties
- `:focus-visible` styles required on all interactive elements (WCAG 2.4.7)
- `localStorage` access needs outer try/catch for restricted environments
- E2E tests use `data-testid` attributes for reliable selectors

### Epic 5 Retro Intelligence

- E2E assertions should check behavioral state (CSS classes, computed values), not DOM presence
- All new UI must respect `prefers-reduced-motion` (use `matchMedia` check or CSS `@media`)
- Verify contrast ratios meet WCAG AA (4.5:1) at token-definition time — existing tokens already verified
- Focus management: save `activeElement`, restore on close via `nextTick` (not needed here — no modals)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

None — clean implementation, no debugging needed.

### Completion Notes List

- Created `FunnelHistorySection.vue` with three states: empty (0 records), single (1 record + "more data" note), and multi (2+ records with chronological funnel cards)
- Each funnel card shows formatted date (Mon DD, YYYY), solved/failed result badge, and reuses existing `FunnelChart` component without modification
- Vertical stack layout with oldest at top, newest at bottom — matching `getAllGameRecords()` sort order
- Accessibility: `role="region"` with `aria-label`, `role="status"` on empty state, `prefers-reduced-motion` CSS media query
- Styling uses existing design tokens: `--color-bg-surface`, `--color-text-primary/secondary`, `--color-accent-streak`
- Removed view-level empty state from `AnalyticsView.vue` — delegated to `FunnelHistorySection`
- 9 Vitest unit tests covering all three states, chronological order, result badges, accessibility attributes, and prop passing
- 3 new E2E tests + 1 updated existing test; all use `data-testid` selectors per Epic 5 retro guidance
- All 321 unit tests pass, all 8 E2E analytics tests pass, zero regressions

### Change Log

- 2026-03-25: Story 6.2 implemented — FunnelHistorySection component, AnalyticsView integration, unit tests, E2E tests

### File List

- `src/components/analytics/FunnelHistorySection.vue` (new)
- `src/components/analytics/FunnelHistorySection.test.ts` (new)
- `src/views/AnalyticsView.vue` (modified)
- `e2e/analytics.spec.ts` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)
- `_bmad-output/implementation-artifacts/6-2-aggregated-funnel-history-view.md` (modified)
