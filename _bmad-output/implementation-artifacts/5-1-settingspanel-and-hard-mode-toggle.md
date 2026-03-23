# Story 5.1: SettingsPanel and Hard Mode Toggle

Status: done

## Story

As a player,
I want to toggle hard mode from a peripheral corner panel without interrupting my puzzle,
So that I can configure my daily ritual without the settings ever competing with the board.

## Acceptance Criteria

**AC1 — Panel opens as inline panel (not modal)**
Given a small trigger icon in the top-right corner area
When the player clicks it
Then `SettingsPanel.vue` opens as an inline panel (~220px wide) anchored below/beside the trigger — not a centered modal (FR26, UX-DR12)

**AC2 — Hard mode toggles and persists when no puzzle in progress**
Given `SettingsPanel.vue` is open and no puzzle is in progress today (activeRow === 0)
When the player toggles the hard mode switch
Then `useSettingsStore.hardMode` toggles immediately
And the new value is persisted to `myrdle_settings` via `usePersistenceStore` (FR26)

**AC3 — Hard mode locked mid-puzzle**
Given `SettingsPanel.vue` is open and a puzzle is already in progress today (activeRow > 0 OR game complete)
When the player views the hard mode toggle
Then the toggle is non-interactive and displays the quiet inline note "Available after today's puzzle" (FR26, UX-DR12)

**AC4 — Panel dismisses on Escape and click-outside**
Given `SettingsPanel.vue` is open
When the player presses Escape or clicks outside the panel
Then the panel closes and focus returns to the board (UX-DR12)

**AC5 — Hard mode constraint enforcement (existing wiring verification)**
Given `useSettingsStore.hardMode` is `true` and a puzzle is in progress
When the player submits a guess that violates a revealed hard mode constraint
Then the guess is rejected (enforced via `useGameEngine.isHardModeValid` — already wired in `GameView.vue`)

## Tasks / Subtasks

- [x] Task 1: Wire settings persistence into `useSettingsStore`
  - [x] 1.1: On store init, call `usePersistenceStore().loadSettings()` and apply `hardMode` / `deuteranopia` to the refs (mirrors how `usePersistenceStore` init-loads `streakData`)
  - [x] 1.2: In `setHardMode(value)`, after updating the ref, call `usePersistenceStore().saveSettings({ hardMode: value, deuteranopia: deuteranopia.value })`
  - [x] 1.3: In `setDeuteranopia(value)`, after updating the ref, call `usePersistenceStore().saveSettings({ hardMode: hardMode.value, deuteranopia: value })`
  - [x] 1.4: Vitest unit test: `useSettingsStore` initializes from persisted settings; `setHardMode` calls `saveSettings`

- [x] Task 2: Create `SettingsPanel.vue`
  - [x] 2.1: Implement the panel at `src/components/ui/SettingsPanel.vue` using `<script setup>` style
  - [x] 2.2: Accept `modelValue: boolean` prop (open/closed state) and emit `update:modelValue` on close
  - [x] 2.3: Render hard mode toggle row: label + `<button role="switch">` with `aria-checked`; when `isHardModeLocked` (computed), show "Available after today's puzzle" note and make toggle non-interactive
  - [x] 2.4: Implement click-outside dismiss via a transparent backdrop `div` behind the panel (z-index layering)
  - [x] 2.5: Implement Escape key dismiss via `onMounted` / `onUnmounted` keydown listener on `window` (guard: only fire when panel is open)
  - [x] 2.6: Implement focus trap: on open, focus the first interactive element; on close, return focus to the trigger
  - [x] 2.7: Vitest component test: renders correctly, toggle changes store, locked state shows note

- [x] Task 3: Wire `SettingsPanel` into `GameView.vue`
  - [x] 3.1: Add settings trigger icon (⚙ or similar, `aria-label="Open settings"`) inside the `.corner-reserved` div alongside `StreakBadge`
  - [x] 3.2: Add `ref settingsPanelOpen = ref(false)` and wire to trigger click
  - [x] 3.3: Render `<SettingsPanel v-model="settingsPanelOpen" />` inside `.corner-reserved`
  - [x] 3.4: Confirm `settingsStore.hardMode` is already passed to `store.submitGuess()` — no change needed (AC5 is existing wiring)

- [x] Task 4: Settings persistence on app load
  - [x] 4.1: In `GameView.vue` `onMounted`, after loading the game record, also call `settingsStore.loadPersistedSettings()` (new action from Task 1) OR rely on store IIFE init (store init-loads settings automatically — verify the approach works)

- [x] Task 5: E2E smoke test
  - [x] 5.1: Create `e2e/settings.spec.ts` with 2 tests:
    - Test 1: click trigger → `.settings-panel` appears in DOM
    - Test 2: press Escape → `.settings-panel` is no longer visible
  - [x] 5.2: Run `npm run test:e2e` — all existing tests (8) plus 2 new settings tests pass without regression

## Dev Notes

### Settings Persistence — Critical Gap in Existing `useSettingsStore`

`useSettingsStore` currently initializes `hardMode` and `deuteranopia` to `false` with no persistence wiring. `usePersistenceStore` already has `loadSettings()` and `saveSettings()` — they are unused. Wire them in `useSettingsStore`:

```ts
// Pattern: mirror how usePersistenceStore initializes streakData (IIFE on store init)
export const useSettingsStore = defineStore('settings', () => {
  const persistenceStore = usePersistenceStore()

  // Init from localStorage — same pattern as streakData in usePersistenceStore
  const saved = persistenceStore.loadSettings()
  const hardMode = ref(saved.hardMode)
  const deuteranopia = ref(saved.deuteranopia)

  function setHardMode(value: boolean): void {
    hardMode.value = value
    persistenceStore.saveSettings({ hardMode: value, deuteranopia: deuteranopia.value })
  }

  function setDeuteranopia(value: boolean): void {
    deuteranopia.value = value
    persistenceStore.saveSettings({ hardMode: hardMode.value, deuteranopia: value })
  }

  return { hardMode, deuteranopia, setHardMode, setDeuteranopia }
})
```

**Do NOT** add a separate `loadPersistedSettings()` action — init in the store definition itself (IIFE pattern already established in this codebase).

### SettingsPanel Component — Layout and Behavior

```
SettingsPanel positioning:
- Parent: .corner-reserved (position: fixed; top: 16px; right: 16px)
- Panel: position: absolute; top: calc(100% + 8px); right: 0; width: 220px
- Backdrop: position: fixed; inset: 0; z-index: 49 (below panel at z-index: 50)
- Panel: z-index: 51 (above backdrop and corner-reserved z-index: 50)
```

**Hard mode lock condition** — `isHardModeLocked`:
```ts
const gameStore = useGameStore()
const isHardModeLocked = computed(
  () => gameStore.activeRow > 0 || gameStore.isComplete
)
```

A puzzle is "in progress" once any guess has been submitted (`activeRow > 0`) OR is complete. Hard mode cannot be changed in either state.

**Escape key handling** — the panel handles its own Escape (not via `useKeyboard`):
```ts
// In SettingsPanel.vue — only listen when panel is open (parent passes v-model)
function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('update:modelValue', false)
}
onMounted(() => window.addEventListener('keydown', handleEscape))
onUnmounted(() => window.removeEventListener('keydown', handleEscape))
```

**Focus management:**
- On open: `nextTick(() => panelEl.value?.querySelector('button')?.focus())`
- On close: return focus to trigger button (parent passes a `triggerRef` or GameView handles it)

**CSS class for test selector:** Root element must have `class="settings-panel"` for e2e tests.

### `SettingsPanel.vue` Internal Structure (`<script setup>` ordering)

Per architecture conventions:
1. Imports
2. Props / emits
3. Store refs (`useSettingsStore`, `useGameStore`)
4. Local reactive state
5. Computed properties (`isHardModeLocked`)
6. Functions / event handlers (`handleEscape`, `handleHardModeToggle`)
7. Lifecycle hooks (`onMounted`, `onUnmounted`)

### `GameView.vue` Changes

The `.corner-reserved` div already exists with a comment "SettingsPanel wired in 2.5". Update it:

```vue
<!-- Before (existing) -->
<div class="corner-reserved"><StreakBadge /></div>

<!-- After -->
<div class="corner-reserved">
  <StreakBadge />
  <button
    class="settings-trigger"
    aria-label="Open settings"
    @click="settingsPanelOpen = !settingsPanelOpen"
  >⚙</button>
  <SettingsPanel v-model="settingsPanelOpen" />
</div>
```

Add to `<script setup>`:
```ts
import { ref } from 'vue'  // already imported? check — computed is there but not ref
import SettingsPanel from '@/components/ui/SettingsPanel.vue'
const settingsPanelOpen = ref(false)
```

`GameView.vue` already has `const settingsStore = useSettingsStore()` and passes `settingsStore.hardMode` to `store.submitGuess()` — no change needed for AC5.

### Hard Mode Toggle UI Pattern

Use `<button role="switch" :aria-checked="settingsStore.hardMode">` not `<input type="checkbox">`. This matches accessibility best practices for a toggle switch and avoids form semantics in a non-form context.

Disabled/locked state:
```vue
<button
  role="switch"
  :aria-checked="settingsStore.hardMode"
  :disabled="isHardModeLocked"
  :aria-disabled="isHardModeLocked"
  @click="!isHardModeLocked && settingsStore.setHardMode(!settingsStore.hardMode)"
>
```

When `isHardModeLocked`, render the note below the toggle row:
```vue
<p v-if="isHardModeLocked" class="settings-panel__note">
  Available after today's puzzle
</p>
```

Note: UX spec says this is a "quiet inline note" — `color: var(--color-text-secondary); font-size: 0.75rem`.

### Existing AC5 Wiring (No Code Change Needed)

`useGameEngine.isHardModeValid()` is already implemented (line 82 of `useGameEngine.ts`) and called in `useGameStore.submitGuess()` (lines 98–103). `GameView.vue` passes `settingsStore.hardMode` to `store.submitGuess()` (line 60). AC5 is verified by the existing implementation — no new code needed, but do verify it still works end-to-end after the settings persistence change.

### Unit Test Count

Previous story (4.5) established 242 Vitest unit tests. This story adds:
- `useSettingsStore` persistence tests (Task 1.4)
- `SettingsPanel.vue` component tests (Task 2.7)

Run `npm run test:unit` after implementation — all 242 + new tests must pass.

E2E tests: 8 existing (3 original + 5 from story 4.5). This story adds 2 settings e2e tests → 10 total. Run `npm run test:e2e`.

### Architecture Constraints

- `SettingsPanel.vue` lives in `src/components/ui/` — Layer 3 (feature component), same as `StreakBadge.vue`
- `SettingsPanel` reads from `useSettingsStore` and `useGameStore` — **does NOT touch game store directly for mutations**
- `useSettingsStore.setHardMode()` is the only mutation path for hard mode — no direct store assignment from component
- Settings saved only through `usePersistenceStore.saveSettings()` — no direct `localStorage` access in component or settings store
- `<script setup>` syntax — Options API is banned
- Use Pinia composition-style store — already the pattern in `useSettingsStore.ts`
- Panel positioning: `position: absolute` within the already-`position: fixed` `.corner-reserved` — panel inherits stacking context correctly

### E2E Test File

```ts
// e2e/settings.spec.ts
import { test, expect } from '@playwright/test'

test.describe('settings panel', () => {
  test('clicking the settings trigger opens the settings panel', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.click('.settings-trigger')
    await expect(page.locator('.settings-panel')).toBeVisible()
  })

  test('pressing Escape closes the settings panel', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.click('.settings-trigger')
    await expect(page.locator('.settings-panel')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('.settings-panel')).not.toBeVisible()
  })
})
```

**Note:** Do NOT add game interactions in these tests — that would conflict with `useKeyboard`'s keydown handler which also listens for keys. Settings tests should be minimal.

### File Structure

| File | Action |
|------|--------|
| `src/stores/useSettingsStore.ts` | MODIFY — wire persistence (load on init, save on change) |
| `src/components/ui/SettingsPanel.vue` | CREATE — new component |
| `src/views/GameView.vue` | MODIFY — add settings trigger + wire SettingsPanel |
| `e2e/settings.spec.ts` | CREATE — 2 basic e2e smoke tests |

**Do NOT modify:**
- `src/composables/useGameEngine.ts` — hard mode logic already complete
- `src/stores/useGameStore.ts` — hard mode submission wiring already complete
- `src/stores/usePersistenceStore.ts` — `loadSettings()` / `saveSettings()` already exist
- `e2e/gameplay.spec.ts` — existing tests, do not touch
- `e2e/audio.spec.ts` — do not touch
- `e2e/first-launch.spec.ts` — do not touch

### Previous Story Intelligence (from 4.5)

- Unit test count: **242 tests** in `src/` (Vitest)
- Playwright config: dev server on `localhost:5173`. Tests run via `npm run test:e2e`.
- Each Playwright test gets a fresh browser context → clean localStorage.
- JSON imports in Playwright tests require `with { type: 'json' }` in Node 24 ESM — do NOT use bare imports.
- `npm run test:e2e` requires dev server running (handled automatically by `playwright.config.ts` webServer block).
- Test isolation: each Playwright test starts with empty localStorage — no need to clear between tests.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#SettingsPanel — UX-DR12]
- [Source: src/stores/useSettingsStore.ts — hardMode, deuteranopia refs (no persistence yet)]
- [Source: src/stores/usePersistenceStore.ts — loadSettings(), saveSettings() already exist]
- [Source: src/composables/useGameEngine.ts:82 — isHardModeValid() already implemented]
- [Source: src/stores/useGameStore.ts:89 — submitGuess(hardMode) already wired]
- [Source: src/views/GameView.vue:60 — settingsStore.hardMode passed to submitGuess]
- [Source: src/views/GameView.vue:103 — .corner-reserved div with comment "SettingsPanel wired in 2.5"]
- [Source: src/components/ui/StreakBadge.vue — pattern for ui/ component structure]
- [Source: src/types/persistence.ts — SettingsData interface]
- [Source: architecture.md — SettingsPanel reads from useSettingsStore only; no direct store mutation from components]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

No blockers encountered. Straightforward implementation following story spec exactly.

### Completion Notes List

- Task 1: Rewrote `useSettingsStore` to use IIFE-pattern init from `persistenceStore.loadSettings()`. `setHardMode` and `setDeuteranopia` now call `saveSettings` after updating refs. 11 new unit tests added.
- Task 2: Created `SettingsPanel.vue` in `src/components/ui/`. Implements backdrop click-outside dismiss, window Escape keydown listener, `button[role="switch"]` toggle with `isHardModeLocked` computed from `gameStore.activeRow > 0 || gameStore.isComplete`, and "Available after today's puzzle" note when locked. Focus set to first button on open. 12 new component tests added.
- Task 3: Updated `GameView.vue` — added `ref` import, `SettingsPanel` import, `settingsPanelOpen` ref, settings trigger button (⚙), `<SettingsPanel v-if="settingsPanelOpen" v-model="settingsPanelOpen" />`, and `.settings-trigger` styles.
- Task 4: Settings persistence on load verified — store IIFE init calls `loadSettings()` at store creation time. No separate `onMounted` call needed in `GameView`.
- Task 5: Created `e2e/settings.spec.ts` with 2 smoke tests. All 10 e2e tests pass (8 existing + 2 new); 4 PWA offline tests skipped (consistent with prior runs). Full unit suite: 266 tests pass.
- AC5 verified: `settingsStore.hardMode` already passed to `store.submitGuess()` in `GameView.vue` line 60 — no change needed.

### File List

- `src/stores/useSettingsStore.ts` — MODIFIED: wired persistence (load on init via IIFE, save on setHardMode/setDeuteranopia)
- `src/stores/useSettingsStore.test.ts` — CREATED: 11 unit tests for store persistence
- `src/components/ui/SettingsPanel.vue` — CREATED: settings panel component
- `src/components/ui/SettingsPanel.test.ts` — CREATED: 12 component tests
- `src/views/GameView.vue` — MODIFIED: added settings trigger, SettingsPanel wiring, .settings-trigger styles
- `e2e/settings.spec.ts` — CREATED: 2 e2e smoke tests

## Change Log

- 2026-03-23: Story created — SettingsPanel and hard mode toggle; creates SettingsPanel.vue, wires settings persistence, adds settings trigger to GameView, adds 2 e2e smoke tests
- 2026-03-23: Story implemented — all 5 tasks complete; 266 unit tests pass (+23 new), 10 e2e tests pass (+2 new)
