# Story 2.5: Streak Badge

Status: done

## Story

As a player,
I want to see my current streak in the top-right corner,
So that the quiet motivator is present from the very first session.

## Acceptance Criteria

1. **Given** `StreakBadge.vue` **When** rendered **Then** it is fixed in the top-right corner, 16px from the top and right edges (UX-DR11) **And** it has `aria-label="Current streak: [n] days"` where [n] is the current count

2. **Given** the streak value is greater than 0 **When** `StreakBadge.vue` renders **Then** the count is displayed in `accent-streak` (#9999cc) color using Inter 700 (UX-DR11)

3. **Given** the streak value is 0 **When** `StreakBadge.vue` renders **Then** the count "0" is displayed in `text-secondary` color with no animation, badge, or urgency encoding (FR21, UX-DR11)

4. **Given** `usePersistenceStore` reads `myrdle_streak` from localStorage **When** the key is present and valid **Then** `StreakBadge.vue` displays the stored count on load

5. **Given** `usePersistenceStore` reads `myrdle_streak` from localStorage **When** the key is missing or corrupted **Then** `StreakBadge.vue` displays 0 — no error shown for this field specifically

## Tasks / Subtasks

- [x] Task 1: Create `src/components/ui/StreakBadge.vue` (AC: 1, 2, 3, 4, 5)
  - [x] 1.1: Create directory `src/components/ui/` if it doesn't exist; create `StreakBadge.vue` with `<script setup lang="ts">`
  - [x] 1.2: Import `ref` from `vue`; import `usePersistenceStore` from `@/stores/usePersistenceStore`; call `usePersistenceStore()` and `loadStreak()` in setup, store `count` in `const count = ref(persistenceStore.loadStreak().count)`
  - [x] 1.3: Template: render the `count` value in a `<span>` wrapped by a container; bind `:aria-label="\`Current streak: ${count} days\`"` on the outer element
  - [x] 1.4: Apply conditional class: `streak-count--active` when `count > 0` (color: `var(--color-accent-streak)`, font-weight: 700), `streak-count--zero` when `count === 0` (color: `var(--color-text-secondary)`, font-weight: 700)
  - [x] 1.5: No animation on any state — no CSS transitions, no transforms (UX-DR11); font-family: Inter (inherits from body)

- [x] Task 2: Wire `StreakBadge` in `GameView.vue` (AC: 1)
  - [x] 2.1: Add `import StreakBadge from '@/components/ui/StreakBadge.vue'` to the existing import block in `GameView.vue`
  - [x] 2.2: In the template, replace `<div class="corner-reserved"></div>` with `<div class="corner-reserved"><StreakBadge /></div>` — do NOT alter the `.corner-reserved` CSS (already sets `position: fixed; top: 16px; right: 16px; z-index: 50`)

- [x] Task 3: Write Vitest tests for `StreakBadge.vue` (AC: 2, 3, 4, 5)
  - [x] 3.1: Create `src/components/ui/StreakBadge.test.ts`; import `describe, it, expect, beforeEach, afterEach` from `vitest`; import `mount` from `@vue/test-utils`; import `createPinia, setActivePinia` from `pinia`; import `StreakBadge`
  - [x] 3.2: In `beforeEach`: `localStorage.clear()`, create fresh pinia and `setActivePinia(pinia)`; in `afterEach`: `localStorage.clear()`
  - [x] 3.3: Test: no localStorage key → renders "0" (AC: 5)
  - [x] 3.4: Test: corrupt JSON in `myrdle_streak` → renders "0" (AC: 5)
  - [x] 3.5: Test: valid `myrdle_streak` with count 7 → renders "7" (AC: 4)
  - [x] 3.6: Test: count > 0 → has `.streak-count--active` class (AC: 2)
  - [x] 3.7: Test: count = 0 → has `.streak-count--zero` class (AC: 3)
  - [x] 3.8: Test: `aria-label` equals `"Current streak: 7 days"` when count is 7 (AC: 1)
  - [x] 3.9: Test: `aria-label` equals `"Current streak: 0 days"` when count is 0 (AC: 1)

## Dev Notes

### Critical Constraints

- **`<script setup>` only** — no Options API; all imports from `vue` and Pinia only
- **116 existing tests must keep passing** — run `npm run test:unit` after implementation
- **NO direct `localStorage` access in StreakBadge.vue** — read exclusively via `usePersistenceStore().loadStreak()` (architecture boundary)
- **NO streak write logic in this story** — increment/reset is Epic 4 (FR19/FR20); this story is read-only display
- **Positioning via parent, not component** — `.corner-reserved` in `GameView.vue` already provides `position: fixed; top: 16px; right: 16px; z-index: 50`; StreakBadge does NOT add its own `position: fixed`

### StreakBadge.vue — Complete Implementation Reference

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { usePersistenceStore } from '@/stores/usePersistenceStore'

const persistenceStore = usePersistenceStore()
const count = ref(persistenceStore.loadStreak().count)
</script>

<template>
  <div class="streak-badge" :aria-label="`Current streak: ${count} days`">
    <span :class="count > 0 ? 'streak-count--active' : 'streak-count--zero'">{{ count }}</span>
  </div>
</template>

<style scoped>
.streak-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;
}

.streak-count--active {
  color: var(--color-accent-streak);
  font-weight: 700;
  font-size: 1rem;
}

.streak-count--zero {
  color: var(--color-text-secondary);
  font-weight: 700;
  font-size: 1rem;
}
</style>
```

Notes:
- `loadStreak()` is synchronous — called in setup (not `onMounted`) — value is available immediately
- `loadStreak()` returns `{ count: 0, lastSolvedDate: '' }` on missing key OR corrupted JSON — no special handling needed in the component
- `count` stored as `ref` for future reactivity (Epic 4 streak writes will update this)
- No `onMounted` hook needed — this is a read-only display in this story

### GameView.vue — Minimal Change

Only one change in GameView.vue: add StreakBadge inside `.corner-reserved`.

**Before:**
```vue
<div class="corner-reserved"></div>
```

**After:**
```vue
<div class="corner-reserved"><StreakBadge /></div>
```

**Import to add (in existing import block):**
```ts
import StreakBadge from '@/components/ui/StreakBadge.vue'
```

**Do NOT alter:**
- `.corner-reserved` CSS (already correct)
- Any other template markup, computed properties, or functions
- `handleKeyPress`, `letterStates`, `getTodayUTC`, `onMounted`, `useKeyboard`
- Any game store logic

### StreakBadge.test.ts — Key Test Scenarios

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import StreakBadge from './StreakBadge.vue'

describe('StreakBadge', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('displays 0 when myrdle_streak is not in localStorage', () => {
    const wrapper = mount(StreakBadge, { global: { plugins: [pinia] } })
    expect(wrapper.text()).toBe('0')
  })

  it('displays 0 when myrdle_streak is corrupted', () => {
    localStorage.setItem('myrdle_streak', 'not-valid-json{{{')
    const wrapper = mount(StreakBadge, { global: { plugins: [pinia] } })
    expect(wrapper.text()).toBe('0')
  })

  it('displays stored count when myrdle_streak is present and valid', () => {
    localStorage.setItem('myrdle_streak', JSON.stringify({ count: 7, lastSolvedDate: '2026-03-20' }))
    const wrapper = mount(StreakBadge, { global: { plugins: [pinia] } })
    expect(wrapper.text()).toBe('7')
  })

  it('has streak-count--active class when count > 0', () => {
    localStorage.setItem('myrdle_streak', JSON.stringify({ count: 3, lastSolvedDate: '2026-03-20' }))
    const wrapper = mount(StreakBadge, { global: { plugins: [pinia] } })
    expect(wrapper.find('.streak-count--active').exists()).toBe(true)
    expect(wrapper.find('.streak-count--zero').exists()).toBe(false)
  })

  it('has streak-count--zero class when count is 0', () => {
    const wrapper = mount(StreakBadge, { global: { plugins: [pinia] } })
    expect(wrapper.find('.streak-count--zero').exists()).toBe(true)
    expect(wrapper.find('.streak-count--active').exists()).toBe(false)
  })

  it('has correct aria-label when count is 7', () => {
    localStorage.setItem('myrdle_streak', JSON.stringify({ count: 7, lastSolvedDate: '2026-03-20' }))
    const wrapper = mount(StreakBadge, { global: { plugins: [pinia] } })
    expect(wrapper.find('.streak-badge').attributes('aria-label')).toBe('Current streak: 7 days')
  })

  it('has correct aria-label when count is 0', () => {
    const wrapper = mount(StreakBadge, { global: { plugins: [pinia] } })
    expect(wrapper.find('.streak-badge').attributes('aria-label')).toBe('Current streak: 0 days')
  })
})
```

### Design Tokens (Already in `src/style.css`)

```
--color-accent-streak: #9999cc   ← active streak count color (UX-DR11)
--color-text-secondary: #a0a0aa  ← zero streak count color, no drama (UX-DR11)
```

**Do NOT add these tokens to `style.css`** — they already exist.

### usePersistenceStore API (Already Implemented — No Changes Needed)

```ts
// usePersistenceStore return shape:
const persistenceStore = usePersistenceStore()

persistenceStore.loadStreak()
// → StreakData: { count: number, lastSolvedDate: string }
// → Returns { count: 0, lastSolvedDate: '' } on missing key OR corrupted JSON
// → Sets storageError.value = true on corrupted JSON (but StreakBadge ignores storageError)

// StreakData interface (src/types/persistence.ts):
interface StreakData {
  count: number
  lastSolvedDate: string // YYYY-MM-DD UTC
}
```

### File Structure — What to Create/Modify

| File | Action | Notes |
|------|--------|-------|
| `src/components/ui/StreakBadge.vue` | **CREATE** | Streak display component |
| `src/components/ui/StreakBadge.test.ts` | **CREATE** | Co-located Vitest test |
| `src/views/GameView.vue` | **MODIFY** | Add 1 import + wire StreakBadge in template |

**Do NOT create or modify:**
- `src/stores/usePersistenceStore.ts` — `loadStreak()` already fully implemented
- `src/types/persistence.ts` — `StreakData` interface already exists
- `src/style.css` — `--color-accent-streak` and `--color-text-secondary` already defined
- Any game store or game engine files
- Any existing component files other than `GameView.vue`

### Previous Story Learnings (from 2.4 and 2.3)

- **`<script setup>` only** — no Options API; confirmed pattern across all components
- **Component tests use `createPinia()` + `setActivePinia(pinia)` in `beforeEach`** — see `GameView.test.ts` for exact pattern
- **`localStorage.clear()` in `beforeEach` and `afterEach`** — required when tests use localStorage-backed stores; prevents test pollution
- **Co-located test files** — `StreakBadge.test.ts` lives at `src/components/ui/StreakBadge.test.ts` alongside the component
- **116 tests pass at start** (as of Story 2.4) — confirm still passing at completion
- **Tailwind v4 CSS custom properties** — use `var(--color-accent-streak)` directly in scoped CSS
- **`usePersistenceStore` is synchronous** — `loadStreak()` reads from localStorage synchronously; call in `<script setup>` body (no `onMounted` needed)

### GameView Corner Architecture (Pre-Wired in 2.1)

The `.corner-reserved` div was added in Story 2.1 specifically to hold StreakBadge (and later SettingsPanel). Key facts:
- It sits OUTSIDE `.game-root` — prevents `overflow: hidden` from breaking `position: fixed`
- `.corner-reserved` CSS: `position: fixed; top: 16px; right: 16px; min-width: max-content; min-height: max-content; z-index: 50`
- Comment in template: `<!-- Outside game-root to avoid overflow:hidden breaking position:fixed -->`
- **Do not move it, do not change its CSS** — just add `<StreakBadge />` inside it

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture — localStorage Schema]
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#StreakBadge]
- [Source: _bmad-output/implementation-artifacts/2-4-gameplay-loop-and-physical-keyboard.md#Dev Notes]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_None_

### Completion Notes List

- Created `src/components/ui/StreakBadge.vue` as a read-only display component using `<script setup lang="ts">`. Reads streak count synchronously from `usePersistenceStore().loadStreak()` on setup. No direct localStorage access, no animations, no write logic.
- Wired `StreakBadge` into `GameView.vue` by adding import and placing `<StreakBadge />` inside the pre-existing `.corner-reserved` div. No CSS changes made.
- Created 7 co-located Vitest tests covering: missing key, corrupted JSON, valid count display, active/zero CSS classes, and aria-label for both zero and non-zero counts.
- All 131 tests pass (116 pre-existing + 7 new). No regressions.

### File List

- `src/components/ui/StreakBadge.vue` — created
- `src/components/ui/StreakBadge.test.ts` — created
- `src/views/GameView.vue` — modified (added import + wired component)

## Change Log

- 2026-03-20: Story created from Epic 2 spec, architecture analysis, and previous story learnings
- 2026-03-20: Story implemented — StreakBadge component created, wired in GameView, 7 tests added, 131/131 passing
