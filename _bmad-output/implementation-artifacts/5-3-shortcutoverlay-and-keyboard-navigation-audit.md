# Story 5.3: ShortcutOverlay and Keyboard Navigation Audit

Status: done

## Story

As a player,
I want to discover all keyboard shortcuts via `?` and complete my entire daily ritual without touching a mouse,
So that the app rewards keyboard fluency and never requires pointer input.

## Acceptance Criteria

**AC1 — ShortcutOverlay appears on `?` press**
Given the player presses `?` at any point during gameplay or post-solve
When the ShortcutOverlay renders
Then a full-screen dark overlay (~0.85 opacity) appears with a centered content block (max-width 360px) listing all shortcuts (UX-DR13)

**AC2 — ShortcutOverlay content completeness**
Given `ShortcutOverlay.vue` content
When reviewed
Then it lists: A-Z (type letter), Enter (submit guess / advance post-solve), Backspace (delete last letter), Space (advance post-solve), Escape (return to board), ? (show/hide overlay) (UX-DR13)

**AC3 — ShortcutOverlay dismiss behavior**
Given `ShortcutOverlay.vue` is visible
When the player presses `?`, Escape, or clicks outside
Then the overlay closes (UX-DR13)
And `ShortcutOverlay` is never shown automatically — always user-initiated (UX-DR13)

**AC4 — Full keyboard-only daily ritual**
Given a complete daily ritual (load -> type guesses -> submit -> post-solve -> etymology -> dismiss)
When performed using only the physical keyboard
Then every step completes without requiring a mouse click (NFR6, UX-DR17)
And keyboard focus is never lost or trapped in an unescapable state

**AC5 — Focus trap in overlays**
Given `SettingsPanel.vue` and `ShortcutOverlay.vue`
When open and navigated by keyboard
Then focus is trapped within each overlay while open
And focus returns to the board or its previous location on dismiss (UX-DR12, UX-DR13)

## Tasks / Subtasks

- [x] Task 1: Create `ShortcutOverlay.vue` component (AC: #1, #2, #3, #5)
  - [x] 1.1: Create `src/components/ui/ShortcutOverlay.vue` with `<script setup>` — props: `modelValue: boolean`, emits: `update:modelValue` (same v-model pattern as `SettingsPanel.vue`)
  - [x] 1.2: Render full-screen dark backdrop (`position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 100`) with centered content block (max-width 360px)
  - [x] 1.3: Render shortcut table listing all 6 shortcuts (see Dev Notes for exact content)
  - [x] 1.4: Add `role="dialog"`, `aria-modal="true"`, `aria-label="Keyboard shortcuts"` to overlay container
  - [x] 1.5: Add dismiss on `Escape` key — call close function
  - [x] 1.6: `?` key dismiss handled entirely by parent toggle in GameView (overlay does not handle `?` — avoids double-fire between two window keydown listeners)
  - [x] 1.7: Add dismiss on click outside content block (click on backdrop)
  - [x] 1.8: Add focus trap: Tab/Shift+Tab wrap within overlay (reuse SettingsPanel pattern from lines 39-57)
  - [x] 1.9: Focus first focusable element (or overlay container with `tabindex="-1"`) on mount via `nextTick`
  - [x] 1.10: Return focus to board on close — pass no `triggerEl` prop since `?` has no visual trigger; focus `document.querySelector('.board-area')` or `document.activeElement` saved on open
  - [x] 1.11: Clean up all event listeners on `onUnmounted`

- [x] Task 2: Wire `?` key handling in `GameView.vue` (AC: #1, #3)
  - [x] 2.1: Add `shortcutOverlayOpen` ref (`ref(false)`) to `GameView.vue`
  - [x] 2.2: Add a `window.addEventListener('keydown', ...)` listener (or extend existing keyboard handling) that toggles `shortcutOverlayOpen` when `?` is pressed (key is `?`, NOT Shift+/ — check `event.key === '?'`)
  - [x] 2.3: When overlay is open, suppress game keyboard input — guard `handleKeyPress` with `if (shortcutOverlayOpen.value) return` at top of function
  - [x] 2.4: Render `<ShortcutOverlay v-if="shortcutOverlayOpen" v-model="shortcutOverlayOpen" />` in template
  - [x] 2.5: Ensure `?` key listener fires even when `SettingsPanel` is open — if settings is open, close it and open overlay (or just ignore `?` while settings is open — simpler approach)

- [x] Task 3: Keyboard navigation audit fixes (AC: #4)
  - [x] 3.1: Verify full keyboard-only ritual flow works: type letters -> Enter to submit -> post-solve starts automatically -> Space/Enter advances funnel -> Space/Enter advances to etymology -> Escape dismisses -> board visible. This flow already works via `useKeyboard.ts` + `usePostSolveTransition.ts`
  - [x] 3.2: Verify `useKeyboard.ts` does NOT intercept keys when `ShortcutOverlay` or `SettingsPanel` is open (the guard from Task 2.3 handles this for ShortcutOverlay; SettingsPanel's own keydown handler already prevents propagation via its focus trap)
  - [x] 3.3: Verify focus is never lost after closing overlays — test that after dismissing ShortcutOverlay or SettingsPanel, keyboard input still works for gameplay
  - [x] 3.4: Verify Escape from post-solve etymology phase returns to a state where keyboard input works for next session

- [x] Task 4: Unit tests for `ShortcutOverlay.vue` (AC: #1, #2, #3, #5)
  - [x] 4.1: Create `src/components/ui/ShortcutOverlay.test.ts`
  - [x] 4.2: Test: overlay renders with all 6 shortcut entries
  - [x] 4.3: Test: overlay has `role="dialog"` and `aria-modal="true"` and `aria-label="Keyboard shortcuts"`
  - [x] 4.4: Test: pressing Escape emits `update:modelValue` with `false`
  - [x] 4.5: Test: pressing `?` does not emit from overlay (parent handles toggle via GameView)
  - [x] 4.6: Test: clicking backdrop (outside content block) emits `update:modelValue` with `false`
  - [x] 4.7: Test: clicking inside content block does NOT close overlay

- [x] Task 5: E2E tests (AC: #1, #3, #4)
  - [x] 5.1: Create `e2e/shortcuts.spec.ts`
  - [x] 5.2: Test: pressing `?` opens ShortcutOverlay, pressing `?` again closes it
  - [x] 5.3: Test: pressing Escape closes ShortcutOverlay
  - [x] 5.4: Test: keyboard-only gameplay still works after opening and closing ShortcutOverlay (type a letter after dismiss, verify tile fills)
  - [x] 5.5: Run `npm run test:unit` — all 284 + new tests pass
  - [x] 5.6: Run `npm run test:e2e` — all existing + new tests pass

## Dev Notes

### ShortcutOverlay Content — Exact Shortcut Table

Render a simple two-column layout (key | action) with these entries:

| Key | Action |
|-----|--------|
| A - Z | Type letter |
| Enter | Submit guess / advance post-solve |
| Backspace | Delete last letter |
| Space | Advance post-solve |
| Escape | Return to board |
| ? | Show / hide shortcuts |

Use Inter font at 13-14px for content, 10-11px uppercase for section labels. Match the dark theme using existing design tokens (`--color-bg-surface`, `--color-text-primary`, `--color-text-secondary`).

### Component Pattern — Follow SettingsPanel.vue Exactly

`ShortcutOverlay.vue` must use the same v-model + focus management pattern as `SettingsPanel.vue` (lines 1-84 of that file):

```
Props:  modelValue: boolean
Emits:  update:modelValue
```

**Key differences from SettingsPanel:**
- **Full-screen backdrop** instead of inline anchored panel (ShortcutOverlay is a centered modal, not a corner panel)
- **No trigger element** — `?` is pressed from anywhere, so save `document.activeElement` on mount and restore it on close
- **z-index: 100** (above SettingsPanel's z-index: 51) so it layers correctly if both could theoretically be open

### `?` Key Detection

`event.key === '?'` — this fires when the user presses Shift+/ on US keyboards or the `?` key directly on other layouts. Do NOT check for `event.shiftKey && event.key === '/'` — just check `event.key === '?'`.

The `?` key listener should be a **separate** `window.addEventListener('keydown', ...)` in `GameView.vue` (do NOT modify `useKeyboard.ts` composable for this — the composable handles game input only, and `?` is a UI shortcut).

### Suppressing Game Input While Overlay Is Open

Add a guard at the top of `handleKeyPress` in `GameView.vue`:

```ts
function handleKeyPress(key: string): void {
  if (shortcutOverlayOpen.value) return
  audio.startBackground()
  // ... existing logic
}
```

This prevents letter typing/Enter/Backspace from reaching the game engine while the overlay is visible. The overlay's own keydown handler captures Escape and `?` for dismiss.

**Also guard for SettingsPanel:** The existing `handleKeyPress` should also check `settingsPanelOpen.value` — currently, typing letters while the settings panel is open still feeds them to the game engine. Add both guards:

```ts
function handleKeyPress(key: string): void {
  if (shortcutOverlayOpen.value || settingsPanelOpen.value) return
  audio.startBackground()
  // ... existing logic
}
```

### CSS Architecture — Scoped Styles with BEM

Follow the project's CSS conventions:
- `<style scoped>` block
- BEM naming: `.shortcut-overlay`, `.shortcut-overlay__backdrop`, `.shortcut-overlay__content`, `.shortcut-overlay__row`, `.shortcut-overlay__key`, `.shortcut-overlay__action`
- Use CSS custom properties from `src/style.css` `@theme` block — do NOT hardcode colors
- Animation: ~150ms ease-in `opacity` transition on mount (per UX spec)

### CSS Token Reference

From `src/style.css` `@theme` block:
- `--color-bg-base`: `#111118` (app background)
- `--color-bg-surface`: `#1a1a22` (elevated surfaces — use for content block background)
- `--color-text-primary`: `#f0f0f0`
- `--color-text-secondary`: `#a0a0aa`
- `--color-border`: not in @theme — use `#3a3a45` (tile-border-empty) or similar

### Overlay Interaction with PostSolve

The ShortcutOverlay can be opened during post-solve (the AC says "at any point during gameplay or post-solve"). When open:
- `usePostSolveTransition.ts` keyboard handler still listens for Escape/Space/Enter
- The ShortcutOverlay's own Escape handler fires first (it closes the overlay)
- After overlay closes, Escape would then be caught by post-solve transition to dismiss it — this is correct sequential behavior
- **No modification to `usePostSolveTransition.ts` needed** — the overlay intercepts keys when open, and post-solve handles them when the overlay is closed

**Potential conflict:** If the user presses Escape while both ShortcutOverlay is open AND post-solve is active, the overlay closes but post-solve also sees the Escape. To prevent this, add `event.stopPropagation()` in ShortcutOverlay's Escape handler. Actually, both use `window.addEventListener` so stopPropagation won't help. Instead, coordinate via the `shortcutOverlayOpen` ref: add a guard in `usePostSolveTransition`'s `handleKeydown` that checks if an overlay is open. **Simpler approach:** since `ShortcutOverlay.vue`'s keydown handler runs and calls `close()` → v-model updates → component unmounts → listener removed, the single Escape press will only be handled by the overlay (the overlay's listener fires, calls close, component unmounts removing the listener — all synchronous). **Test this behavior in e2e.**

### Files to Create

| File | Action |
|------|--------|
| `src/components/ui/ShortcutOverlay.vue` | CREATE — full-screen overlay with shortcut table |
| `src/components/ui/ShortcutOverlay.test.ts` | CREATE — unit tests |
| `e2e/shortcuts.spec.ts` | CREATE — e2e tests |

### Files to Modify

| File | Action |
|------|--------|
| `src/views/GameView.vue` | MODIFY — add shortcutOverlayOpen state, `?` key listener, ShortcutOverlay render, input guard |

### Do NOT Modify

- `src/composables/useKeyboard.ts` — game input only; `?` is a UI shortcut handled separately
- `src/composables/usePostSolveTransition.ts` — no changes needed
- `src/components/ui/SettingsPanel.vue` — no changes needed
- `src/stores/*` — no store changes needed
- `src/style.css` — no new design tokens needed; use existing ones

### Previous Story Intelligence (from 5.2)

- `SettingsPanel.vue` uses v-model pattern with `modelValue` prop and `update:modelValue` emit — replicate this exactly
- Focus trap pattern: `querySelectorAll('button:not([disabled])')`, Tab/Shift+Tab wrapping (lines 39-57)
- Outside-click detection: `document.addEventListener('mousedown', ...)` checking `contains()` (lines 60-70)
- Focus on mount: `nextTick(() => panelEl.value?.querySelector(...)?.focus())` (lines 76-78)
- Escape handling: `if (e.key === 'Escape' && props.modelValue) { close() }` (lines 34-38)
- Cleanup: both `keydown` and `mousedown` listeners removed in `onUnmounted` (lines 81-84)
- Story 5.2 shipped with 284 unit tests passing and 14 e2e tests passing (+ 4 skipped offline/PWA)
- `App.vue` has a `watchEffect` for deuteranopia class — no changes needed there
- E2E tests use `page.waitForLoadState('networkidle')` before interactions
- Do NOT add game keyboard interactions in e2e tests that conflict with `useKeyboard` handler

### Unit Test Count

Story 5.2 shipped with 284 unit tests. This story adds:
- ~6 new tests in `ShortcutOverlay.test.ts` (render, aria, Escape, `?`, backdrop click, content click)

Run `npm run test:unit` — all 284 + new tests must pass.
Run `npm run test:e2e` — all existing + new tests pass.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.3]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR12 — overlay dismiss and focus return]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR13 — ShortcutOverlay design]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR17 — keyboard-only gameplay]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR6 — all elements keyboard operable]
- [Source: src/components/ui/SettingsPanel.vue — reference overlay implementation]
- [Source: src/composables/useKeyboard.ts — game keyboard input handling]
- [Source: src/composables/usePostSolveTransition.ts — post-solve keyboard handling]
- [Source: src/views/GameView.vue — parent component for overlay integration]
- [Source: src/style.css — @theme design tokens]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Playwright `page.keyboard.press('Shift+/')` sends `key: '/'` not `key: '?'` — used `page.keyboard.press('?')` instead for e2e tests
- Removed `?` key handler from ShortcutOverlay to avoid double-handler conflict with GameView's toggle — parent handles all `?` toggling, overlay only handles Escape dismiss

### Completion Notes List

- Created ShortcutOverlay.vue with full-screen dark backdrop (0.85 opacity), centered content block (360px max-width), all 6 shortcuts, proper ARIA attributes, focus trap, and focus restore on close
- Wired `?` key listener in GameView.vue as separate window keydown handler — toggles overlay open/closed, ignores while SettingsPanel is open
- Added input suppression guard: `handleKeyPress` returns early when either overlay is open (fixes existing bug where typing while SettingsPanel is open fed letters to game engine)
- Keyboard navigation audit confirmed: full keyboard-only ritual flow works end-to-end, focus is never lost after closing overlays, Escape from post-solve etymology returns to playable state
- 293 unit tests pass (284 existing + 9 new), 20 e2e tests pass (15 existing + 5 new), 4 skipped (offline/PWA)

### File List

- `src/components/ui/ShortcutOverlay.vue` — CREATED
- `src/components/ui/ShortcutOverlay.test.ts` — CREATED
- `e2e/shortcuts.spec.ts` — CREATED
- `src/views/GameView.vue` — MODIFIED

### Change Log

- 2026-03-24: Story 5.3 implementation complete — ShortcutOverlay component, GameView integration, keyboard audit, unit and e2e tests
- 2026-03-24: Code review fixes — focus restoration moved to onUnmounted (AC5 fix for ?-dismiss path), Escape handler uses stopImmediatePropagation (prevents post-solve double-dismiss), handleQuestionMark filters e.repeat, 2 new e2e tests (? dismiss + backdrop click), spec Task 1.6 amended to reflect actual architecture
