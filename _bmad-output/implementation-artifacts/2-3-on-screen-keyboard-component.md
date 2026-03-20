# Story 2.3: On-Screen Keyboard Component

Status: done

## Story

As a player,
I want an on-screen keyboard that mirrors the state of each letter and accepts click input,
So that I can play using either the physical keyboard or the on-screen keys.

## Acceptance Criteria

1. **Given** `GameKeyboard.vue` **When** rendered **Then** it displays three rows: Q–P (10 keys), A–L (9 keys, inset/offset), Enter + Z–M + ⌫ **And** Enter and ⌫ use a wide variant of `KeyboardKey.vue` **(UX-DR7)**

2. **Given** `KeyboardKey.vue` for a letter that has not been guessed **When** rendered **Then** it shows the default (unused) background — `bg-surface` (#1a1a22)

3. **Given** `KeyboardKey.vue` for a letter with a known state (correct, present, or absent) **When** rendered after a guess that revealed that letter's state **Then** it displays the matching tile color (`tile-correct`, `tile-present`, or `tile-absent`) **And** once colored, the key never reverts to a lower-information state **(UX-DR7)**

4. **Given** `KeyboardKey.vue` **When** clicked or tapped **Then** it triggers the same input handler as the equivalent physical key **And** it shows a subtle hover state on mouseover and a slight active state on press **(UX-DR6)** **And** it has `role="button"` and `aria-label` set to the key value or state **(UX-DR6)** **And** minimum tap target size is 43×58px **(UX-DR7)**

5. **Given** `GameView.vue` **When** rendered **Then** `<GameKeyboard>` appears below `<GameBoard>` in the same centered column **And** clicking any key calls the appropriate store action (`typeChar`, `deleteLast`, or `submitGuess`)

## Tasks / Subtasks

- [x] Task 1: Add `KeyState` type to `src/types/game.ts` (AC: 2, 3)
  - [x] 1.1: Add `export type KeyState = 'default' | 'correct' | 'present' | 'absent'`

- [x] Task 2: Create `src/components/game/KeyboardKey.vue` (AC: 2, 3, 4)
  - [x] 2.1: Accept props: `label: string` (display text), `keyValue: string` (emitted value), `state: KeyState` (defaults to `'default'`), `wide?: boolean`
  - [x] 2.2: Emit `'key-press': [keyValue: string]` on click
  - [x] 2.3: Render `role="button"` with correct `aria-label` — letter or state: `"A, correct"` when colored, `"Q"` when default; Enter → `"Enter"`, ⌫ → `"Delete"`
  - [x] 2.4: Minimum 43×58px dimensions; wide variant ~65px wide
  - [x] 2.5: Background per state: `default` → `var(--color-bg-surface)`, `correct` → `var(--color-tile-correct)`, `present` → `var(--color-tile-present)`, `absent` → `var(--color-tile-absent)`
  - [x] 2.6: Hover: `filter: brightness(1.2)` or equivalent; active/press: `transform: scale(0.95)` or equivalent
  - [x] 2.7: `user-select: none`; Inter 700 font; uppercase; text `var(--color-text-primary)` for all states

- [x] Task 3: Create `src/components/game/GameKeyboard.vue` (AC: 1, 3)
  - [x] 3.1: Accept props: `letterStates: Record<string, 'correct' | 'present' | 'absent'>`
  - [x] 3.2: Emit `'key-press': [key: string]` bubbling up from `KeyboardKey`
  - [x] 3.3: Render 3 rows using the exact layout constants below
  - [x] 3.4: Helper `getKeyState(letter: string): KeyState` returns `props.letterStates[letter.toLowerCase()] ?? 'default'`
  - [x] 3.5: Row 2 (A–L) uses padding-left offset (~22px each side) to visually inset the row

- [x] Task 4: Update `src/views/GameView.vue` to render `<GameKeyboard>` (AC: 5)
  - [x] 4.1: Add `import GameKeyboard from '@/components/game/GameKeyboard.vue'`
  - [x] 4.2: Add `import { useSettingsStore } from '@/stores/useSettingsStore'` and `const settingsStore = useSettingsStore()`
  - [x] 4.3: Add `import { computed } from 'vue'`
  - [x] 4.4: Add `letterStates` computed property (see Dev Notes below)
  - [x] 4.5: Add `handleKeyPress(key: string)` function (see Dev Notes below)
  - [x] 4.6: Add `.keyboard-area` div below `.board-area` containing `<GameKeyboard :letter-states="letterStates" @key-press="handleKeyPress" />`
  - [x] 4.7: Add `.keyboard-area` CSS: `display: flex; justify-content: center; margin-top: 16px; padding-bottom: 20px;`

- [x] Task 5: Write Vitest component tests (AC: 1–4)
  - [x] 5.1: `src/components/game/KeyboardKey.test.ts` — test all 4 states, wide variant, click emission, aria-label, role
  - [x] 5.2: `src/components/game/GameKeyboard.test.ts` — test 3-row structure, key count (26 letter + Enter + ⌫ = 28), letter state passed correctly, key-press propagation

## Dev Notes

### Critical Constraints

- **`<script setup>` only** — no Options API; `defineProps`, `defineEmits`, `computed`, `watch`, `ref` from `vue`
- **No store access in KeyboardKey or GameKeyboard** — purely presentational; `GameView.vue` is the sole store consumer
- **`TileState` stays untouched** — add `KeyState` as a separate type export in `src/types/game.ts`; do NOT change `TileState`
- **`KeyState` priority rule**: correct > present > absent > default. Once a key reaches 'correct', it never reverts. This is enforced by the `letterStates` computed in `GameView.vue` (not in components)
- **72 existing tests must keep passing** — run `npm run test:unit` after implementation

### KeyState Type Addition to `src/types/game.ts`

Add below the existing `TileState` line:
```ts
export type KeyState = 'default' | 'correct' | 'present' | 'absent'
```

`TileState` is unchanged. `KeyState` omits `'empty'` and `'filled'` because keys have no typing/submission states.

### GameKeyboard Row Layout

```ts
const ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['Enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'Backspace'],
] as const
```

Display labels:
- Letter keys: uppercase letter ('Q', 'W', etc.)
- `'Enter'` → label `'Enter'`, keyValue `'Enter'`
- `'Backspace'` → label `'⌫'`, keyValue `'Backspace'`

Wide keys (`:wide="true"`): `'Enter'` and `'Backspace'`

### GameKeyboard Template Sketch

```vue
<template>
  <div class="keyboard-container">
    <div
      v-for="(row, rowIdx) in ROWS"
      :key="rowIdx"
      class="keyboard-row"
      :class="{ 'keyboard-row--middle': rowIdx === 1 }"
    >
      <KeyboardKey
        v-for="keyVal in row"
        :key="keyVal"
        :label="getLabel(keyVal)"
        :key-value="keyVal"
        :state="isLetter(keyVal) ? getKeyState(keyVal) : 'default'"
        :wide="keyVal === 'Enter' || keyVal === 'Backspace'"
        @key-press="emit('key-press', $event)"
      />
    </div>
  </div>
</template>
```

Helper functions:
```ts
function isLetter(key: string): boolean {
  return key.length === 1 // letters are single chars; 'Enter' and 'Backspace' are multi-char
}

function getLabel(key: string): string {
  if (key === 'Backspace') return '⌫'
  if (key.length === 1) return key.toUpperCase()
  return key // 'Enter' stays as 'Enter'
}

function getKeyState(letter: string): KeyState {
  return props.letterStates[letter.toLowerCase()] ?? 'default'
}
```

### KeyboardKey Dimensions and CSS

**Minimum sizes per UX-DR7:**
- Normal key: `min-width: 43px`, `height: 58px`
- Wide key: `min-width: 65px`, `height: 58px` (approximately 1.5× normal)
- Row gap between keys: `6px`
- Row gap between rows: `6px`

**CSS variable mapping:**
| State | CSS |
|-------|-----|
| `default` | `background-color: var(--color-bg-surface)` |
| `correct` | `background-color: var(--color-tile-correct)` |
| `present` | `background-color: var(--color-tile-present)` |
| `absent` | `background-color: var(--color-tile-absent)` |

Text color: `var(--color-text-primary)` for all states (consistent with tile absent which uses text-secondary for tile letters, but keys always use text-primary for legibility).

**Hover/Active:**
```css
.keyboard-key:hover {
  filter: brightness(1.2);
}
.keyboard-key:active {
  transform: scale(0.95);
}
```

**Full KeyboardKey CSS class structure:**
```css
.keyboard-key {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 43px;
  height: 58px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 0.8125rem; /* 13px */
  text-transform: uppercase;
  background-color: var(--color-bg-surface);
  color: var(--color-text-primary);
  transition: filter 0.1s, transform 0.1s;
}

.keyboard-key--wide { min-width: 65px; }
.keyboard-key--correct { background-color: var(--color-tile-correct); }
.keyboard-key--present { background-color: var(--color-tile-present); }
.keyboard-key--absent { background-color: var(--color-tile-absent); }
```

**`@media (prefers-reduced-motion: reduce)`:**
```css
@media (prefers-reduced-motion: reduce) {
  .keyboard-key {
    transition: none;
  }
  .keyboard-key:active {
    transform: none;
  }
}
```

### KeyboardKey aria-label Logic

```ts
// In the template:
:aria-label="state !== 'default'
  ? `${label}, ${state}`
  : keyValue === 'Backspace' ? 'Delete' : label"
```

Examples:
- Default letter 'Q' → `aria-label="Q"`
- Correct letter 'R' → `aria-label="R, correct"`
- Enter key → `aria-label="Enter"`
- ⌫ key → `aria-label="Delete"` (keyValue is 'Backspace', label is '⌫', but aria uses 'Delete' for clarity)

### GameView.vue Changes

**New imports to add:**
```ts
import { computed } from 'vue'  // add to existing vue import if needed
import GameKeyboard from '@/components/game/GameKeyboard.vue'
import { useSettingsStore } from '@/stores/useSettingsStore'
```

**New reactive state in `<script setup>`:**
```ts
const settingsStore = useSettingsStore()
```

**`letterStates` computed — derives best-known state per key:**
```ts
const letterStates = computed(() => {
  const states: Record<string, 'correct' | 'present' | 'absent'> = {}
  const priority = { correct: 3, present: 2, absent: 1 } as const

  store.boardState.guesses.forEach((guess, rowIdx) => {
    const tileResult = store.boardState.tileStates[rowIdx]
    if (!tileResult) return
    for (let i = 0; i < guess.length; i++) {
      const letter = guess[i].toLowerCase()
      const state = tileResult[i]
      if (state === 'correct' || state === 'present' || state === 'absent') {
        const existing = states[letter]
        if (!existing || priority[state] > priority[existing]) {
          states[letter] = state
        }
      }
    }
  })
  return states
})
```

**`handleKeyPress` function:**
```ts
function handleKeyPress(key: string): void {
  if (key === 'Enter') {
    store.submitGuess(settingsStore.hardMode)
  } else if (key === 'Backspace') {
    store.deleteLast()
  } else {
    store.typeChar(key)
  }
}
```

**Updated template — add keyboard below board:**
```vue
<template>
  <main class="game-root">
    <div class="board-area">
      <GameBoard
        :tile-states="store.boardState.tileStates"
        :guesses="store.boardState.guesses"
        :current-input="store.currentInput"
        :active-row="store.activeRow"
        :shaking-row="store.invalidGuessShake"
      />
    </div>
    <div class="keyboard-area">
      <GameKeyboard
        :letter-states="letterStates"
        @key-press="handleKeyPress"
      />
    </div>
  </main>
  <!-- Top-right reserved corner — unchanged from 2.1 -->
  <div class="corner-reserved"></div>
</template>
```

**New CSS in GameView.vue scoped styles:**
```css
.keyboard-area {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding-bottom: 20px;
}
```

### useSettingsStore API (Already Implemented)

```ts
// src/stores/useSettingsStore.ts
useSettingsStore() returns:
  hardMode: Ref<boolean>   // false by default
  deuteranopia: Ref<boolean>  // false by default; for story 5.2
```

Pass `settingsStore.hardMode` (as `.value` when used in script, as the reactive ref in template) to `submitGuess`. Note: `submitGuess` accepts a `boolean`, so in the function: `store.submitGuess(settingsStore.hardMode)` — `settingsStore.hardMode` is a `Ref<boolean>`, which auto-unwraps in Pinia's composition store. Check useSettingsStore.ts if it returns raw `boolean` or `Ref<boolean>` and use `.value` accordingly.

### File Structure — What to Create/Modify

| File | Action | Notes |
|------|--------|-------|
| `src/types/game.ts` | **MODIFY** | Add `KeyState` type |
| `src/components/game/KeyboardKey.vue` | **CREATE** | |
| `src/components/game/KeyboardKey.test.ts` | **CREATE** | Co-located Vitest test |
| `src/components/game/GameKeyboard.vue` | **CREATE** | |
| `src/components/game/GameKeyboard.test.ts` | **CREATE** | Co-located Vitest test |
| `src/views/GameView.vue` | **MODIFY** | Add keyboard area + letterStates + handler |

**Do NOT create or modify:**
- `src/composables/useKeyboard.ts` — Story 2.4 (physical keyboard event listener)
- Any store files — stores are already implemented
- `src/style.css` — all needed tokens are already there
- `src/App.vue` — untouched

### Testing Requirements

All 72 existing tests must pass. Run `npm run test:unit` after implementation.

**KeyboardKey.test.ts — key scenarios:**
```ts
import { mount } from '@vue/test-utils'
import KeyboardKey from './KeyboardKey.vue'

// Default state
const key = mount(KeyboardKey, { props: { label: 'Q', keyValue: 'q', state: 'default' } })
expect(key.attributes('role')).toBe('button')
expect(key.attributes('aria-label')).toBe('Q')
// No state class: no keyboard-key--correct/present/absent

// Correct state
const key = mount(KeyboardKey, { props: { label: 'R', keyValue: 'r', state: 'correct' } })
expect(key.classes()).toContain('keyboard-key--correct')
expect(key.attributes('aria-label')).toBe('R, correct')

// Click emission
const key = mount(KeyboardKey, { props: { label: 'A', keyValue: 'a', state: 'default' } })
await key.trigger('click')
expect(key.emitted('key-press')).toEqual([['a']])

// Wide variant
const key = mount(KeyboardKey, { props: { label: 'Enter', keyValue: 'Enter', state: 'default', wide: true } })
expect(key.classes()).toContain('keyboard-key--wide')

// Backspace aria-label
const key = mount(KeyboardKey, { props: { label: '⌫', keyValue: 'Backspace', state: 'default' } })
expect(key.attributes('aria-label')).toBe('Delete')
```

**GameKeyboard.test.ts — key scenarios:**
```ts
import { mount } from '@vue/test-utils'
import GameKeyboard from './GameKeyboard.vue'

// Total key count: 26 letters + Enter + ⌫ = 28
const kb = mount(GameKeyboard, { props: { letterStates: {} } })
expect(kb.findAll('[role="button"]')).toHaveLength(28)

// 3 rows rendered
const rows = kb.findAll('.keyboard-row')
expect(rows).toHaveLength(3)
expect(rows[0].findAll('[role="button"]')).toHaveLength(10) // Q-P
expect(rows[1].findAll('[role="button"]')).toHaveLength(9)  // A-L
expect(rows[2].findAll('[role="button"]')).toHaveLength(9)  // Enter + Z-M + ⌫

// Middle row has inset class
expect(rows[1].classes()).toContain('keyboard-row--middle')

// Letter state propagated
const kb = mount(GameKeyboard, { props: { letterStates: { r: 'correct' } } })
// Find the 'R' key — it should have the correct state class
const rKey = kb.findAll('[role="button"]').find(k => k.attributes('aria-label')?.startsWith('R'))
expect(rKey?.classes()).toContain('keyboard-key--correct')

// key-press propagation
const kb = mount(GameKeyboard, { props: { letterStates: {} } })
const aKey = kb.findAll('[role="button"]').find(k => k.attributes('aria-label') === 'A')
await aKey?.trigger('click')
expect(kb.emitted('key-press')).toEqual([['a']])
```

### Previous Story Learnings (from 2.2)

- **`watch(prop, handler, { immediate: true })`** — use immediate when you need the initial prop value to trigger side effects on mount (used in GameBoard for shake; not likely needed here but keep in mind)
- **setTimeout cleanup on `onUnmounted`** — if you add any timers (e.g., hover state timers), clean them up; pattern from GameTile: `pendingTimers.forEach(clearTimeout)` in `onUnmounted`
- **No game logic in components** — KeyboardKey and GameKeyboard are purely presentational; no imports from stores
- **GameView is the only store consumer** — all store state flows down as props; all store mutations flow up via emits
- **72 tests pass** at start; confirm still passing at completion (41 pre-existing + 17 GameTile + 14 GameBoard)
- **Tailwind v4 CSS custom properties** — use `var(--color-*)` directly in scoped CSS; tokens are defined in `src/style.css` and available globally
- **`animationend` event pattern** — GameBoard resets shakeActive in `@animationend`; for keyboard key active state, CSS `:active` pseudo-class handles reset automatically without Vue watchers needed
- **`perspective: 250px` on `.board-row`** — needed for 3D tile flip; keyboard keys have no 3D animations so `perspective` is not needed

### Regression Risk: GameView.vue

GameView.vue is being modified again. Be precise:
- Add `computed` to the vue import if not already present — check existing import line
- Do NOT remove the `onMounted` call or `initGame`
- Do NOT change the `<GameBoard>` binding
- Do NOT change `.board-area` or `.corner-reserved` styles
- The `getTodayUTC` function stays as-is
- Only ADD: new imports, `settingsStore`, `letterStates`, `handleKeyPress`, `.keyboard-area` div in template, `.keyboard-area` CSS

### Store API Reference (Already Implemented — story 2.4 wires physical keyboard)

```ts
// useGameStore actions called from handleKeyPress:
store.typeChar(char: string)      // adds char to currentInput (lowercase internally)
store.deleteLast()                // removes last char from currentInput
store.submitGuess(hardMode: boolean)  // returns { valid, hardModeViolation }

// useSettingsStore:
settingsStore.hardMode            // boolean (Ref or plain — check the file)
```

`typeChar` accepts lowercase `'a'`–`'z'`. When user clicks 'Q' key, `keyValue` is `'q'` (lowercase) — matches what `typeChar` expects.

### Design Tokens Available (from `src/style.css` `@theme`)

```
--color-bg-base: #111118
--color-bg-surface: #1a1a22        ← keyboard key default background
--color-tile-border-empty: #3a3a45
--color-tile-border-active: #565663
--color-tile-correct: #538d4e      ← correct key color
--color-tile-present: #b59f3b      ← present key color
--color-tile-absent: #3a3a45       ← absent key color (same as tile-border-empty)
--color-text-primary: #f0f0f0
--color-text-secondary: #a0a0aa
--color-accent-streak: #9999cc
--duration-tile-flip: 400ms
--duration-tile-stagger: 100ms
```

All accessed as `var(--color-*)` in scoped CSS — do NOT use Tailwind class names for colors (this project uses `var()` in scoped styles, not class-based tokens).

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `getLabel('Enter')` initially returned `'ENTER'` via `.toUpperCase()`. Fixed by checking `key.length === 1` first so only single-char keys are uppercased; 'Enter' stays as 'Enter'. This corrected 3 failing tests that searched by `aria-label === 'Enter'`.

### Completion Notes List

- Added `KeyState = 'default' | 'correct' | 'present' | 'absent'` to `src/types/game.ts` without touching `TileState`
- Created `KeyboardKey.vue`: purely presentational, `role="button"`, correct aria-label logic (state-suffixed when colored, 'Delete' for Backspace), CSS BEM modifier classes per state, min 43×58px / wide 65px, hover/active transitions, `prefers-reduced-motion` support
- Created `GameKeyboard.vue`: three rows via `ROWS` constant, middle row inset via padding, `getKeyState` with `?? 'default'` fallback, key-press event bubbled up, Enter/Backspace are wide and always 'default' state
- Updated `GameView.vue`: added `computed` to vue import, `useSettingsStore`, `letterStates` computed with priority map (correct=3 > present=2 > absent=1), `handleKeyPress` routing to `typeChar`/`deleteLast`/`submitGuess`, `.keyboard-area` div + CSS
- 107 tests pass (72 pre-existing + 14 KeyboardKey + 21 GameKeyboard); 0 regressions

### File List

- `src/types/game.ts` — modified (added `KeyState` type)
- `src/components/game/KeyboardKey.vue` — created
- `src/components/game/KeyboardKey.test.ts` — created
- `src/components/game/GameKeyboard.vue` — created
- `src/components/game/GameKeyboard.test.ts` — created
- `src/views/GameView.vue` — modified (keyboard area, letterStates, handleKeyPress)

## Change Log

- 2026-03-20: Story 2.3 created — On-Screen Keyboard Component
- 2026-03-20: Story 2.3 implemented — all tasks complete, 107 tests pass, status → review
