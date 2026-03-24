# Story 5.2: Deuteranopia Palette Toggle

Status: done

## Story

As a player,
I want to switch to a blue/orange tile color scheme that works with my color vision,
So that tile state feedback is always unambiguous regardless of how I perceive red-green hues.

## Acceptance Criteria

**AC1 — CSS tokens already defined (verify only)**
Given `src/style.css` `@theme` block
When reviewed
Then `--color-tile-correct-d` (#4a90d9) and `--color-tile-present-d` (#e8a030) tokens are present — they were added during Story 5.5 (UX-DR2)
**Status: ALREADY DONE — do not re-add these tokens**

**AC2 — Deuteranopia toggle in SettingsPanel**
Given `SettingsPanel.vue` with a colour scheme toggle
When the player switches to Deuteranopia
Then all correct-position tiles and keyboard keys immediately switch to `tile-correct-d` (blue) (FR27)
And all present-but-wrong-position tiles and keyboard keys immediately switch to `tile-present-d` (orange) (FR27)
And no page reload occurs — the change is live (UX-DR2)

**AC3 — Persistence survives reload**
Given the deuteranopia setting is enabled
When the page is reloaded
Then the deuteranopia palette is still active — the preference persisted in `myrdle_settings` (FR24)

**AC4 — Revert to standard palette**
Given the player switches back to the Standard palette
When the toggle is set to Standard
Then all tile and keyboard key colors revert to the default palette immediately

## Tasks / Subtasks

- [x] Task 1: Add CSS override rule for deuteranopia mode
  - [x] 1.1: In `src/style.css`, after the `@theme` block, add:
    ```css
    html.deuteranopia {
      --color-tile-correct: var(--color-tile-correct-d);
      --color-tile-present: var(--color-tile-present-d);
    }
    ```
  - [x] 1.2: Verify `GameTile.vue` and `KeyboardKey.vue` need NO changes — they already use `--color-tile-correct` and `--color-tile-present`, so the CSS class override is sufficient

- [x] Task 2: Wire the class toggle in `App.vue`
  - [x] 2.1: Import `watchEffect` from `vue`, import `useSettingsStore` from `@/stores/useSettingsStore`
  - [x] 2.2: Add a `watchEffect` that syncs `document.documentElement.classList`:
    ```ts
    watchEffect(() => {
      document.documentElement.classList.toggle('deuteranopia', settingsStore.deuteranopia)
    })
    ```
  - [x] 2.3: Vitest unit test: `App.vue` mounts, `settingsStore.deuteranopia = true` → `html.deuteranopia` class is present; set to `false` → class removed

- [x] Task 3: Add deuteranopia toggle to `SettingsPanel.vue`
  - [x] 3.1: Add a second row beneath the hard mode row:
    ```vue
    <div class="settings-panel__row">
      <span class="settings-panel__label">Color vision</span>
      <button
        role="switch"
        class="settings-panel__toggle"
        :class="{ 'settings-panel__toggle--on': settingsStore.deuteranopia }"
        :aria-checked="settingsStore.deuteranopia"
        aria-label="Deuteranopia colour scheme"
        @click="settingsStore.setDeuteranopia(!settingsStore.deuteranopia)"
      />
    </div>
    ```
  - [x] 3.2: No lock condition — deuteranopia can be toggled at any time (unlike hard mode)
  - [x] 3.3: Vitest component tests (add to `SettingsPanel.test.ts`):
    - Deuteranopia toggle renders with `role="switch"`
    - Clicking deuteranopia toggle calls `setDeuteranopia` with toggled value
    - Clicking deuteranopia toggle persists to localStorage (`saved.deuteranopia === true`)
    - `aria-checked` reflects store state

- [x] Task 4: E2E smoke test
  - [x] 4.1: Add to `e2e/settings.spec.ts`:
    - Test: open settings panel → click deuteranopia toggle → `html` element has class `deuteranopia`
    - Test: click deuteranopia toggle again → `html` element does NOT have class `deuteranopia`
  - [x] 4.2: Run `npm run test:e2e` — all existing tests (10) plus 2 new pass without regression

## Dev Notes

### Key Architecture Insight: CSS Class Override (No Component Changes Needed)

The cleanest live-switch mechanism for this project uses a CSS class on `document.documentElement`. This avoids touching `GameTile.vue` and `KeyboardKey.vue`:

```
src/style.css @theme defines:
  --color-tile-correct: #538d4e      ← standard green
  --color-tile-present: #b59f3b      ← standard amber
  --color-tile-correct-d: #4a90d9    ← deuteranopia blue (already present)
  --color-tile-present-d: #e8a030    ← deuteranopia orange (already present)

New rule (outside @theme):
  html.deuteranopia {
    --color-tile-correct: var(--color-tile-correct-d);   ← overrides to blue
    --color-tile-present: var(--color-tile-present-d);   ← overrides to orange
  }

GameTile.vue .tile-state-correct uses --color-tile-correct   ← auto picks up override
KeyboardKey.vue .keyboard-key--correct uses --color-tile-correct  ← auto picks up override
```

**Result:** Zero changes to `GameTile.vue` or `KeyboardKey.vue`. The override propagates automatically via CSS cascade.

### App.vue — Minimal Change

`App.vue` is currently only 5 lines. Add the watchEffect for the class toggle:

```vue
<script setup lang="ts">
import { watchEffect } from 'vue'
import { RouterView } from 'vue-router'
import { useSettingsStore } from '@/stores/useSettingsStore'

const settingsStore = useSettingsStore()

watchEffect(() => {
  document.documentElement.classList.toggle('deuteranopia', settingsStore.deuteranopia)
})
</script>

<template>
  <RouterView />
</template>
```

**Why App.vue and not GameView.vue?** The deuteranopia class must survive route transitions and applies globally. `App.vue` is the single root that is always mounted — it is the correct home for global DOM side effects.

**Why watchEffect?** It runs immediately on mount (applying any persisted preference before first render) and re-runs whenever `settingsStore.deuteranopia` changes. No `onMounted` + `watch` split needed.

### SettingsPanel.vue — Toggle Pattern

The deuteranopia toggle uses the exact same `button[role="switch"]` pattern as hard mode but without any lock condition:

```vue
<div class="settings-panel__row">
  <span class="settings-panel__label">Color vision</span>
  <button
    role="switch"
    class="settings-panel__toggle"
    :class="{ 'settings-panel__toggle--on': settingsStore.deuteranopia }"
    :aria-checked="settingsStore.deuteranopia"
    aria-label="Deuteranopia colour scheme"
    @click="settingsStore.setDeuteranopia(!settingsStore.deuteranopia)"
  />
</div>
```

**No locking logic** — unlike hard mode, the colour scheme can be changed at any time.

**aria-label is required** — there will now be two `button[role="switch"]` elements. Tests and screen readers must distinguish them. Use `aria-label="Deuteranopia colour scheme"` on the deuteranopia toggle and add `aria-label="Hard mode"` to the existing hard mode toggle to avoid ambiguity.

**IMPORTANT — update existing test selectors:** `SettingsPanel.test.ts` currently selects `button[role="switch"]` without qualification. With two toggles, use `button[aria-label="Hard mode"]` for hard mode tests and `button[aria-label="Deuteranopia colour scheme"]` for deuteranopia tests. Update existing tests when adding the new ones.

### Persistence — Already Complete

`useSettingsStore` already has full persistence for `deuteranopia`:
- Initialized from `persistenceStore.loadSettings()` on store creation (IIFE pattern)
- `setDeuteranopia(value)` calls `persistenceStore.saveSettings({ hardMode: hardMode.value, deuteranopia: value })`

The `watchEffect` in `App.vue` reads `settingsStore.deuteranopia`, which is initialized from localStorage. This means persisted deuteranopia preference is applied **before first paint** — no flash of wrong colors on reload.

**Do NOT add any additional persistence wiring** — it is complete.

### Files to Modify vs. Create

| File | Action |
|------|--------|
| `src/style.css` | MODIFY — add `html.deuteranopia` override rule after `@theme` block |
| `src/App.vue` | MODIFY — add watchEffect for class toggle |
| `src/components/ui/SettingsPanel.vue` | MODIFY — add deuteranopia toggle row; add aria-labels to both toggles |
| `src/components/ui/SettingsPanel.test.ts` | MODIFY — update selectors + add deuteranopia toggle tests |
| `e2e/settings.spec.ts` | MODIFY — add 2 deuteranopia e2e smoke tests |

**Do NOT modify:**
- `src/components/game/GameTile.vue` — CSS override handles colors, no component change needed
- `src/components/game/KeyboardKey.vue` — same, no change needed
- `src/stores/useSettingsStore.ts` — already has full deuteranopia persistence
- `src/types/persistence.ts` — `SettingsData.deuteranopia: boolean` already defined
- Any other game component

### E2E Test Pattern

```ts
// Add to e2e/settings.spec.ts
test('enabling deuteranopia adds deuteranopia class to html', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.click('.settings-trigger')
  await expect(page.locator('.settings-panel')).toBeVisible()
  // Click the deuteranopia toggle (second switch button)
  await page.locator('button[aria-label="Deuteranopia colour scheme"]').click()
  const htmlClass = await page.locator('html').getAttribute('class')
  expect(htmlClass).toContain('deuteranopia')
})

test('disabling deuteranopia removes deuteranopia class from html', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.click('.settings-trigger')
  await page.locator('button[aria-label="Deuteranopia colour scheme"]').click()
  // Now disable it
  await page.locator('button[aria-label="Deuteranopia colour scheme"]').click()
  const htmlClass = await page.locator('html').getAttribute('class')
  expect(htmlClass ?? '').not.toContain('deuteranopia')
})
```

### Unit Test Count

Story 5.1 shipped with 266 unit tests. This story adds:
- ~4 new tests in `SettingsPanel.test.ts` (deuteranopia toggle render, click, persistence, aria)
- ~2 new tests for `App.vue` watchEffect (class applied/removed on store change)

Run `npm run test:unit` — all 266 + new tests must pass.
Run `npm run test:e2e` — all 10 existing + 2 new = 12 total must pass.

### Contrast Ratio Reference (for AC1 verification)

The CSS tokens are already proven compliant per the epics spec:
- `#4a90d9` on `#1a1a22`: approximately 5.2:1 ✓ (≥ 4.5:1 — NFR8)
- `#e8a030` on `#1a1a22`: approximately 5.8:1 ✓ (≥ 4.5:1 — NFR8)

No additional verification step needed — tokens were specified knowing these ratios.

### Previous Story Intelligence (from 5.1)

- `SettingsPanel.vue` uses `<script setup>` composition style, `defineProps`, `defineEmits`
- Focus trap in `SettingsPanel` uses `querySelectorAll('button:not([disabled])')` — this will now include the deuteranopia toggle (which is never disabled), so focus trap will naturally encompass both toggles
- `useSettingsStore` uses IIFE init pattern — do NOT add `onMounted` lifecycle hooks for store reads
- Settings e2e tests use `page.waitForLoadState('networkidle')` before interactions
- Do NOT add game keyboard interactions in settings e2e tests (conflicts with `useKeyboard` handler)
- Each Playwright test starts with clean localStorage — no setup needed for "disabled by default" tests

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2]
- [Source: src/style.css — @theme block already defines -d tokens]
- [Source: src/stores/useSettingsStore.ts — setDeuteranopia() already implemented]
- [Source: src/types/persistence.ts — SettingsData.deuteranopia: boolean]
- [Source: src/components/ui/SettingsPanel.vue — existing hard mode toggle pattern]
- [Source: src/components/ui/SettingsPanel.test.ts — existing test structure/patterns]
- [Source: src/components/game/GameTile.vue — uses --color-tile-correct, --color-tile-present]
- [Source: src/components/game/KeyboardKey.vue — uses --color-tile-correct, --color-tile-present]
- [Source: src/App.vue — currently 5-line root component, correct home for global DOM side effects]
- [Source: e2e/settings.spec.ts — existing settings e2e tests (10 total after 5.1)]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

No issues encountered. Implementation was straightforward — all persistence and store wiring was already in place from Story 5.5.

### Completion Notes List

- AC1: CSS tokens `--color-tile-correct-d` and `--color-tile-present-d` confirmed present in `@theme` block; `html.deuteranopia` override rule added after `@theme` block in `src/style.css`
- AC2: Deuteranopia toggle added to `SettingsPanel.vue` as second row with `role="switch"`, `aria-label="Deuteranopia colour scheme"`. Hard mode toggle updated with `aria-label="Hard mode"`. `App.vue` `watchEffect` applies/removes `html.deuteranopia` class live with no page reload.
- AC3: Persistence already wired in `useSettingsStore.setDeuteranopia()` → `saveSettings()`. `watchEffect` runs on mount reading persisted value → applied before first paint.
- AC4: Clicking toggle again calls `setDeuteranopia(false)` → `watchEffect` removes class → colors revert immediately.
- Unit tests: 283 passing (266 baseline + 6 new: 4 in SettingsPanel.test.ts, 2 in App.test.ts)
- E2E tests: 14 passing + 4 skipped (offline/PWA). 2 new deuteranopia tests pass.
- Existing SettingsPanel tests updated to use `button[aria-label="Hard mode"]` selector (was unqualified `button[role="switch"]`).

### File List

- `src/style.css` — modified: added `html.deuteranopia` CSS override rule
- `src/App.vue` — modified: added `watchEffect` for deuteranopia class toggle
- `src/components/ui/SettingsPanel.vue` — modified: added deuteranopia toggle row, added `aria-label="Hard mode"` to hard mode toggle
- `src/components/ui/SettingsPanel.test.ts` — modified: updated hard mode test selectors to use `aria-label`, added 4 deuteranopia toggle tests
- `src/App.test.ts` — created: 2 unit tests for App.vue watchEffect
- `e2e/settings.spec.ts` — modified: added 2 deuteranopia E2E smoke tests

## Change Log

- 2026-03-24: Story created — Deuteranopia palette toggle; adds CSS class override mechanism, App.vue watchEffect, deuteranopia toggle to SettingsPanel
- 2026-03-24: Story implemented — CSS override, App.vue watchEffect, SettingsPanel toggle, tests all complete; 283 unit tests + 14 e2e tests pass
