# Story 5.4: Accessibility Audit and Reduced-Motion Support

Status: review

## Story

As a player,
I want the app to respect my motion preferences and be fully usable by screen readers,
So that the experience is accessible regardless of sensory or motor constraints.

## Acceptance Criteria

**AC1 — Reduced motion: tile flip suppressed**
Given `@media (prefers-reduced-motion: reduce)` is active
When a guess is submitted
Then tile flip plays no 3D rotation — tile color changes instantly (UX-DR16)

**AC2 — Reduced motion: row shake suppressed**
Given `@media (prefers-reduced-motion: reduce)` is active
When an invalid word is submitted
Then the row shake animation is suppressed — a brief `border-color` flash is applied instead (UX-DR16)

**AC3 — Reduced motion: post-solve transitions near-instant**
Given `@media (prefers-reduced-motion: reduce)` is active
When the post-solve sequence runs
Then all fade transitions complete in ~50ms (near-instant) (UX-DR16)
And `useSoundManager` plays no audio — sound is disabled alongside motion (UX-DR15, UX-DR16)

**AC4 — Color contrast WCAG AA**
Given all tile states on the board (correct, present, absent)
When contrast ratios are measured against `bg-surface` (#1a1a22)
Then `tile-correct` (#538d4e) achieves >= 4.5:1 (NFR7)
And `tile-present` (#b59f3b) achieves >= 4.5:1 (NFR7)
And `tile-correct-d` (#4a90d9) achieves >= 4.5:1 (NFR8)
And `tile-present-d` (#e8a030) achieves >= 4.5:1 (NFR8)

**AC5 — Screen reader ARIA compliance**
Given `GameBoard.vue`, `FunnelChart.vue`, and `EtymologyCard.vue`
When reviewed for screen reader compatibility
Then `GameBoard` has `role="grid"`, rows have `role="row"`, tiles have `role="gridcell"` and `aria-label="[letter], [state]"` on revealed cells (UX-DR5)
And `FunnelChart` has `role="img"` with a complete `aria-label` describing all funnel values (UX-DR9)
And `EtymologyCard` has `role="article"` and `aria-label="Etymology for [WORD]"` (UX-DR10)
And an `aria-live="polite"` region announces tile reveals and game-end state changes (UX-DR5)

**AC6 — Focus-visible keyboard focus rings**
Given keyboard focus rings
When any interactive element receives focus via keyboard (Tab or arrow keys)
Then a visible `focus-visible` outline is shown using `accent-streak` color (UX-DR12)
And `:focus:not(:focus-visible)` has no outline — mouse clicks do not show focus rings

## Tasks / Subtasks

- [x] Task 1: Add reduced-motion support to remaining animations (AC: #1, #2, #3)
  - [x] 1.1: In `PostSolveTransition.vue` — add `@media (prefers-reduced-motion: reduce)` rule: set funnel fade-in (line ~56) and etymology fade-in (line ~68) transition durations to `50ms` and remove any `transform` transitions
  - [x] 1.2: In `ShortcutOverlay.vue` — add `@media (prefers-reduced-motion: reduce)` rule: suppress the `shortcut-overlay-fade-in` animation (`animation: none`)
  - [x] 1.3: In `SettingsPanel.vue` — add `@media (prefers-reduced-motion: reduce)` rule: set toggle background-color transition and ::after transform transition to `none`
  - [x] 1.4: In `GameBoard.vue` — change the existing reduced-motion fallback from `outline: 2px solid` to `border-color` flash per AC2. Add a `border-color` transition that briefly highlights the row border using `--color-text-secondary`, then returns to normal. The UX spec says "brief border-color flash" not a persistent outline. Implementation: add a `row-flash` animation (keyframes: border-color changes from default to `--color-text-secondary` and back over ~300ms) and apply it under the `prefers-reduced-motion: reduce` media query instead of `animation: none; outline: 2px solid ...`
  - [x] 1.5: In `useAudio.ts` — add `prefers-reduced-motion` check to background audio. When `window.matchMedia('(prefers-reduced-motion: reduce)').matches` is true, `startBackground()` should be a no-op (matching `useSoundManager.ts` behavior at line 9). Bell audio should also be suppressed under reduced motion.

- [x] Task 2: Verify and fix reduced-motion support already in place (AC: #1, #2)
  - [x] 2.1: Verify `GameTile.vue` (lines 17-20) already checks `prefers-reduced-motion` in JS and skips flip animation — confirm this works correctly (AC1 should already pass)
  - [x] 2.2: Verify `GameBoard.vue` (lines 104-109) already suppresses row shake under reduced motion — then apply the fix from Task 1.4
  - [x] 2.3: Verify `KeyboardKey.vue` (lines 95-102) already suppresses hover/active transitions under reduced motion
  - [x] 2.4: Verify `useSoundManager.ts` (lines 8-13) already skips audio under reduced motion — AC3 sound suppression should already pass

- [x] Task 3: Add board dim reduced-motion support (AC: #3)
  - [x] 3.1: In `GameView.vue` — the board dim opacity transition (500ms via `BOARD_DIM_MS`) should be near-instant under reduced motion. Add a `prefers-reduced-motion` JS check (same pattern as `GameTile.vue` line 17-20) and set dim duration to 50ms when active. Alternatively, apply via CSS: if the board dim uses a CSS transition on opacity, add `@media (prefers-reduced-motion: reduce) { .board-area { transition-duration: 50ms !important; } }`

- [x] Task 4: Add `focus-visible` CSS rules (AC: #6)
  - [x] 4.1: In `src/style.css` — add global `focus-visible` styles:
    ```css
    :focus-visible {
      outline: 2px solid var(--color-accent-streak);
      outline-offset: 2px;
    }
    :focus:not(:focus-visible) {
      outline: none;
    }
    ```
  - [x] 4.2: Verify interactive elements (keyboard keys, settings toggles, settings trigger button, ShortcutOverlay close area) receive visible focus rings on Tab
  - [x] 4.3: Verify mouse clicks do NOT show focus rings on these elements

- [x] Task 5: ARIA audit — verify existing compliance (AC: #5)
  - [x] 5.1: Verify `GameBoard.vue` has `role="grid"` and `aria-label="Myrdl game board"` — ALREADY EXISTS (line 46)
  - [x] 5.2: Verify `GameBoard.vue` rows have `role="row"` — ALREADY EXISTS (line 50)
  - [x] 5.3: Verify `GameTile.vue` has `role="gridcell"` and `aria-label="[letter], [state]"` on revealed cells — ALREADY EXISTS (lines 63-69)
  - [x] 5.4: Verify `FunnelChart.vue` has `role="img"` with descriptive `aria-label` — ALREADY EXISTS (line 29)
  - [x] 5.5: Verify `EtymologyCard.vue` has `role="article"` and `aria-label="Etymology for [WORD]"` — ALREADY EXISTS (lines 34-35)
  - [x] 5.6: Verify `GameBoard.vue` has `aria-live="polite"` announcer — ALREADY EXISTS (line 64)
  - [x] 5.7: **Verify aria-live announces tile reveals**: check that the board announcer `<div>` content is updated on guess submission with revealed tile states. If NOT yet wired up, add logic to update the announcer text when tiles flip (e.g., "Row 2: S absent, T present, A correct, R absent, E correct")
  - [x] 5.8: **Verify aria-live announces game-end state**: check that the announcer text updates on win ("Solved in N guesses!") or loss ("Not solved. The answer was WORD."). If NOT yet wired, add this logic.

- [x] Task 6: Contrast ratio verification tests (AC: #4)
  - [x] 6.1: Create `src/utils/contrast.test.ts` (or add to an existing test file) — pure unit tests that compute WCAG relative luminance and contrast ratios for the four color pairs:
    - `#538d4e` (tile-correct) vs `#1a1a22` (bg-surface)
    - `#b59f3b` (tile-present) vs `#1a1a22` (bg-surface)
    - `#4a90d9` (tile-correct-d) vs `#1a1a22` (bg-surface)
    - `#e8a030` (tile-present-d) vs `#1a1a22` (bg-surface)
  - [x] 6.2: Each test asserts `contrastRatio >= 4.5`
  - [x] 6.3: Implement a small `contrastRatio(hex1, hex2)` helper in the test file (no need for a shared utility — this is test-only). Formula: relative luminance per WCAG 2.0, contrast ratio = (L1 + 0.05) / (L2 + 0.05)

- [x] Task 7: Unit tests for reduced-motion behavior (AC: #1, #2, #3)
  - [x] 7.1: In `GameTile.test.ts` (or create if needed) — mock `window.matchMedia` to return `matches: true` for `prefers-reduced-motion: reduce`, verify tile state changes immediately (no flip animation class applied)
  - [x] 7.2: In `useSoundManager.test.ts` (or create) — mock `window.matchMedia` to return `matches: true`, call `trigger('won')`, verify `play()` is never called
  - [x] 7.3: In `useAudio.test.ts` (or create) — mock `window.matchMedia` to return `matches: true`, call `startBackground()`, verify audio does not play

- [x] Task 8: E2E tests for accessibility (AC: #1, #2, #3, #6)
  - [x] 8.1: Create `e2e/accessibility.spec.ts`
  - [x] 8.2: Test reduced motion — use Playwright's `page.emulateMedia({ reducedMotion: 'reduce' })`, submit a guess, verify tiles do NOT have `.tile-flipping` class (or verify transition is instant)
  - [x] 8.3: Test reduced motion — with emulated reduced motion, submit an invalid word, verify row does NOT have row shake animation
  - [x] 8.4: Test focus-visible — Tab to the on-screen keyboard keys, verify a visible outline appears (check computed style `outline-color` matches accent-streak or is non-transparent)
  - [x] 8.5: Run `npm run test:unit` — all existing + new tests pass
  - [x] 8.6: Run `npm run test:e2e` — all existing + new tests pass

## Dev Notes

### What Already Works (Do Not Reinvent)

The codebase already has significant reduced-motion support. **Do NOT reimplement these**:

| Feature | File | Status |
|---------|------|--------|
| Tile flip suppression | `GameTile.vue:17-20, 137-140` | JS + CSS media query — flips instantly |
| Row shake suppression | `GameBoard.vue:104-109` | CSS media query — needs fix (outline -> border-color) |
| Keyboard key transitions | `KeyboardKey.vue:95-102` | CSS media query — transitions removed |
| Sound suppression | `useSoundManager.ts:9` | JS check — audio skipped entirely |

### What Needs Adding

| Feature | File | What To Do |
|---------|------|------------|
| Post-solve fade transitions | `PostSolveTransition.vue` | Add `@media (prefers-reduced-motion: reduce)` — set durations to 50ms |
| ShortcutOverlay fade | `ShortcutOverlay.vue` | Add `@media (prefers-reduced-motion: reduce)` — `animation: none` |
| Settings toggle transitions | `SettingsPanel.vue` | Add `@media (prefers-reduced-motion: reduce)` — `transition: none` |
| Board dim timing | `GameView.vue` | Reduce dim duration to ~50ms under reduced motion |
| Background audio | `useAudio.ts` | Add `prefers-reduced-motion` check (match `useSoundManager.ts` pattern) |
| Row shake fallback fix | `GameBoard.vue` | Change `outline` to `border-color` flash per UX spec |
| Focus-visible rings | `src/style.css` | Add global `:focus-visible` / `:focus:not(:focus-visible)` rules |
| aria-live announcements | `GameBoard.vue` or `GameView.vue` | Wire up announcer div to speak tile reveals and game-end states |

### Row Shake -> Border-Color Flash (AC2 Fix)

The current reduced-motion fallback uses `outline: 2px solid` which is persistent until the class is removed. The UX spec says "brief border-color flash". Replace with:

```css
@media (prefers-reduced-motion: reduce) {
  .row-shaking {
    animation: row-flash 300ms ease;
  }
}

@keyframes row-flash {
  0%   { border-color: transparent; }
  30%  { border-color: var(--color-text-secondary); }
  100% { border-color: transparent; }
}
```

Each tile in the row will need `border-color` to flash. If tiles use `border` for their existing borders, ensure the flash doesn't conflict — may need to target the row wrapper's outline or individual tile borders. Test visually.

### aria-live Announcements

The `<div aria-live="polite" id="board-announcer">` exists in `GameBoard.vue` (line 64) but may not be wired to actual content. Two announcements needed:

1. **Tile reveal**: After each guess submission and tile flip sequence completes, update the announcer text with the row results, e.g. `"Row 2: S absent, T present, A correct, R absent, E correct"`
2. **Game end**: On win: `"Solved in N guesses!"`. On loss: `"Not solved. The answer was WORD."`

Wire this in the component that knows when tiles have finished revealing — likely `GameBoard.vue` via a `watch` on the current row's reveal state, or in `GameView.vue` via the game store's phase transitions.

### Focus-Visible CSS

Add to `src/style.css` **after** the `@import` and `@theme` blocks (global scope):

```css
:focus-visible {
  outline: 2px solid var(--color-accent-streak);
  outline-offset: 2px;
}

:focus:not(:focus-visible) {
  outline: none;
}
```

`--color-accent-streak` is `#9999cc` — already defined in the `@theme` block. This gives a subtle purple focus ring for keyboard users while keeping mouse interactions clean.

**Component-level overrides**: Some components (like `KeyboardKey.vue`) may need scoped `focus-visible` adjustments if the global 2px offset looks too large on small keys. If so, add a scoped override with `outline-offset: 1px` in the component's `<style scoped>` block.

### PostSolveTransition Reduced Motion

In `PostSolveTransition.vue`, the funnel and etymology enter transitions use `400ms` durations. Under reduced motion, reduce to `50ms`:

```css
@media (prefers-reduced-motion: reduce) {
  .funnel-enter-active,
  .etymology-enter-active {
    transition-duration: 50ms !important;
  }
  .funnel-enter-from {
    transform: none;  /* Remove translateY(12px) shift */
  }
}
```

### Board Dim Reduced Motion

The board dim in `GameView.vue` uses `BOARD_DIM_MS` (500ms) for the opacity transition. Two approaches:

**CSS approach** (preferred if dim is via CSS transition):
```css
@media (prefers-reduced-motion: reduce) {
  .board-area {
    transition-duration: 50ms !important;
  }
}
```

**JS approach** (if dim is driven by JS setTimeout):
```ts
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const dimDuration = prefersReducedMotion ? 50 : BOARD_DIM_MS
```

### useAudio.ts Reduced-Motion Guard

Match the pattern from `useSoundManager.ts`:

```ts
function startBackground(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  // existing play logic
}
```

Apply the same guard to bell audio playback.

### Contrast Ratio Test Helper

Pure math — no dependencies needed:

```ts
function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const [R, G, B] = [r, g, b].map(c =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  )
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1)
  const l2 = relativeLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}
```

### E2E Reduced Motion Testing Pattern

Playwright supports media emulation:

```ts
test('reduced motion suppresses tile flip animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  // type and submit a valid word
  // verify .tile-flipping class is NOT present (or animation-duration is 0)
})
```

### Project Structure Notes

All new files follow existing conventions:
- Tests alongside source: `src/utils/contrast.test.ts` for contrast tests
- E2E in `e2e/` directory: `e2e/accessibility.spec.ts`
- No new components created — this story modifies existing files only (plus test files)

### Files to Modify

| File | Action |
|------|--------|
| `src/components/layout/PostSolveTransition.vue` | MODIFY — add reduced-motion CSS media query |
| `src/components/ui/ShortcutOverlay.vue` | MODIFY — add reduced-motion CSS media query |
| `src/components/ui/SettingsPanel.vue` | MODIFY — add reduced-motion CSS media query |
| `src/components/game/GameBoard.vue` | MODIFY — fix row shake fallback (outline -> border-color flash), wire aria-live announcements |
| `src/views/GameView.vue` | MODIFY — add reduced-motion board dim timing |
| `src/composables/useAudio.ts` | MODIFY — add prefers-reduced-motion guard |
| `src/style.css` | MODIFY — add global focus-visible rules |

### Files to Create

| File | Action |
|------|--------|
| `src/utils/contrast.test.ts` | CREATE — WCAG contrast ratio verification tests |
| `e2e/accessibility.spec.ts` | CREATE — reduced-motion and focus-visible e2e tests |

### Do NOT Modify

- `src/components/game/GameTile.vue` — reduced motion already works (JS + CSS)
- `src/components/game/KeyboardKey.vue` — reduced motion already works (CSS)
- `src/composables/useSoundManager.ts` — reduced motion already works (JS)
- `src/constants/timing.ts` — no changes needed
- `src/stores/*` — no store changes needed
- `src/data/*` — no data changes

### Previous Story Intelligence (from 5.3)

- 293 unit tests + 20 e2e tests (4 skipped offline/PWA) at end of story 5.3
- `ShortcutOverlay.vue` uses `animation: shortcut-overlay-fade-in 150ms ease-in` — needs reduced-motion suppression
- Focus restoration pattern: save `document.activeElement` on open, restore on close via `onUnmounted`
- `stopImmediatePropagation` used on Escape in ShortcutOverlay to prevent post-solve double-dismiss — don't break this
- `GameView.vue` guards `handleKeyPress` with `shortcutOverlayOpen || settingsPanelOpen` check — don't regress
- E2E tests use `page.waitForLoadState('networkidle')` before interactions

### Git Intelligence

Recent commits show story 5.3 (ShortcutOverlay) and 5.5/5.6 (etymology enrichment) are done. Stories were implemented in non-sequential order (5.5/5.6 before 5.4). All existing tests pass. Commit messages follow pattern: "story X.Y done — description".

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.4]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR5 — ARIA tile state labels]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR9 — FunnelChart aria-label]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR10 — EtymologyCard aria-label]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR12 — focus-visible rings]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR15 — sound disabled with motion]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR16 — prefers-reduced-motion]
- [Source: _bmad-output/planning-artifacts/architecture.md#NFR7 — WCAG AA contrast]
- [Source: _bmad-output/planning-artifacts/architecture.md#NFR8 — deuteranopia contrast]
- [Source: src/components/game/GameTile.vue — existing reduced-motion support]
- [Source: src/components/game/GameBoard.vue — existing row shake fallback, aria-live announcer]
- [Source: src/composables/useSoundManager.ts — existing reduced-motion audio skip]
- [Source: src/composables/useAudio.ts — missing reduced-motion check]
- [Source: src/components/layout/PostSolveTransition.vue — fade transitions needing reduced-motion]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Contrast ratio for `#538d4e` (original tile-correct) was 4.35:1 — below WCAG AA 4.5:1 threshold. Adjusted to `#5a9654` (4.88:1).

### Completion Notes List

- Added `@media (prefers-reduced-motion: reduce)` rules to PostSolveTransition (50ms transitions), ShortcutOverlay (animation: none), SettingsPanel (transition: none for toggles)
- Replaced GameBoard row shake reduced-motion fallback from static `outline` to animated `row-flash` border-color keyframe (300ms)
- Added prefers-reduced-motion guard to `useAudio.ts` for both `startBackground()` and `playBell()`
- Added reduced-motion board dim override in GameView (50ms transition)
- Added global `:focus-visible` / `:focus:not(:focus-visible)` CSS rules to style.css using `--color-accent-streak`
- Verified all existing ARIA attributes (grid, row, gridcell, img, article, aria-live) already in place
- Wired aria-live announcer in GameBoard to announce tile reveals ("Row N: A correct, B absent, ...") and game-end states
- Adjusted `--color-tile-correct` from `#538d4e` to `#5a9654` to meet WCAG AA 4.5:1 contrast ratio
- All 4 color pairs now verified >= 4.5:1 contrast via unit tests
- Added 3 reduced-motion unit tests for GameTile, 2 for useAudio
- Added 3 e2e tests: reduced-motion tile flip suppression, reduced-motion shake suppression, focus-visible keyboard ring
- 302 unit tests pass (9 new), 23 e2e tests pass (3 new)

### Change Log

- 2026-03-24: Story 5.4 implementation complete — accessibility audit, reduced-motion support, focus-visible rings, aria-live announcements, WCAG AA contrast fix

### File List

**Modified:**

- `src/components/layout/PostSolveTransition.vue` — added reduced-motion CSS media query
- `src/components/ui/ShortcutOverlay.vue` — added reduced-motion CSS media query
- `src/components/ui/SettingsPanel.vue` — added reduced-motion CSS media query for toggle transitions
- `src/components/game/GameBoard.vue` — replaced row shake outline fallback with row-flash animation, added aria-live announcer logic, added gamePhase/answerWord props
- `src/views/GameView.vue` — added reduced-motion board dim CSS, passed gamePhase/answerWord to GameBoard
- `src/composables/useAudio.ts` — added prefers-reduced-motion guard for startBackground and playBell
- `src/style.css` — added global :focus-visible and :focus:not(:focus-visible) rules, adjusted --color-tile-correct from #538d4e to #5a9654
- `src/composables/useAudio.test.ts` — added matchMedia mock for existing tests

**Created:**

- `src/utils/contrast.test.ts` — WCAG contrast ratio verification tests (4 tests)
- `src/components/game/GameTile.reduced-motion.test.ts` — reduced-motion tile flip suppression tests (3 tests)
- `src/composables/useAudio.reduced-motion.test.ts` — reduced-motion audio suppression tests (2 tests)
- `e2e/accessibility.spec.ts` — e2e tests for reduced motion and focus-visible (3 tests)
