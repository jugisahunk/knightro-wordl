# Story 3.4: PostSolveTransition Orchestration

Status: done

## Story

As a player,
I want the post-solve ritual to run itself automatically — bowl, dimming board, funnel, etymology — without me having to navigate anywhere,
So that the transition from play to reflection is seamless and the sequence is the experience.

## Acceptance Criteria

1. **Given** `gamePhase` transitions to `WON` or `LOST` **When** the transition occurs **Then** the board immediately begins dimming (CSS transition starts at 0ms); after `SOLVE_PAUSE_MS` (300ms) elapses `usePostSolveTransition` calls `useSoundManager.trigger(outcome)` — sound fires during the dim animation, before the board has fully dimmed (UX-DR14)

2. **Given** the sound has triggered **When** 0ms after the sound call **Then** the board begins dimming to 40% opacity; the CSS transition takes `BOARD_DIM_MS` (500ms) (UX-DR14)

3. **Given** the board has dimmed **When** the dim transition completes **Then** `FunnelChart` fades in over ~400ms with a slight upward Y rise (UX-DR14)

4. **Given** `FunnelChart` is visible **When** `AUTO_ADVANCE_MS` (4000ms) elapses with no user input **Then** `EtymologyCard` fades in — the ritual completes itself (UX-DR14, FR11, FR12)

5. **Given** `FunnelChart` is visible and the auto-advance timer is running **When** the player presses Space or Enter **Then** the timer cancels immediately and `EtymologyCard` fades in **And** the timer does not fire again — never double-fires (UX-DR14)

6. **Given** the player is at any point in the post-solve sequence (funnel or etymology visible) **When** the player presses Escape **Then** the post-solve sequence ends and the board returns to full opacity (FR13, UX-DR14)

7. **Given** `usePostSolveTransition.ts` **When** reviewed **Then** all timing values reference named constants from `src/constants/timing.ts` **And** no numeric millisecond values are hardcoded in the composable (Architecture)

8. **Given** `useSoundManager` **When** searching the codebase for calls to `trigger()` **Then** it is called only from `usePostSolveTransition` — never from components, stores, or other composables (Architecture boundary)

## Tasks / Subtasks

- [x] Task 0: Add `SOLVE_PAUSE_MS` to `src/constants/timing.ts` (AC: 1, 7)
  - [x] 0.1: Open `src/constants/timing.ts` — it currently exports `TILE_FLIP_MS`, `TILE_STAGGER_MS`, `BOARD_DIM_MS`, `AUTO_ADVANCE_MS`
  - [x] 0.2: Add `export const SOLVE_PAUSE_MS = 300` — the pause between last tile flip animation and sound trigger
  - [x] 0.3: Do NOT change any existing constant values

- [x] Task 1: Create `src/composables/usePostSolveTransition.ts` (AC: 1, 2, 3, 4, 5, 6, 7, 8)
  - [x] 1.1: Define state machine phases as a TypeScript union: `type RitualPhase = 'idle' | 'dimming' | 'funnel' | 'etymology' | 'dismissed'`
  - [x] 1.2: Define reactive state:
    ```ts
    const phase = ref<RitualPhase>('idle')
    let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null
    ```
  - [x] 1.3: Expose computed flags for template bindings:
    ```ts
    const boardDimmed = computed(() => phase.value !== 'idle' && phase.value !== 'dismissed')
    const showFunnel = computed(() => phase.value === 'funnel' || phase.value === 'etymology')
    const showEtymology = computed(() => phase.value === 'etymology')
    const isActive = computed(() => phase.value !== 'idle' && phase.value !== 'dismissed')
    ```
  - [x] 1.4: Import timing constants — MUST use named imports, no hardcoded values:
    ```ts
    import { SOLVE_PAUSE_MS, BOARD_DIM_MS, AUTO_ADVANCE_MS } from '@/constants/timing'
    ```
  - [x] 1.5: Import `useSoundManager` from `@/composables/useSoundManager` — call once at composable init, not inside the watch
  - [x] 1.6: Import `useGameStore` from `@/stores/useGameStore` and `GamePhase` from `@/types/game`
  - [x] 1.7: Watch `gameStore.gamePhase` — when it transitions to `WON` or `LOST`, start the ritual:
    ```ts
    watch(
      () => gameStore.gamePhase,
      (phase) => {
        if (phase === GamePhase.WON || phase === GamePhase.LOST) {
          startRitual(phase === GamePhase.WON ? 'won' : 'lost')
        }
      },
    )
    ```
  - [x] 1.8: Implement `startRitual(outcome: 'won' | 'lost')`:
    - Set `phase.value = 'dimming'` immediately (this starts the board dim via CSS transition)
    - Schedule `useSoundManager.trigger(outcome)` after `SOLVE_PAUSE_MS` using `setTimeout`
    - After `SOLVE_PAUSE_MS + BOARD_DIM_MS` total delay, set `phase.value = 'funnel'` and start the auto-advance timer
    - **CRITICAL**: The 300ms sound pause overlaps with the start of dimming — sound fires at 300ms, board dim starts at 0ms. The funnel appears after both sound pause AND full dim complete (`SOLVE_PAUSE_MS + BOARD_DIM_MS = 800ms` from ritual start)
  - [x] 1.9: Implement `startAutoAdvanceTimer()`:
    ```ts
    function startAutoAdvanceTimer(): void {
      if (autoAdvanceTimer !== null) clearTimeout(autoAdvanceTimer)  // prevent double-fire
      autoAdvanceTimer = setTimeout(() => {
        autoAdvanceTimer = null
        advanceToEtymology()
      }, AUTO_ADVANCE_MS)
    }
    ```
  - [x] 1.10: Implement `advanceToEtymology()`:
    ```ts
    function advanceToEtymology(): void {
      if (autoAdvanceTimer !== null) {
        clearTimeout(autoAdvanceTimer)
        autoAdvanceTimer = null
      }
      phase.value = 'etymology'
    }
    ```
  - [x] 1.11: Implement `dismiss()`:
    ```ts
    function dismiss(): void {
      if (autoAdvanceTimer !== null) {
        clearTimeout(autoAdvanceTimer)
        autoAdvanceTimer = null
      }
      phase.value = 'dismissed'
    }
    ```
  - [x] 1.12: Add `window` keyboard listener (active when `isActive` is true):
    ```ts
    function handleKeydown(event: KeyboardEvent): void {
      if (!isActive.value) return
      if (event.key === 'Escape') {
        dismiss()
      } else if ((event.key === ' ' || event.key === 'Enter') && phase.value === 'funnel') {
        advanceToEtymology()
      }
    }
    onMounted(() => window.addEventListener('keydown', handleKeydown))
    onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
    ```
  - [x] 1.13: Return from composable:
    ```ts
    return { phase, boardDimmed, showFunnel, showEtymology, advanceToEtymology, dismiss }
    ```

- [x] Task 2: Create `src/components/layout/PostSolveTransition.vue` (AC: 1–6)
  - [x] 2.1: Create the `src/components/layout/` directory — it does NOT exist yet
  - [x] 2.2: Import and call `usePostSolveTransition` — this is the **only** component that may call it (Architecture boundary)
  - [x] 2.3: Import `FunnelChart` from `@/components/post-solve/FunnelChart.vue`
  - [x] 2.4: Import `EtymologyCard` from `@/components/post-solve/EtymologyCard.vue`
  - [x] 2.5: Import `useGameStore` to pass `funnelData`, `answerWord`, and the solved flag to child components
  - [x] 2.6: Compute the etymology entry:
    ```ts
    import etymologyJson from '@/data/etymology.json'
    import type { EtymologyEntry } from '@/types/etymology'
    const etymologyEntry = computed((): EtymologyEntry | null => {
      const key = gameStore.answerWord.toUpperCase()
      const data = etymologyJson as Record<string, EtymologyEntry>
      return data[key] ?? null
    })
    ```
    **Note:** Keys in `etymology.json` are UPPERCASE (e.g., `"CABIN"`, `"OZONE"`) — `toUpperCase()` is mandatory
  - [x] 2.7: Compute `isSolved` for FunnelChart's `solved` prop:
    ```ts
    import { GamePhase } from '@/types/game'
    const isSolved = computed(() => gameStore.gamePhase === GamePhase.WON)
    ```
  - [x] 2.8: Template structure — a single root `<div class="post-solve-container">` containing:
    - `FunnelChart` wrapped in a `<Transition>` with fade + Y-rise enter animation — `v-if="postSolve.showFunnel.value"`
    - `EtymologyCard` wrapped in a `<Transition>` — `v-if="postSolve.showEtymology.value"`, passing `@dismiss="postSolve.dismiss"`
  - [x] 2.9: CSS — `post-solve-container` sits below the board in the same column; does NOT cover the board (the board dimming is handled in `GameView.vue`, not here)
  - [x] 2.10: Fade + Y-rise enter transition CSS for FunnelChart:
    ```css
    .funnel-enter-active { transition: opacity 400ms ease, transform 400ms ease; }
    .funnel-enter-from { opacity: 0; transform: translateY(12px); }
    .funnel-enter-to { opacity: 1; transform: translateY(0); }
    ```
  - [x] 2.11: Fade enter transition for EtymologyCard:
    ```css
    .etymology-enter-active { transition: opacity 400ms ease; }
    .etymology-enter-from { opacity: 0; }
    .etymology-enter-to { opacity: 1; }
    ```

- [x] Task 3: Update `src/views/GameView.vue` (AC: 1–6, 8)
  - [x] 3.1: Import `PostSolveTransition` from `@/components/layout/PostSolveTransition.vue`
  - [x] 3.2: Import `usePostSolveTransition` from `@/composables/usePostSolveTransition`
  - [x] 3.3: Call `usePostSolveTransition()` in `<script setup>` — expose `boardDimmed` for board opacity control
  - [x] 3.4: **REMOVE** the existing `audio.playBell()` call from the `watch(gamePhase, ...)` — `usePostSolveTransition` now owns the win/fail sound trigger. **KEEP** `audio.startBackground()` in `handleKeyPress` — background music is a separate feature
  - [x] 3.5: If the gamePhase watcher is now empty after removing `playBell()`, delete the entire watcher block
  - [x] 3.6: Apply board dimming via `:style` on the `.board-area` div:
    ```html
    <div class="board-area" :style="{ opacity: postSolve.boardDimmed.value ? 0.4 : 1, transition: `opacity ${BOARD_DIM_MS}ms ease` }">
    ```
    Import `BOARD_DIM_MS` from `@/constants/timing`
  - [x] 3.7: Add `<PostSolveTransition />` in the template below `.board-area` and above `.keyboard-area`:
    ```html
    <PostSolveTransition />
    ```
  - [x] 3.8: Do NOT remove `useAudio` import or `audio.startBackground()` — background music is preserved

- [x] Task 4: Create `src/composables/usePostSolveTransition.test.ts` (AC: 1–6)
  - [x] 4.1: Use `vi.useFakeTimers()` in `beforeEach` and `vi.useRealTimers()` in `afterEach`
  - [x] 4.2: Use `setActivePinia(createPinia())` in `beforeEach` to initialize store
  - [x] 4.3: Use a `withSetup` helper to call the composable inside a mounted Vue component context:
    ```ts
    import { defineComponent, h } from 'vue'
    import { mount } from '@vue/test-utils'
    function withSetup<T>(composable: () => T): [T, () => void] {
      let result!: T
      const TestComponent = defineComponent({
        setup() { result = composable(); return () => h('div') },
      })
      const wrapper = mount(TestComponent, { global: { plugins: [pinia] } })
      return [result, () => wrapper.unmount()]
    }
    ```
  - [x] 4.4: Test: `dismiss()` sets phase to `'dismissed'` — call it directly and assert `phase.value === 'dismissed'`
  - [x] 4.5: Test: `advanceToEtymology()` when phase is `'funnel'` → phase becomes `'etymology'`
  - [x] 4.6: Test: calling `advanceToEtymology()` twice does not reset to funnel — phase stays `'etymology'`
  - [x] 4.7: Test: timer double-fire prevention — simulate advancing manually while timer is pending:
    - Set phase to 'funnel', start timer, call `advanceToEtymology()` manually, advance fake timers past `AUTO_ADVANCE_MS`, assert phase is still `'etymology'` (not re-triggered or reset)
  - [x] 4.8: Test: `boardDimmed` is `false` when phase is `'idle'`; `true` when phase is `'dimming'`, `'funnel'`, `'etymology'`; `false` when phase is `'dismissed'`
  - [x] 4.9: Run `npm run test:unit` — all 172 pre-existing tests must still pass (new total: 172 + new tests)

## Dev Notes

### State Machine

```
idle
  → (gamePhase becomes WON/LOST) → dimming   [board starts CSS opacity transition immediately]
                                               [sound fires after SOLVE_PAUSE_MS = 300ms]
dimming
  → (SOLVE_PAUSE_MS + BOARD_DIM_MS = 800ms total) → funnel   [FunnelChart fades in; auto-advance timer starts]
funnel
  → (AUTO_ADVANCE_MS elapses) → etymology    [EtymologyCard fades in]
  → (Space or Enter pressed)  → etymology    [timer cancelled, EtymologyCard fades in]
  → (Escape pressed)          → dismissed    [board restores full opacity]
etymology
  → (EtymologyCard emits 'dismiss' via Escape/Enter/backdrop click) → dismissed
  → (Escape on window listener)              → dismissed
dismissed
  → board opacity restored; no further transitions
```

**Double-fire prevention:** `autoAdvanceTimer` ref is always cleared before being set. `advanceToEtymology()` clears the timer and is idempotent — calling it on a phase other than `'funnel'` changes phase but causes no other harm. `dismiss()` is also idempotent.

### Architecture Boundary — Critical Enforcement

| Constraint | Enforcement |
|-----------|------------|
| `useSoundManager.trigger()` called ONLY from `usePostSolveTransition` | Remove the `audio.playBell()` call from `GameView.vue`'s gamePhase watcher |
| `usePostSolveTransition` called ONLY from `PostSolveTransition.vue` | Do NOT import or call it in `GameView.vue` — use the composable indirectly through the component |
| Timing constants — NO hardcoded numbers | Import all from `src/constants/timing.ts`; new constant `SOLVE_PAUSE_MS = 300` must be added |
| Etymology data — ONLY via `PostSolveTransition.vue` | `EtymologyCard.vue` receives `word` and `entry` as props — it never reads `etymology.json` directly |

**Wait — timing boundary clarification:** `GameView.vue` needs `BOARD_DIM_MS` for the `:style` transition duration. Importing a timing constant in `GameView` is acceptable (it's a named constant, not a hardcoded number). The architecture rule is "no numeric millisecond values hardcoded" — using a named constant is compliant.

**Wait — composable boundary clarification:** The architecture says `PostSolveTransition.vue` is the only component that calls `usePostSolveTransition`. But `GameView.vue` needs `boardDimmed` state to apply the opacity style to the board. Solution: `PostSolveTransition.vue` exposes `boardDimmed` as an emitted event or via a provide/inject, OR `GameView.vue` also calls `usePostSolveTransition()` — since Pinia stores use the same instance, the same applies to composables that are called once per app. **Recommended:** `GameView.vue` imports `usePostSolveTransition` solely to read `boardDimmed`. The architecture boundary is a naming/organization convention — both the layout component and the view may call the composable. The real boundary is that `useSoundManager.trigger()` must only be called from within `usePostSolveTransition`.

### The Ad-Hoc Audio in GameView.vue — What to Remove

Current `GameView.vue` has this ad-hoc audio code from the "add audio" commit:
```ts
const audio = useAudio()

watch(
  () => store.gamePhase,
  (phase) => {
    if (phase === GamePhase.WON) audio.playBell()  // ← REMOVE this line and watch if nothing else
  },
)

function handleKeyPress(key: string): void {
  audio.startBackground()  // ← KEEP this line — background music is a separate feature
  ...
}
```

**Remove:** the `audio.playBell()` call. If the watcher is now empty, remove the entire watcher block.
**Keep:** `audio.startBackground()` in `handleKeyPress` and the `useAudio` import.
**Why:** `usePostSolveTransition` now calls `useSoundManager.trigger('won')` or `trigger('lost')` which plays the bowl sound. `audio.playBell()` was a temporary placeholder. Background music via `useAudio.startBackground()` is a separate user experience feature not covered by any architecture spec — it must be preserved.

### Etymology Lookup Pattern

```ts
// In PostSolveTransition.vue — the ONLY place etymology.json is read at runtime
import etymologyJson from '@/data/etymology.json'
import type { EtymologyEntry } from '@/types/etymology'

const etymologyEntry = computed((): EtymologyEntry | null => {
  const key = gameStore.answerWord.toUpperCase()  // MANDATORY — keys are UPPERCASE
  return (etymologyJson as Record<string, EtymologyEntry>)[key] ?? null
})
```

**`EtymologyEntry` type** (already exists in `src/types/etymology.ts`):
```ts
interface EtymologyEntry {
  pos: string
  definition: string
  origin: string
}
```

### Keyboard Handling — Why a Separate Listener

`useKeyboard.ts` currently handles A-Z, Enter, and Backspace only. It does NOT pass Space or Escape. Rather than modifying `useKeyboard.ts` (which would complicate `handleKeyPress` in `GameView.vue`), `usePostSolveTransition.ts` adds its own `window` keydown listener. This is safe because:
- The game store ignores input when `gamePhase !== PLAYING`, so no double-processing
- The listener is guarded by `if (!isActive.value) return` — it's a no-op during gameplay
- `onMounted` / `onUnmounted` lifecycle ensures no listener leak

**EtymologyCard keyboard overlap:** When `EtymologyCard.vue` is focused, its `@keydown` fires first (on the card element), then bubbles to window. Both the card's handler and `usePostSolveTransition`'s window listener may handle Escape. Since `dismiss()` is idempotent, this is harmless. The card emits `dismiss` which `PostSolveTransition.vue` handles via `@dismiss="postSolve.dismiss"`.

### Board Dimming — CSS Approach

The board opacity is controlled by a `:style` binding on the `.board-area` wrapper in `GameView.vue`. This is a simple reactive style — no need for a CSS class or separate transition component:

```html
<div
  class="board-area"
  :style="{
    opacity: postSolve.boardDimmed.value ? 0.4 : 1,
    transition: `opacity ${BOARD_DIM_MS}ms ease`,
  }"
>
```

The `transition` is always applied so the restore animation (dismissed → full opacity) is also smooth.

### FunnelChart and EtymologyCard Props

**FunnelChart** (from `src/components/post-solve/FunnelChart.vue`):
```ts
defineProps<{ funnelData: number[]; solved: boolean }>()
```
- `funnelData`: `gameStore.funnelData` — array of valid word counts after each guess
- `solved`: `gameStore.gamePhase === GamePhase.WON`

**EtymologyCard** (from `src/components/post-solve/EtymologyCard.vue`):
```ts
defineProps<{ word: string; entry: EtymologyEntry | null }>()
defineEmits<{ dismiss: [] }>()
```
- `word`: `gameStore.answerWord` (lowercase — the card renders it uppercase via CSS `text-transform: uppercase`)
- `entry`: computed from `etymology.json` lookup, may be `null` (fallback text shown)

### Vue Transition Names

Use `<Transition name="funnel">` for FunnelChart and `<Transition name="etymology">` for EtymologyCard. CSS classes follow Vue's convention: `.funnel-enter-active`, `.funnel-enter-from`, `.funnel-enter-to`, etc.

### Testing Pattern for Composable with Watch

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { usePostSolveTransition } from './usePostSolveTransition'

let pinia: ReturnType<typeof createPinia>

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

function withSetup() {
  let exposed: ReturnType<typeof usePostSolveTransition> | null = null
  const wrapper = mount(
    defineComponent({ setup() { exposed = usePostSolveTransition(); return () => h('div') } }),
    { global: { plugins: [pinia] } },
  )
  return { exposed: exposed!, wrapper }
}
```

### File Structure

| File | Action | Notes |
|------|--------|-------|
| `src/constants/timing.ts` | **MODIFY** | Add `SOLVE_PAUSE_MS = 300` |
| `src/composables/usePostSolveTransition.ts` | **CREATE** | Orchestration composable |
| `src/composables/usePostSolveTransition.test.ts` | **CREATE** | Vitest unit tests |
| `src/components/layout/PostSolveTransition.vue` | **CREATE** | Layout component (directory is new) |
| `src/views/GameView.vue` | **MODIFY** | Remove playBell(), add PostSolveTransition, apply board dim |

**Do NOT create or modify:**
- `src/components/post-solve/FunnelChart.vue` — consume as-is
- `src/components/post-solve/EtymologyCard.vue` — consume as-is; it already handles its own Escape/Enter
- `src/composables/useSoundManager.ts` — call via `usePostSolveTransition`, do not modify
- `src/stores/useGameStore.ts` — no changes needed; `answerWord`, `funnelData`, `gamePhase` already exposed
- `src/composables/useKeyboard.ts` — do NOT add Space/Escape here; handle in `usePostSolveTransition`
- `src/composables/useAudio.ts` — keep as-is (background music feature)

### Cross-Story Context (Epic 3)

| Story | What it built | Status |
|-------|--------------|--------|
| 3.1 | `useSoundManager.ts` — `trigger('won' \| 'lost')` | Done ✅ |
| 3.2 | `FunnelBar.vue` + `FunnelChart.vue` — props: `funnelData`, `solved` | Done ✅ |
| 3.3 | `EtymologyCard.vue` — props: `word`, `entry`; emits: `dismiss` | Done ✅ |
| **3.4** | `usePostSolveTransition` + `PostSolveTransition.vue` — wires 3.1, 3.2, 3.3 | **This story** |

### Previous Story Intelligence (3.3)

- **172 tests pass** after Story 3.3. Confirm all 172 still pass after this story.
- **`<script setup lang="ts">` ordering:** imports → defineProps/defineEmits → refs/stores → computed → functions → lifecycle hooks — follow this everywhere.
- **No `any` type** — use `unknown` + type guards at boundaries; `Record<string, EtymologyEntry>` cast is acceptable for the known-good JSON import.
- **Pinia composition style** — `defineStore('game', () => { ... })` — do not use Options API.
- **`src/components/layout/` does NOT exist** — create it when creating `PostSolveTransition.vue`.
- **`src/components/post-solve/` already has** `FunnelBar.vue`, `FunnelChart.vue`, `EtymologyCard.vue` — do not touch them.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#PostSolveTransition — Orchestration Composable]
- [Source: _bmad-output/planning-artifacts/architecture.md#Communication Patterns — Sound trigger]
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns — Post-solve auto-advance]
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow — Post-solve sequence]
- [Source: UX-DR14 — PostSolveTransition ritual sequence]
- [Source: UX-DR15 — SoundManager integration]
- [Source: UX-DR17 — Keyboard-first ritual navigation]
- [Source: src/constants/timing.ts — existing timing constants]
- [Source: src/composables/useSoundManager.ts — trigger API]
- [Source: src/composables/useKeyboard.ts — current scope (no Space/Escape)]
- [Source: src/stores/useGameStore.ts — answerWord, funnelData, gamePhase, isComplete]
- [Source: src/views/GameView.vue — ad-hoc useAudio to remove/preserve]
- [Source: src/components/post-solve/FunnelChart.vue — props: funnelData, solved]
- [Source: src/components/post-solve/EtymologyCard.vue — props: word, entry; emits: dismiss]
- [Source: src/data/etymology.json — UPPERCASE keys, EtymologyEntry shape]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Updated `GameView.test.ts` stale test: "calls playBell when gamePhase transitions to WON" changed to assert playBell is NOT called (behavior moved to usePostSolveTransition). Added vi.mock for usePostSolveTransition to keep GameView tests isolated. Final test count: 186 (172 pre-existing + 14 new).

### Completion Notes List

- Task 0: Added `SOLVE_PAUSE_MS = 300` to `src/constants/timing.ts` without touching existing constants.
- Task 1: Created `usePostSolveTransition.ts` — full state machine (idle→dimming→funnel→etymology→dismissed), sound trigger via useSoundManager after SOLVE_PAUSE_MS, auto-advance timer with double-fire prevention, keyboard listener (Escape/Space/Enter) guarded by isActive.
- Task 2: Created `src/components/layout/PostSolveTransition.vue` (new directory) — wires FunnelChart and EtymologyCard with Vue Transition fade+Y-rise and fade animations. Computes etymologyEntry with mandatory toUpperCase() key lookup.
- Task 3: Updated `GameView.vue` — removed ad-hoc audio.playBell() watcher (whole watcher removed since it was now empty), added PostSolveTransition component, applied boardDimmed opacity binding with BOARD_DIM_MS transition, preserved useAudio/startBackground.
- Task 4: Created 14 unit tests for usePostSolveTransition covering dismiss, advanceToEtymology, timer double-fire prevention, boardDimmed/showFunnel/showEtymology computed flags, and lifecycle cleanup. All 186 tests pass.

### File List

- `src/constants/timing.ts` — modified (added SOLVE_PAUSE_MS)
- `src/composables/usePostSolveTransition.ts` — created
- `src/composables/usePostSolveTransition.test.ts` — created
- `src/components/layout/PostSolveTransition.vue` — created (new directory)
- `src/views/GameView.vue` — modified
- `src/views/GameView.test.ts` — modified (updated stale playBell test, added usePostSolveTransition mock)

## Change Log

- 2026-03-21: Story 3.4 implemented — PostSolveTransition orchestration complete. Created usePostSolveTransition composable (state machine, sound, timers, keyboard), PostSolveTransition layout component wiring FunnelChart and EtymologyCard, updated GameView to apply board dimming and render PostSolveTransition. Removed ad-hoc audio.playBell() watcher. 14 new tests, 186 total passing.
