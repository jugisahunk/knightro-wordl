# Story 2.4: Gameplay Loop and Physical Keyboard

Status: done

## Story

As a player,
I want to type guesses with my physical keyboard, see tile reveals, and have the game enforce all rules correctly,
So that the complete daily puzzle experience works end-to-end.

## Acceptance Criteria

1. **Given** the app is loaded and `GameView.vue` is active **When** I press any letter key (A–Z) **Then** the letter appears immediately in the next empty tile of the active row — no click-to-focus required (FR3, UX-DR17)

2. **Given** a letter has been typed in the active row **When** I press Backspace **Then** the last typed letter is removed from the active row (UX-DR17)

3. **Given** the active row has 5 letters **When** I press Enter and the word is not in `valid-words.json` **Then** the row shakes and resets — no sound, no color change (FR4)

4. **Given** the active row has 5 letters **When** I press Enter and the word is valid **Then** tiles flip left-to-right revealing correct/present/absent states (FR5) **And** the on-screen keyboard updates to reflect best-known states for each guessed letter **And** `useGameStore.funnelData` is updated with the valid word count remaining after this guess (FR10)

5. **Given** hard mode is enabled and a previous guess revealed a correct-position letter **When** I submit a guess that does not use that letter in that position **Then** the guess is rejected with a row shake — the hard mode constraint is enforced (FR7)

6. **Given** the player submits the correct word **When** the final tile flip completes **Then** `gamePhase` transitions to `WON` **And** the board remains visible in its completed state

7. **Given** the player submits 6 incorrect guesses **When** the last tile flip completes **Then** `gamePhase` transitions to `LOST` **And** the correct answer is displayed as a quiet label beneath the board (FR8, UX-DR18) **And** no punitive color, animation, or messaging is applied

8. **Given** the game is in `WON` or `LOST` phase **When** the player presses any letter key **Then** no input is accepted — the board is locked (FR6)

## Tasks / Subtasks

- [x] Task 1: Create `src/composables/useKeyboard.ts` (AC: 1, 2, 3, 4, 5, 8)
  - [x] 1.1: Export `useKeyboard(onKey: (key: string) => void): void`
  - [x] 1.2: Inside, define `handleKeydown(event: KeyboardEvent)` that filters single-letter keys (A–Z, case-insensitive → normalize to lowercase) plus `'Enter'` and `'Backspace'`
  - [x] 1.3: Call `event.preventDefault()` for `Backspace` (prevents browser back navigation) and `Enter`
  - [x] 1.4: Pass filtered, normalized key to `onKey` callback
  - [x] 1.5: `onMounted` → `window.addEventListener('keydown', handleKeydown)`
  - [x] 1.6: `onUnmounted` → `window.removeEventListener('keydown', handleKeydown)`

- [x] Task 2: Wire `useKeyboard` in `GameView.vue` (AC: 1, 2, 3, 4, 5, 8)
  - [x] 2.1: Add `import { useKeyboard } from '@/composables/useKeyboard'`
  - [x] 2.2: Add `import { GamePhase } from '@/types/game'` for template use
  - [x] 2.3: Call `useKeyboard(handleKeyPress)` in `<script setup>` (after `handleKeyPress` is defined)

- [x] Task 3: Add answer-reveal label in `GameView.vue` (AC: 7)
  - [x] 3.1: In template, add `<p v-if="store.gamePhase === GamePhase.LOST" class="answer-reveal" aria-live="polite">{{ store.answerWord.toUpperCase() }}</p>` inside `.board-area` below `<GameBoard>`
  - [x] 3.2: Add `.answer-reveal` CSS: centered, `color: var(--color-text-secondary)`, `font-size: 0.875rem`, `letter-spacing: 0.1em`, `margin-top: 8px`, no animation

- [x] Task 4: Write Vitest tests for `useKeyboard.ts` (AC: 1, 2, 8)
  - [x] 4.1: Create `src/composables/useKeyboard.test.ts` using `@vue/test-utils` `mount` to trigger lifecycle hooks
  - [x] 4.2: Test: letter key A-Z triggers callback with lowercase letter
  - [x] 4.3: Test: Enter triggers callback with `'Enter'`
  - [x] 4.4: Test: Backspace triggers callback with `'Backspace'`
  - [x] 4.5: Test: non-game keys (digits, arrows, modifiers) do NOT trigger callback
  - [x] 4.6: Test: event listener is removed after component is unmounted (no double-fire)

## Dev Notes

### Critical Constraints

- **`<script setup>` only** — no Options API; `defineProps`, `defineEmits`, `computed`, `ref`, `onMounted`, `onUnmounted` from `vue`
- **107 existing tests must keep passing** — run `npm run test:unit` after implementation
- **No game logic in `useKeyboard.ts`** — it is a pure event bridge; the store already guards against input when game is complete via `isPlaying` check inside `typeChar`, `deleteLast`, `submitGuess`
- **`useKeyboard` is callback-based** — it does NOT import `useGameStore` directly; it receives an `onKey` callback from `GameView.vue`; this makes it testable without Pinia
- **`handleKeyPress` in `GameView.vue` is unchanged** — Story 2.3 implemented it; just wire `useKeyboard(handleKeyPress)` to it

### useKeyboard.ts — Complete Implementation

```ts
import { onMounted, onUnmounted } from 'vue'

export function useKeyboard(onKey: (key: string) => void): void {
  function handleKeydown(event: KeyboardEvent): void {
    const { key } = event
    if (/^[a-zA-Z]$/.test(key)) {
      onKey(key.toLowerCase())
    } else if (key === 'Enter' || key === 'Backspace') {
      event.preventDefault()
      onKey(key)
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
}
```

Notes:
- `event.preventDefault()` is called for `Backspace` (prevents browser back navigation) and `Enter` (prevents form submissions / focus side-effects)
- Letter keys do NOT call `preventDefault()` — could break screen readers and browser shortcuts that include letters
- Regex `/^[a-zA-Z]$/` matches exactly one letter — filters out `'Shift'`, `'Tab'`, `'F1'`, `'ArrowLeft'`, multi-char special keys
- All letters normalized to lowercase via `.toLowerCase()` — `typeChar` expects lowercase; on-screen keyboard already passes lowercase

### GameView.vue — Minimal Changes

Three additions only. Do NOT alter anything else:

**New imports (add to existing block):**
```ts
import { useKeyboard } from '@/composables/useKeyboard'
import { GamePhase } from '@/types/game'
```

**Wire composable (add after `handleKeyPress` function definition):**
```ts
useKeyboard(handleKeyPress)
```

**Template: answer reveal (inside `.board-area` after `<GameBoard>`):**
```vue
<p
  v-if="store.gamePhase === GamePhase.LOST"
  class="answer-reveal"
  aria-live="polite"
>{{ store.answerWord.toUpperCase() }}</p>
```

**New CSS in scoped styles:**
```css
.answer-reveal {
  text-align: center;
  margin-top: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--color-text-secondary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
```

UX-DR18: quiet label, not modal, not banner. `color: var(--color-text-secondary)` (#a0a0aa) communicates the reveal without drama. No bold, no animation, no red.

### GameView.vue Regression Guard

GameView.vue was heavily modified in Stories 2.1 and 2.3. Be precise:

- Do NOT remove `onMounted(() => store.initGame(getTodayUTC()))`
- Do NOT remove `computed` from the vue import (already present from 2.3)
- Do NOT alter `letterStates` computed property
- Do NOT alter `handleKeyPress` function
- Do NOT alter `<GameBoard>` bindings
- Do NOT alter `.board-area`, `.keyboard-area`, `.corner-reserved`, or `.game-root` styles
- `settingsStore.hardMode` is auto-unwrapped by Pinia — `store.submitGuess(settingsStore.hardMode)` is correct as-is (no `.value` needed)
- `store.answerWord` is already exposed by `useGameStore` — use it directly

### useKeyboard.test.ts — Key Test Scenarios

```ts
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { useKeyboard } from './useKeyboard'

function mountWithKeyboard(onKey: (key: string) => void) {
  const TestComponent = defineComponent({
    setup() { useKeyboard(onKey) },
    template: '<div />'
  })
  return mount(TestComponent)
}

// Letter key → lowercase callback
it('calls onKey with lowercase letter for A–Z key press', async () => {
  const onKey = vi.fn()
  mountWithKeyboard(onKey)
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'A' }))
  expect(onKey).toHaveBeenCalledWith('a')
})

// Enter → callback
it('calls onKey with "Enter" for Enter key press', async () => {
  const onKey = vi.fn()
  mountWithKeyboard(onKey)
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
  expect(onKey).toHaveBeenCalledWith('Enter')
})

// Backspace → callback
it('calls onKey with "Backspace" for Backspace key press', async () => {
  const onKey = vi.fn()
  mountWithKeyboard(onKey)
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }))
  expect(onKey).toHaveBeenCalledWith('Backspace')
})

// Non-game keys ignored
it('does not call onKey for digit keys', async () => {
  const onKey = vi.fn()
  mountWithKeyboard(onKey)
  window.dispatchEvent(new KeyboardEvent('keydown', { key: '5' }))
  expect(onKey).not.toHaveBeenCalled()
})

it('does not call onKey for arrow keys', async () => {
  const onKey = vi.fn()
  mountWithKeyboard(onKey)
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
  expect(onKey).not.toHaveBeenCalled()
})

it('does not call onKey for modifier keys', async () => {
  const onKey = vi.fn()
  mountWithKeyboard(onKey)
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
  expect(onKey).not.toHaveBeenCalled()
})

// Unmount removes listener
it('stops calling onKey after component unmounts', async () => {
  const onKey = vi.fn()
  const wrapper = mountWithKeyboard(onKey)
  wrapper.unmount()
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
  expect(onKey).not.toHaveBeenCalled()
})
```

### Store API (Already Implemented — No Changes Needed)

```ts
// useGameStore — all guards are INSIDE the store:
store.typeChar(char: string)           // no-op if !isPlaying; accepts lowercase 'a'–'z'
store.deleteLast()                     // no-op if !isPlaying
store.submitGuess(hardMode: boolean)   // no-op if !isPlaying; triggers shake on invalid/hard-mode violation
store.answerWord                       // string — the current day's answer word (exposed in store return)
store.gamePhase                        // computed from boardState.gamePhase

// GamePhase enum (src/types/game.ts):
GamePhase.PLAYING = 0
GamePhase.WON = 1
GamePhase.LOST = 2
// Used as const enum — import from '@/types/game'
```

`store.isComplete` is also available (computed: `gamePhase === WON || gamePhase === LOST`) if needed.

### File Structure — What to Create/Modify

| File | Action | Notes |
|------|--------|-------|
| `src/composables/useKeyboard.ts` | **CREATE** | Physical keyboard event bridge |
| `src/composables/useKeyboard.test.ts` | **CREATE** | Co-located Vitest test |
| `src/views/GameView.vue` | **MODIFY** | Add 2 imports + useKeyboard call + answer-reveal label + CSS |

**Do NOT create or modify:**
- Any store files — all game logic is already correct
- `src/types/game.ts` — all types exist; `KeyState` was added in 2.3; `GamePhase` already there
- `src/style.css` — all tokens available
- Any component files — only `GameView.vue` needs touching
- `src/App.vue` — untouched

### Previous Story Learnings (from 2.3)

- **No store access in leaf composables** — `useKeyboard` is pure event bridge with callback pattern; tests it without Pinia
- **`window` vs `document` for keydown** — use `window` for maximum compatibility; `document.addEventListener` also works but `window` is idiomatic
- **`onUnmounted` cleanup is mandatory** — any `addEventListener` added in `onMounted` MUST be removed in `onUnmounted`; pattern from GameTile's `pendingTimers.forEach(clearTimeout)` — same principle
- **107 tests pass at start** (72 pre-existing + 14 KeyboardKey + 21 GameKeyboard) — confirm still passing at completion
- **Tailwind v4 CSS custom properties** — use `var(--color-text-secondary)` directly in scoped CSS for the answer-reveal label
- **`const enum GamePhase`** — exported as `const enum` from `src/types/game.ts`; import with `import { GamePhase } from '@/types/game'`; compare as `store.gamePhase === GamePhase.LOST`

### Design Tokens for Answer Reveal

```
--color-text-secondary: #a0a0aa   ← quiet, non-alarming label color (UX-DR18)
```

Answer is shown as plain text in `text-secondary` — no tile colors, no animation, no error-red. The word is enough. The design intent: "Answer reveal is quiet — a label, not a modal, not a banner."

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Composable Boundaries]
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Error pattern — silent and physical]
- [Source: _bmad-output/implementation-artifacts/2-3-on-screen-keyboard-component.md#Dev Notes]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_No debug issues encountered._

### Completion Notes List

- Created `src/composables/useKeyboard.ts`: pure event bridge composable that listens to `window` keydown events, normalizes letters to lowercase, and calls the provided `onKey` callback. Calls `preventDefault()` for Enter and Backspace. Cleans up listener on unmount.
- Added 2 imports to `GameView.vue`: `useKeyboard` and `GamePhase`.
- Wired `useKeyboard(handleKeyPress)` in `GameView.vue` after `handleKeyPress` definition — no changes to existing logic.
- Added answer-reveal `<p>` label in `.board-area` template (shown only when `gamePhase === GamePhase.LOST`) with `aria-live="polite"`.
- Added `.answer-reveal` scoped CSS per UX-DR18: quiet secondary color, no animation.
- Created `src/composables/useKeyboard.test.ts` with 9 tests covering: letter normalization, Enter, Backspace, ignored keys (digits/arrows/modifiers/F-keys), and unmount cleanup.
- All 116 tests pass (107 pre-existing + 9 new). No regressions.

### File List

- `src/composables/useKeyboard.ts` (created)
- `src/composables/useKeyboard.test.ts` (created)
- `src/views/GameView.vue` (modified)

## Change Log

- 2026-03-20: Implemented Story 2.4 — created `useKeyboard` composable, wired physical keyboard into GameView, added answer-reveal label for LOST state. 9 new tests, 116 total passing.
