# Story 6.3: Starting Word Effectiveness Stat

Status: done

## Story

As a player,
I want to see how effective my opening guess has been on average,
So that I can understand whether my starter is a strategic strength or a drag on my funnel.

## Acceptance Criteria

1. **Given** the player has at least 5 completed puzzle records with funnel data **When** the Starting Word Effectiveness section renders **Then** it displays the average valid words remaining after guess 1 across all sessions (FR30) **And** it displays the player's most frequently used opening word

2. **Given** the player has fewer than 5 completed puzzle records **When** the Starting Word Effectiveness section renders **Then** a note is shown indicating how many more sessions are needed before the stat is meaningful — not a broken or zero value

## Tasks / Subtasks

- [x] Task 1: Extend `useAnalyticsData` with starting word computation functions (AC: 1, 2)
  - [x] Add `getStartingWordStats(records: DailyGameRecord[])` function
  - [x] Compute average of `funnelData[1]` across all records (valid words remaining after guess 1)
  - [x] Compute most frequently used opening word from `records.map(r => r.guesses[0])`
  - [x] Return `{ averageRemaining: number, mostUsedWord: string, mostUsedCount: number, totalGames: number }` or `null` if insufficient data
  - [x] Handle edge cases: records with missing/short `funnelData` or empty `guesses` — skip silently

- [x] Task 2: Write Vitest unit tests for `getStartingWordStats` (AC: 1, 2)
  - [x] Create tests in existing `src/composables/useAnalyticsData.test.ts` (or create if missing)
  - [x] Test: 0 records returns null
  - [x] Test: 4 records returns null (below threshold)
  - [x] Test: 5 records returns correct average and most-used word
  - [x] Test: ties in most-used word — any tied word is acceptable
  - [x] Test: records with malformed funnelData (length < 2) are excluded from average
  - [x] Test: average is rounded to nearest integer

- [x] Task 3: Create `StartingWordSection.vue` component (AC: 1, 2)
  - [x] Create `src/components/analytics/StartingWordSection.vue`
  - [x] Accept `records: DailyGameRecord[]` prop (same contract as FunnelHistorySection)
  - [x] Call `getStartingWordStats(records)` internally
  - [x] When stats are null (< 5 records): show note "Play N more puzzles to unlock starting word insights." with `role="status"` and `data-testid="starting-word-empty"`
  - [x] When stats available: display average remaining and most-used word
  - [x] Section wrapper: `<section role="region" aria-label="Starting Word Effectiveness">`
  - [x] Section heading: "Starting Word" — Inter, `--color-text-primary`, `font-weight: 600`
  - [x] Respect `prefers-reduced-motion` for any fade-in transitions

- [x] Task 4: Write Vitest unit tests for `StartingWordSection.vue` (AC: 1, 2)
  - [x] Create `src/components/analytics/StartingWordSection.test.ts`
  - [x] Test: 0 records renders empty state with correct message and data-testid
  - [x] Test: 3 records renders "Play 2 more puzzles to unlock starting word insights."
  - [x] Test: 5+ records renders average remaining value
  - [x] Test: 5+ records renders most-used opening word
  - [x] Test: section has correct `role="region"` and `aria-label`

- [x] Task 5: Integrate `StartingWordSection` into `AnalyticsView.vue` (AC: 1, 2)
  - [x] Import `StartingWordSection` into `AnalyticsView.vue`
  - [x] Place after `<FunnelHistorySection>` and before/replacing `<!-- Placeholder for stories 6.3–6.4 -->`
  - [x] Update placeholder comment to `<!-- Placeholder for story 6.4 -->`
  - [x] Pass same `records` ref as prop

- [x] Task 6: Extend E2E tests for starting word effectiveness (AC: 1, 2)
  - [x] In `e2e/analytics.spec.ts`, add test: seed 0 records → verify starting word empty state text
  - [x] Add test: seed 3 records → verify "Play 2 more puzzles" message
  - [x] Add test: seed 5+ records with known funnelData → verify average displayed correctly
  - [x] Add test: seed 5+ records with same opening word → verify most-used word displayed
  - [x] Assert via `data-testid` attributes (Epic 5 retro lesson)

## Dev Notes

### Data Model — funnelData Shape

`funnelData` is a `number[]` where:
- `funnelData[0]` = total valid word pool (2315) before any guesses
- `funnelData[1]` = valid words remaining after guess 1
- `funnelData[N]` = valid words remaining after guess N

For starting word effectiveness, the key metric is `funnelData[1]` — how much the player's opening guess narrows the search space. Lower is better: a value of 50 means the opener eliminated ~98% of candidates.

### Computation Logic

```typescript
interface StartingWordStats {
  averageRemaining: number  // Math.round(avg of funnelData[1])
  mostUsedWord: string      // uppercase display
  mostUsedCount: number     // frequency of most-used word
  totalGames: number        // records used in computation
}

function getStartingWordStats(records: DailyGameRecord[]): StartingWordStats | null {
  // Filter to records with valid funnelData (length >= 2) and at least 1 guess
  // Return null if filtered count < 5
  // Compute average of funnelData[1], round to integer
  // Count frequency of guesses[0], find mode
}
```

Add this function to `useAnalyticsData.ts` and export it from the composable's return object. Keep it as a pure function (not reactive) — the component calls it with the records prop.

### Component Layout

```
┌─────────────────────────────────────┐
│ Starting Word                       │  ← section heading
│                                     │
│  Your go-to opener                  │  ← label
│  CRANE  (18 of 25 games)           │  ← most-used word + frequency
│                                     │
│  Average words remaining            │  ← label
│  after first guess: 61              │  ← average stat
│                                     │
│  (Lower is better — a strong        │
│   opener eliminates more words)     │  ← contextual hint
└─────────────────────────────────────┘
```

Insufficient data state (< 5 records):
```
┌─────────────────────────────────────┐
│ Starting Word                       │
│                                     │
│  Play 2 more puzzles to unlock      │
│  starting word insights.            │
└─────────────────────────────────────┘
```

### Styling Requirements

Follow FunnelHistorySection patterns exactly:
- Section heading: `.section-heading` — Inter, `--color-text-primary`, `font-weight: 600`, `font-size: 1rem`
- Stat values: large emphasis text — `--color-text-primary`, `font-size: 1.5rem`, `font-weight: 700`
- Most-used word: display uppercase (CSS `text-transform: uppercase`), `--color-accent-streak` color for visual pop
- Labels: `--color-text-secondary`, `font-size: 0.75rem`
- Contextual hint: `--color-text-secondary`, `font-size: 0.75rem`, `font-style: italic`
- Empty state: `--color-text-secondary`, centered, matching FunnelHistorySection `.empty-message` pattern
- Card container: `--color-bg-surface` background, `border-radius: 8px`, `padding: 12–16px`
- Use existing design tokens only — no new color definitions

### Accessibility

- Section: `role="region"` with `aria-label="Starting Word Effectiveness"`
- Empty state: `role="status"` so screen readers announce it
- Stats display: use semantic HTML (`<p>`, `<strong>`) — no special ARIA needed for read-only values
- Ensure stat values have associated labels (not just visual proximity) — use `aria-label` on stat container or visible `<label>` association
- Respect `prefers-reduced-motion`: skip any fade-in via CSS `@media (prefers-reduced-motion: reduce)` or `matchMedia` check

### Data-testid Attributes

Follow the project convention (Epic 5 retro: use `data-testid`, not CSS classes):
- `starting-word-section` — section wrapper
- `starting-word-empty` — empty/insufficient state message
- `starting-word-average` — average remaining stat value
- `starting-word-opener` — most-used word display
- `starting-word-opener-count` — frequency count (e.g., "18 of 25 games")

### Performance

- `getStartingWordStats` is O(n) — single pass through records array
- Called once on component mount with the records prop
- No reactivity needed — records are populated once via `ref` in AnalyticsView (lesson from 6.1: don't wrap in `computed`)

### Threshold Rationale

The 5-game minimum prevents misleading stats from tiny samples. With 1-2 games, the "average" is just one data point. 5 games gives enough variance to be meaningful. The countdown message ("Play N more puzzles...") turns the threshold into a soft engagement hook rather than a blank wall.

### Project Structure Notes

- **New:** `src/components/analytics/StartingWordSection.vue`
- **New:** `src/components/analytics/StartingWordSection.test.ts`
- **Modified:** `src/composables/useAnalyticsData.ts` — add `getStartingWordStats` function
- **New or modified:** `src/composables/useAnalyticsData.test.ts` — add unit tests for stats function
- **Modified:** `src/views/AnalyticsView.vue` — import and render StartingWordSection
- **Modified:** `e2e/analytics.spec.ts` — add starting word E2E tests
- **Unchanged:** `src/types/persistence.ts` — already has DailyGameRecord
- **Unchanged:** `src/components/analytics/FunnelHistorySection.vue` — not modified

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story 6.3`] — Acceptance criteria (FR30)
- [Source: `_bmad-output/planning-artifacts/prd.md`] — FR30: starting word effectiveness stat
- [Source: `src/composables/useAnalyticsData.ts`] — `getAllGameRecords()` data source
- [Source: `src/types/persistence.ts:17-19`] — `DailyGameRecord` interface with `guesses`, `funnelData`
- [Source: `src/components/analytics/FunnelHistorySection.vue`] — Reference pattern for analytics section components
- [Source: `src/views/AnalyticsView.vue:29`] — Integration point: `<!-- Placeholder for stories 6.3–6.4 -->`

### Previous Story Intelligence (Story 6.2)

Key learnings from story 6.2 implementation and code review:
- `FunnelHistorySection` established the canonical analytics section pattern: accept `records` prop, `role="region"`, `data-testid` on all testable elements
- View-level empty state was removed in 6.2 — each section handles its own empty state independently
- Date formatting helper: `new Date(year, month - 1, day).toLocaleDateString(...)` — avoids timezone bugs vs `new Date(dateStr)`
- FunnelChart is reused as-is without modification — don't touch shared components
- E2E tests seed data via `page.evaluate(() => localStorage.setItem(...))` pattern
- All 321 unit tests + 8 E2E analytics tests passing after 6.2 — no regressions allowed

### Epic 5 Retro Intelligence

- E2E assertions should use `data-testid` attributes, not CSS classes or DOM structure
- All new UI must respect `prefers-reduced-motion`
- Verify contrast ratios meet WCAG AA (4.5:1) — existing design tokens already verified
- `:focus-visible` styles required on any interactive elements (none expected here — read-only display)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

None — clean implementation, no blockers.

### Completion Notes List

- Implemented `getStartingWordStats()` as a pure function in `useAnalyticsData.ts` — filters records with valid funnelData (length >= 2) and at least 1 guess, returns null below 5-game threshold, computes average of funnelData[1] rounded to integer and most-used opening word
- Created `StartingWordSection.vue` following FunnelHistorySection patterns: accepts `records` prop, handles empty state with countdown message, displays stats with proper accessibility (role="region", aria-label, role="status" on empty state)
- All data-testid attributes per spec: starting-word-section, starting-word-empty, starting-word-average, starting-word-opener, starting-word-opener-count
- Styling uses existing design tokens only, respects prefers-reduced-motion via CSS media query
- 8 new unit tests for getStartingWordStats (edge cases: 0 records, below threshold, correct computation, ties, malformed data, rounding, empty guesses)
- 6 new unit tests for StartingWordSection.vue (empty states, stat rendering, accessibility attributes, singular/plural "puzzle")
- 4 new E2E tests covering empty state, insufficient data, average display, and most-used word — all using data-testid selectors per Epic 5 retro guidance
- Total: 335 unit tests passing (up from 321), 12 E2E analytics tests passing (up from 8)

### Change Log

- 2026-03-25: Story 6.3 implemented — starting word effectiveness stat (all 6 tasks complete)

### File List

- **New:** src/components/analytics/StartingWordSection.vue
- **New:** src/components/analytics/StartingWordSection.test.ts
- **Modified:** src/composables/useAnalyticsData.ts — added getStartingWordStats function and StartingWordStats interface
- **Modified:** src/composables/useAnalyticsData.test.ts — added 8 unit tests for getStartingWordStats
- **Modified:** src/views/AnalyticsView.vue — imported and rendered StartingWordSection, updated placeholder comment
- **Modified:** e2e/analytics.spec.ts — added 4 E2E tests for starting word section
