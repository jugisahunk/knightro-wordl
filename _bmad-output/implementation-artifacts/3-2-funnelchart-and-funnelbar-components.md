# Story 3.2: FunnelChart and FunnelBar Components

Status: done

## Story

As a player,
I want to see a proportional funnel visualization of how the solution space narrowed with each guess,
So that the shape of my solve — or my fail — is readable at a glance before I read a single number.

## Acceptance Criteria

1. **Given** `FunnelBar.vue` with a word count and total starting count **When** rendered **Then** its width is proportional — `(count / 2315) * 100%` — and never less than 2px wide (UX-DR8)
   **And** guess rows use `--color-tile-correct` (#538d4e) fill color (UX-DR8)
   **And** the solving row (✓) uses `--color-accent-streak` (#9999cc) fill color (UX-DR8)
   **And** the count label appears inside the bar when the bar is wide enough, outside when too narrow (UX-DR8)

2. **Given** `FunnelChart.vue` after a successful solve in N guesses **When** rendered **Then** it displays N guess bars plus one ✓ row for the solving guess (FR9, FR10)
   **And** each bar's width accurately encodes the valid word count remaining after that guess

3. **Given** `FunnelChart.vue` after a failed solve (6 guesses, no solution) **When** rendered **Then** it displays 6 bars with no ✓ row (FR9, FR10)

4. **Given** `FunnelChart.vue` on a player's very first session (one data point) **When** rendered **Then** a single bar renders normally — not suppressed, not replaced with a placeholder (UX-DR9)

5. **Given** `FunnelChart.vue` **When** reviewed for accessibility **Then** it has `role="img"` and `aria-label` that describes all funnel values — e.g. `"Solve funnel: 2315 words after guess 1, 48 after guess 2, solved on guess 3"` (UX-DR9)

## Tasks / Subtasks

- [x] Task 1: Create `src/components/post-solve/FunnelBar.vue` (AC: 1)
  - [x] 1.1: Define props: `count: number` (word count for this bar) and `isSolveRow: boolean` (true = ✓ solve row)
  - [x] 1.2: Compute `widthPct` = `Math.max((count / 2315) * 100, 0)` — then enforce `min 2px` via `style` binding: use `calc(max(${widthPct}%, 2px))` or set `min-width: 2px` in CSS
  - [x] 1.3: Bar background: `--color-tile-correct` when `!isSolveRow`, `--color-accent-streak` when `isSolveRow`; use `:style` binding with CSS variables
  - [x] 1.4: Label shows word count (`count`) when bar is wide enough (≥ 5% — roughly 30px at standard widths), otherwise shows outside to the right; use computed boolean `labelInside = widthPct >= 5`
  - [x] 1.5: Solve row displays `✓` prefix before the count label — e.g. `"✓ 1"` — to distinguish it from guess rows
  - [x] 1.6: No store access — pure props-driven component

- [x] Task 2: Create `src/components/post-solve/FunnelBar.test.ts` (AC: 1)
  - [x] 2.1: Mount with `count=2315, isSolveRow=false` — verify bar width is 100%, color class/style is tile-correct
  - [x] 2.2: Mount with `count=0, isSolveRow=false` — verify min 2px enforced (not zero width)
  - [x] 2.3: Mount with `count=1, isSolveRow=true` — verify bar color is accent-streak, label shows ✓
  - [x] 2.4: Mount with `count=100, isSolveRow=false` — verify label is inside bar (widthPct ≈ 4.3% — BORDERLINE: test at a clearly wide value like `count=500`, widthPct ≈ 21.6%)
  - [x] 2.5: Mount with `count=10, isSolveRow=false` — verify label is outside bar (widthPct ≈ 0.4%)
  - [x] 2.6: No Pinia needed — pure prop-driven component, no `global: { plugins: [pinia] }` required

- [x] Task 3: Create `src/components/post-solve/FunnelChart.vue` (AC: 2, 3, 4, 5)
  - [x] 3.1: Define props: `funnelData: number[]` (word counts after each guess, 1–6 entries) and `solved: boolean`
  - [x] 3.2: Render a `FunnelBar` for each entry in `funnelData`; last bar gets `isSolveRow=solved` (if solved, the last bar is the solve row ✓; if failed, all bars are guess rows)
  - [x] 3.3: Wrap in `<div role="img" :aria-label="ariaLabel">` where `ariaLabel` is computed — see AC5 format
  - [x] 3.4: Compute `ariaLabel`: if `solved` → `"Solve funnel: 2315 words at start, ${funnelData[0]} after guess 1, ..., solved on guess ${funnelData.length}"`; if failed → `"Fail funnel: 2315 words at start, ${funnelData[0]} after guess 1, ..., ${funnelData[funnelData.length-1]} after guess 6"`
  - [x] 3.5: Renders correctly with `funnelData.length === 1` (first session) — no guard, just renders naturally
  - [x] 3.6: No store access — receives `funnelData` from parent (wired in Story 3.4 via PostSolveTransition)

- [x] Task 4: Create `src/components/post-solve/FunnelChart.test.ts` (AC: 2, 3, 4, 5)
  - [x] 4.1: Mount with `funnelData=[48, 9, 1], solved=true` — verify 3 FunnelBars render, last one has `isSolveRow=true`
  - [x] 4.2: Mount with `funnelData=[120, 45, 18, 6, 2, 1], solved=false` — verify 6 FunnelBars, none with `isSolveRow=true`
  - [x] 4.3: Mount with `funnelData=[2315], solved=false` — verify 1 bar renders (first session, no suppression)
  - [x] 4.4: Verify `role="img"` on wrapper element
  - [x] 4.5: Verify `aria-label` contains all funnel values for a solved case
  - [x] 4.6: Verify `aria-label` contains all funnel values for a failed case
  - [x] 4.7: Run `npm run test:unit` — confirm all 151 pre-existing tests still pass (163 total passing: 151 pre-existing + 12 new)

## Dev Notes

### Architecture Boundary — Props Only, No Store Access

`FunnelBar` and `FunnelChart` are **pure presentation components**. They receive props only. No store imports.

- `funnelData` comes from `useGameStore().funnelData` — but that wiring happens in Story 3.4 (`PostSolveTransition.vue`). This story only builds the components.
- **Do NOT** import `useGameStore` in either component.
- **Do NOT** import `usePersistenceStore`, `useSettingsStore`, or any composable.

### FunnelData Shape

From `useGameStore`:
```ts
const funnelData = ref<number[]>([])
```
- `funnelData` is `number[]` where index = guess number (0-based), value = valid words remaining **after** that guess
- Length = number of guesses submitted (1–6)
- Updated via `engine.getValidWordsRemaining()` after each guess in `useGameStore.submitGuess()`

### FunnelBar Width Calculation

```ts
// widthPct as a percentage (0–100)
const widthPct = computed(() => Math.max((props.count / 2315) * 100, 0))
// enforce 2px minimum in style binding:
const barStyle = computed(() => ({
  width: `calc(max(${widthPct.value}%, 2px))`,
  backgroundColor: props.isSolveRow
    ? 'var(--color-accent-streak)'
    : 'var(--color-tile-correct)',
}))
```

Note: `calc(max(...))` is CSS, not JS `Math.max`. Alternatively, set `min-width: 2px` in scoped CSS and just bind `width: ${widthPct}%`.

### Design Tokens (from `src/style.css`)

All colors via CSS custom properties — never hardcode hex values in components:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-tile-correct` | `#538d4e` | Guess row bar fill |
| `--color-accent-streak` | `#9999cc` | Solve row bar fill |
| `--color-text-primary` | `#f0f0f0` | Label text |
| `--color-text-secondary` | `#a0a0aa` | Outside label text (when bar too narrow) |
| `--color-bg-surface` | `#1a1a22` | Component background |

### Component Pattern — `<script setup lang="ts">`

Follow the established pattern from `GameTile.vue` and `StreakBadge.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  count: number
  isSolveRow: boolean
}>()

const widthPct = computed(() => Math.max((props.count / 2315) * 100, 0))
const labelInside = computed(() => widthPct.value >= 5)
// ...
</script>
```

**`<script setup>` ordering:**
1. Imports
2. `defineProps` / `defineEmits`
3. Computed properties
4. Functions / event handlers
5. Lifecycle hooks (none needed here)

### Testing Pattern — `@vue/test-utils` + `mount`

These are pure prop components — **no Pinia setup needed**. Follow `StreakBadge.test.ts` structure without the localStorage/Pinia boilerplate:

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FunnelBar from './FunnelBar.vue'

describe('FunnelBar', () => {
  it('renders with 100% width when count is 2315', () => {
    const wrapper = mount(FunnelBar, {
      props: { count: 2315, isSolveRow: false },
    })
    // check style or class
  })
})
```

For `FunnelChart.test.ts`, check child component count:
```ts
import FunnelBar from './FunnelBar.vue'
// ...
const bars = wrapper.findAllComponents(FunnelBar)
expect(bars).toHaveLength(3)
expect(bars[2].props('isSolveRow')).toBe(true)
```

### File Structure

| File | Action | Notes |
|------|--------|-------|
| `src/components/post-solve/FunnelBar.vue` | **CREATE** | Pure prop component, no store access |
| `src/components/post-solve/FunnelBar.test.ts` | **CREATE** | Co-located Vitest test |
| `src/components/post-solve/FunnelChart.vue` | **CREATE** | Composes FunnelBar, role="img" |
| `src/components/post-solve/FunnelChart.test.ts` | **CREATE** | Co-located Vitest test |

**`src/components/post-solve/` directory already exists** (has `.gitkeep`). Create files directly there.

**Do NOT create or modify:**
- Any store file — `funnelData` already exists in `useGameStore`, no changes needed
- `src/views/GameView.vue` — wiring happens in Story 3.4
- Any composable — FunnelBar/FunnelChart are pure presentation
- `src/components/game/` files — unrelated, leave intact
- `useAudio.ts` or `useSoundManager.ts` — audio work is done

### ARIA Label Format

For `FunnelChart` `aria-label`:

**Solved (e.g. 3 guesses):**
```
"Solve funnel: 2315 words at start, 48 after guess 1, 9 after guess 2, solved on guess 3"
```

**Failed (6 guesses):**
```
"Fail funnel: 2315 words at start, 120 after guess 1, 45 after guess 2, 18 after guess 3, 6 after guess 4, 2 after guess 5, 1 after guess 6"
```

**Single bar (first session, failed):**
```
"Fail funnel: 2315 words at start, 2315 after guess 1"
```

### Previous Story Intelligence (Story 3.1)

- **`useSoundManager.ts` created** — pure TS composable at `src/composables/useSoundManager.ts`. This story has no interaction with it.
- **Bowl audio files created** — `src/assets/audio/bowl-solve.mp3` and `bowl-fail.mp3`. These components do not touch audio.
- **Architecture boundary held** — story 3.1 created the composable only; story 3.4 wires it. Same pattern here: this story creates the components; story 3.4 wires `funnelData` into them.
- **151 tests passing** after story 3.1 (145 pre-story + 6 new). New tests here add to that count. Confirm all 151 still pass.
- **Test file co-location** — `.test.ts` files live alongside their component in same directory.
- **No `any` type** — TypeScript strict mode; `props.count` is `number`, `props.funnelData` is `number[]`.

### Cross-Story Context (Epic 3)

| Story | What it builds | Dependency |
|-------|---------------|------------|
| 3.1 | `useSoundManager.ts` | Done ✅ |
| **3.2** | `FunnelBar.vue` + `FunnelChart.vue` | **This story** |
| 3.3 | `EtymologyCard.vue` | Next — independent of 3.2 |
| 3.4 | `usePostSolveTransition` + `PostSolveTransition.vue` | Wires 3.1, 3.2, 3.3 together |

Story 3.4 will pass `funnelData` and `solved` props to `FunnelChart`. Keep the prop API clean and predictable.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Boundaries]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR8, UX-DR9]
- [Source: src/components/game/GameTile.vue — script setup pattern]
- [Source: src/components/ui/StreakBadge.test.ts — mount pattern for pure prop components]
- [Source: src/stores/useGameStore.ts — funnelData shape]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_None_

### Completion Notes List

- Created `FunnelBar.vue` as pure prop component with proportional width, 2px minimum enforced via `min-width: 2px` CSS + `width: ${widthPct}%` style binding. Label placement computed via `labelInside = widthPct >= 5`.
- Created `FunnelChart.vue` composing `FunnelBar` with `role="img"` and computed `ariaLabel` matching AC5 format exactly. Last bar gets `isSolveRow=solved`.
- 12 new tests added (6 FunnelBar + 6 FunnelChart). All 163 tests pass (151 pre-existing + 12 new).
- Both components are pure presentation — no store imports anywhere.

### File List

- src/components/post-solve/FunnelBar.vue
- src/components/post-solve/FunnelBar.test.ts
- src/components/post-solve/FunnelChart.vue
- src/components/post-solve/FunnelChart.test.ts

## Change Log

- 2026-03-20: Story created — FunnelBar and FunnelChart components for post-solve funnel visualization
- 2026-03-20: Implementation complete — 4 files created, 12 tests added, all 163 tests passing, status → review
