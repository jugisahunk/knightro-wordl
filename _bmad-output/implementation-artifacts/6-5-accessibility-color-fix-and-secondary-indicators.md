# Story 6.5: Accessibility Color Fix and Secondary Indicators

Status: done

## Story

As a colorblind player,
I want tile and keyboard colors to be distinguishable through more than color alone,
So that I can play the game without relying on color perception to understand tile feedback.

## Acceptance Criteria

1. **Given** the deuteranopia palette toggle is enabled **When** tiles display correct-position and wrong-position states **Then** the colors provide sufficient contrast that a deuteranopic user can distinguish the two states without side-by-side comparison

2. **Given** the game board after a guess is submitted **When** tiles reveal their feedback state **Then** a secondary shape indicator (checkmark for correct, dot for present) is visible on each tile — not relying on color alone

3. **Given** the on-screen keyboard **When** keys update to reflect used/unused/correct/present/absent states **Then** lighter keys indicate available (unused) letters and darker keys indicate eliminated letters — matching the intuitive expectation that lighter = available

4. **Given** both normal and deuteranopia modes **When** only one color state (e.g. only yellow/present tiles) appears on screen with no contrasting state visible **Then** the secondary indicator makes the tile state unambiguous without needing a second color for comparison

## Tasks / Subtasks

- [x] Task 1: Add secondary shape indicators to `GameTile.vue` (AC: 2, 4)
  - [x] Add `position: relative` to `.game-tile` CSS rule (required for absolute positioning of indicator)
  - [x] Add indicator `<span>` element inside the tile template — conditionally rendered when `displayState === 'correct'` or `displayState === 'present'`
  - [x] Correct indicator: `✓` (checkmark unicode); Present indicator: `·` (middle dot, U+00B7) or a small filled circle
  - [x] Position indicator absolutely: bottom-right corner, small font (≈ 0.5rem), font-weight 700, color `#fff`, `aria-hidden="true"`
  - [x] Indicator only appears after reveal (tied to `displayState`, which updates at flip midpoint — correct timing)
  - [x] No indicator for `empty`, `filled`, or `absent` states
  - [x] Add `@media (prefers-reduced-motion: reduce)` note — indicator has no animation, no change needed

- [x] Task 2: Fix keyboard key color hierarchy in `KeyboardKey.vue` (AC: 3)
  - [x] Add `--color-key-unused` token to `src/style.css` `@theme` block: `#3a3a4a` (lighter than bg-surface; same luminance family as tile-absent)
  - [x] Change `.keyboard-key` default background from `var(--color-bg-surface)` to `var(--color-key-unused)` — unused (available) keys become lighter
  - [x] Change `.keyboard-key--absent` background from `var(--color-tile-absent)` to `var(--color-bg-surface)` — eliminated keys become darker
  - [x] Result: unused (#3a3a4a) > absent (#1a1a22) — lighter = available ✓
  - [x] Verify contrast of `--color-text-primary` (#f0f0f0) on both new backgrounds meets WCAG AA 4.5:1 (both pass comfortably)

- [x] Task 3: Write Vitest unit tests for GameTile indicator (AC: 2, 4)
  - [x] In `src/components/game/GameTile.test.ts` (existing file)
  - [x] Test: correct state renders indicator with `✓` content and `aria-hidden="true"`
  - [x] Test: present state renders indicator with `·` content and `aria-hidden="true"`
  - [x] Test: absent state renders no indicator
  - [x] Test: filled state renders no indicator
  - [x] Test: empty state renders no indicator

- [x] Task 4: Write Vitest unit tests for KeyboardKey color hierarchy (AC: 3)
  - [x] In `src/components/game/KeyboardKey.test.ts` (existing file)
  - [x] Test: default (unused) key has class structure that does NOT apply `keyboard-key--absent` (i.e., no absent class when state is 'default')
  - [x] Test: absent key has `keyboard-key--absent` class applied
  - [x] Note: CSS color values aren't testable via Vitest/JSDOM — assert class presence, not computed style

- [x] Task 5: Add E2E tests for secondary indicators and keyboard hierarchy (AC: 2, 3, 4)
  - [x] In `e2e/` — add to existing spec or create `e2e/accessibility.spec.ts`
  - [x] Seed a solved game and navigate to game view — verify correct tiles have `✓` indicator visible (use text content assertion)
  - [x] Verify present tiles have `·` indicator visible
  - [x] Verify absent tiles have no indicator text
  - [x] Verify keyboard: check that a key with state `absent` has darker CSS background than a key with state `default` (use `toHaveCSS('background-color', ...)` with known token values)
  - [x] All assertions via `data-testid` where applicable

## Dev Notes

### What Exists — Do Not Re-implement

- **Deuteranopia palette**: already fully implemented — `--color-tile-correct-d: #4a90d9` (blue) and `--color-tile-present-d: #e8a030` (orange) defined in `src/style.css`; `html.deuteranopia` CSS override already switches correct/present tile tokens; `App.vue` watches `settingsStore.deuteranopia` and toggles the class via `watchEffect`. AC1 is satisfied by the existing palette (blue vs orange is perceptually distinct for deuteranopia). No changes needed to the palette or its toggle mechanism.

- **Deuteranopia toggle UI**: `SettingsPanel.vue` already has the toggle wired to `settingsStore.setDeuteranopia`. No changes needed.

### Secondary Indicator Implementation — GameTile.vue

**Current template structure:**
```html
<div class="game-tile" :class="[`tile-state-${displayState}`, { 'tile-flipping': isFlipping }]" ...>
  <span v-if="letter" class="tile-letter">{{ letter.toUpperCase() }}</span>
</div>
```

**Required change — add indicator span:**
```html
<div class="game-tile" ...>
  <span v-if="letter" class="tile-letter">{{ letter.toUpperCase() }}</span>
  <span
    v-if="displayState === 'correct' || displayState === 'present'"
    class="tile-indicator"
    aria-hidden="true"
  >{{ displayState === 'correct' ? '✓' : '·' }}</span>
</div>
```

**Required CSS additions to GameTile.vue:**
```css
/* Add to .game-tile rule */
.game-tile {
  /* existing properties... */
  position: relative; /* ADD: needed for absolute indicator */
}

.tile-indicator {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 0.5rem;
  font-weight: 700;
  color: #fff;
  line-height: 1;
  pointer-events: none;
}
```

**Animation timing**: `displayState` updates at the flip midpoint (inside `setTimeout` at `TILE_FLIP_MS / 2`). The `v-if` on `displayState` will mount the indicator at the correct moment mid-flip — it appears as the tile background switches color, which is the correct UX.

**`prefers-reduced-motion`**: the indicator is a static element with no animation — no `@media` changes needed for it specifically.

**`aria-hidden="true"`**: the indicator is decorative. The tile already announces its state via `aria-label` (e.g. "R, correct") — do not double-announce.

**data-testid**: add `data-testid="tile-indicator"` to the indicator span for E2E testability.

### Keyboard Key Color Fix — KeyboardKey.vue + style.css

**Current keyboard CSS problem:**
```css
.keyboard-key { background-color: var(--color-bg-surface); }   /* #1a1a22 DARK (unused) */
.keyboard-key--absent { background-color: var(--color-tile-absent); } /* #3a3a45 LIGHTER (eliminated) */
```
Eliminated keys are lighter than unused keys — opposite of the intuitive expectation.

**Fix: introduce `--color-key-unused` token in `src/style.css` `@theme`:**
```css
--color-key-unused: #3a3a4a;   /* lighter medium gray — for available (unused) keyboard keys */
```

**Fix KeyboardKey.vue CSS:**
```css
.keyboard-key {
  background-color: var(--color-key-unused);    /* #3a3a4a — lighter = available */
}
.keyboard-key--absent {
  background-color: var(--color-bg-surface);    /* #1a1a22 — darker = eliminated */
}
```

Result: unused (#3a3a4a) visually lighter than absent (#1a1a22). ✓

**Contrast check** (WCAG AA, 4.5:1 minimum for normal text):
- `#f0f0f0` text on `#3a3a4a`: contrast ratio ≈ 9.2:1 ✓
- `#f0f0f0` text on `#1a1a22`: contrast ratio ≈ 15.5:1 ✓

**Correct and present keys** remain unchanged — they use `--color-tile-correct` and `--color-tile-present` which already have good contrast and proper visual weight.

### What Does NOT Change

- `src/App.vue` — deuteranopia watchEffect stays as-is
- `src/style.css` existing tokens — only adding `--color-key-unused`, no modifications
- `html.deuteranopia` CSS override block — stays as-is (it only overrides tile-correct/present tokens, which is correct)
- `SettingsPanel.vue` — no changes
- `useSettingsStore.ts` — no changes
- `usePersistenceStore.ts` — no changes
- `GameBoard.vue` / `Keyboard.vue` — no changes (changes are isolated to GameTile and KeyboardKey)
- `PastPuzzleSection.vue` mini-board — the mini-board uses simple `<span>` elements, NOT `GameTile.vue`. Indicators are NOT added to the mini-board tiles (the mini-board is read-only history, not live game feedback — adding indicators there is out of scope).

### Accessibility Notes

- Secondary indicators are `aria-hidden` — the tile's existing `aria-label` (e.g. "R, correct") is sufficient for screen readers
- Indicators are small decorative text — color contrast of `#fff` on colored tile background (correct green #5a9654 or present yellow #b59f3b) is comfortable
- In deuteranopia mode, indicators appear on blue (#4a90d9) and orange (#e8a030) backgrounds — both have sufficient contrast with white `#fff`
- Keyboard key color change does not affect keyboard `aria-label` (already announces state textually: `"${label}, ${state}"`)

### Test File Locations

- `src/components/game/GameTile.test.ts` — existing file, add indicator tests
- `src/components/game/KeyboardKey.test.ts` — existing file, add absent/default class tests
- E2E: `e2e/accessibility.spec.ts` (new) OR append to existing game spec

### Previous Story Intelligence (Stories 6.3 and 6.4)

- Use `data-testid` on all new testable elements (Epic 5 retro requirement) — add `data-testid="tile-indicator"` to the indicator span
- E2E tests seed data via `page.evaluate(() => localStorage.setItem(...))` pattern
- Component changes should be minimal and focused — do not refactor surrounding code
- `prefers-reduced-motion` already handled in `GameTile.vue` for the flip animation; indicator has no animation so no additional handling needed
- Review-phase fixes from previous stories: verify no regressions in tile flip animation timing

### Project Structure Notes

**Files to modify:**
- `src/style.css` — add `--color-key-unused` token to `@theme` block
- `src/components/game/GameTile.vue` — add indicator span + CSS (position: relative on .game-tile)
- `src/components/game/GameTile.test.ts` — add indicator unit tests
- `src/components/game/KeyboardKey.vue` — swap background colors for default and absent key states
- `src/components/game/KeyboardKey.test.ts` — add key hierarchy tests

**Files to create:**
- `e2e/accessibility.spec.ts` — E2E coverage for indicators and keyboard hierarchy

**Files unchanged:**
- `src/App.vue`, `src/stores/useSettingsStore.ts`, `src/stores/usePersistenceStore.ts`
- `src/components/ui/SettingsPanel.vue`
- `src/components/analytics/PastPuzzleSection.vue` (mini-board tiles excluded from scope)

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story 6.5`] — Acceptance criteria
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Color System`] — Deuteranopia palette hex values (#4a90d9, #e8a030)
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Accessibility Strategy`] — WCAG 2.1 Level AA target, contrast ratios
- [Source: `src/style.css`] — Design token definitions, html.deuteranopia override
- [Source: `src/components/game/GameTile.vue`] — Existing tile template, flip animation, displayState lifecycle
- [Source: `src/components/game/KeyboardKey.vue`] — Existing keyboard key CSS, state classes
- [Source: `src/App.vue:8-10`] — deuteranopia watchEffect (do not modify)
- [Source: `src/stores/useSettingsStore.ts`] — deuteranopia setting (do not modify)
- [Source: `_bmad-output/planning-artifacts/architecture.md#Implementation Patterns`] — CSS token naming convention (`--color-[category]-[variant]`), `<script setup>` syntax requirement

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Fixed regression in `GameTile.test.ts` and `GameBoard.test.ts`: existing tests used `tile.text()` which now includes the indicator character. Updated to `tile.find('.tile-letter').text()` to isolate the letter span.

### Completion Notes List

- Task 1: Added `tile-indicator` span (✓/·) to `GameTile.vue` with `position: relative` on `.game-tile` and `.tile-indicator` CSS for bottom-right absolute positioning. `data-testid="tile-indicator"` and `aria-hidden="true"` set. Indicator only shows for `correct` and `present` displayState.
- Task 2: Added `--color-key-unused: #3a3a4a` token to `src/style.css`. Updated `KeyboardKey.vue` default background to `var(--color-key-unused)` (lighter) and absent background to `var(--color-bg-surface)` (darker). Hierarchy: unused (#3a3a4a) > absent (#1a1a22).
- Task 3: Added 5 unit tests to `GameTile.test.ts` covering all indicator states (correct/present show indicator, absent/filled/empty do not).
- Task 4: Added 2 unit tests to `KeyboardKey.test.ts` asserting class presence for default vs absent key states.
- Task 5: Added 3 E2E test groups to `e2e/accessibility.spec.ts`: correct tile indicator, present/absent tile indicators, and keyboard color hierarchy (CSS background-color assertions).
- All 352 unit tests pass; all 47 E2E tests pass (4 skipped); no regressions.

### File List

- `src/components/game/GameTile.vue`
- `src/components/game/GameTile.test.ts`
- `src/components/game/KeyboardKey.vue`
- `src/components/game/KeyboardKey.test.ts`
- `src/components/game/GameBoard.test.ts`
- `src/style.css`
- `e2e/accessibility.spec.ts`

## Change Log

- 2026-03-26: Added secondary tile indicators (✓ for correct, · for present) to GameTile.vue with `data-testid="tile-indicator"` and `aria-hidden`; fixed keyboard color hierarchy in KeyboardKey.vue and style.css so unused keys are lighter than absent keys; added unit and E2E test coverage for all new behaviour.
