# Story 2.2: Tile and GameBoard Components

Status: done

## Story

As a player,
I want to see a 6×5 game board with tiles that fill as I type and flip to reveal colors on submission,
so that the core visual feedback of the puzzle is present and correct.

## Acceptance Criteria

1. **Given** `GameTile.vue` in the `empty` state, **When** rendered, **Then** it displays at 62×62px with a `tile-border-empty` border and `bg-surface` background **And** it has `aria-hidden="true"` **(UX-DR4)**

2. **Given** `GameTile.vue` in the `filled` state (letter typed, not yet submitted), **When** rendered, **Then** it shows the letter in Inter 700 uppercase, `text-primary`, with `tile-border-active` border **(UX-DR4)**

3. **Given** `GameTile.vue` transitioning from `filled` to `correct`, `present`, or `absent`, **When** a guess is submitted, **Then** each tile performs a CSS 3D rotateX flip animation (~400ms per tile) **And** the background color reveals at the 50% keyframe (face-down point) **And** tiles flip left-to-right with stagger delay per tile using `TILE_STAGGER_MS` **And** `aria-label="[letter], [state]"` is set on the revealed tile **(UX-DR4)**

4. **Given** `GameBoard.vue`, **When** rendered, **Then** it displays as a 6×5 CSS grid with 5px gaps between tiles **And** it has `role="grid"` and `aria-label="Myrdl game board"`, each row has `role="row"`, each tile has `role="gridcell"` **And** an `aria-live="polite"` announcer region exists for tile reveals and game-end state **(UX-DR5)**

5. **Given** `GameBoard.vue` and an invalid word submission, **When** the active row receives a shake trigger, **Then** the row applies a translateX shake animation (~300ms) and then resets **And** no sound plays and no color changes occur **(UX-DR5)**

6. **Given** `GameView.vue`, **When** the app loads, **Then** the board-placeholder is replaced with `<GameBoard>` receiving live store data as props **And** `initGame` is called on mount with today's UTC date

## Tasks / Subtasks

- [x] Task 1: Create `src/components/game/GameTile.vue` (AC: 1, 2, 3)
  - [x] 1.1: Accept props: `letter: string`, `state: TileState`, `revealIndex: number` (0–4 for stagger)
  - [x] 1.2: Render 62×62px tile with correct border and background per state
  - [x] 1.3: Show letter in `font-bold` (Inter 700), `uppercase`, `text-primary` when `state !== 'empty'`
  - [x] 1.4: Implement CSS 3D rotateX flip animation triggered by `watch` on `state` changing to a revealed state (`correct`/`present`/`absent`)
  - [x] 1.5: Apply stagger delay: `revealIndex * TILE_STAGGER_MS` ms — import from `src/constants/timing.ts`
  - [x] 1.6: Color must reveal at the 50% keyframe (face-down point) — see Dev Notes for animation strategy
  - [x] 1.7: Set `aria-hidden="true"` for empty tiles; `aria-label="[LETTER], [state]"` for revealed tiles
  - [x] 1.8: Add `@media (prefers-reduced-motion: reduce)` support — skip 3D rotation, instantly apply color

- [x] Task 2: Create `src/components/game/GameBoard.vue` (AC: 4, 5)
  - [x] 2.1: Accept props: `tileStates: GuessResult[]`, `guesses: string[]`, `currentInput: string`, `activeRow: number`, `shakingRow: boolean`
  - [x] 2.2: Render 6×5 grid using `display: grid`, `grid-template-rows: repeat(6, 62px)`, `gap: 5px`
  - [x] 2.3: Build each row as a `<div role="row">` — rows 0..`activeRow-1` use submitted tile states; row `activeRow` uses `currentInput` letters with `filled`/`empty` states; rows after active row are all `empty`
  - [x] 2.4: Pass `revealIndex` (0–4) to each `<GameTile>` within a row
  - [x] 2.5: Apply shake CSS animation to the active row when `shakingRow` is `true` (translateX ~300ms); animation triggers via `watch(shakingRow)`
  - [x] 2.6: Add `role="grid"` and `aria-label="Myrdl game board"` to grid container
  - [x] 2.7: Add `<div aria-live="polite" aria-atomic="true" class="sr-only" id="board-announcer">` for screen reader announcements

- [x] Task 3: Update `src/views/GameView.vue` to render `<GameBoard>` (AC: 6)
  - [x] 3.1: Import `useGameStore` and destructure `boardState`, `activeRow`, `currentInput`, `invalidGuessShake`
  - [x] 3.2: Import `GameBoard` from `../components/game/GameBoard.vue`
  - [x] 3.3: Replace `<div class="board-placeholder">` with `<GameBoard>` passing store state as props
  - [x] 3.4: Call `store.initGame(getTodayUTC())` in `onMounted` — implement `getTodayUTC()` as a local helper (returns today's date as `YYYY-MM-DD` in UTC using `new Date().toISOString().slice(0, 10)`)
  - [x] 3.5: Remove `src/components/game/.gitkeep` (the placeholder is no longer needed once real components are created)

- [x] Task 4: Write Vitest component tests (AC: 1–5)
  - [x] 4.1: `src/components/game/GameTile.test.ts` — test each of the 5 states renders correctly (correct CSS classes, letter display, aria attributes)
  - [x] 4.2: `src/components/game/GameBoard.test.ts` — test grid structure (6 rows, 5 tiles per row), shake class applied/removed, aria attributes

## Dev Notes

### Critical Constraints

- **`TileState` union type**: Import from `src/types/game.ts`. NEVER use raw strings for tile states — always `TileState`. The type is `'empty' | 'filled' | 'correct' | 'present' | 'absent'`.
- **`GuessResult` type**: `TileState[]` — import from `src/types/game.ts`.
- **Timing constants**: Import `TILE_FLIP_MS` (400) and `TILE_STAGGER_MS` (100) from `src/constants/timing.ts`. The UX spec says "~80ms" stagger — the TypeScript constant (100ms) is authoritative. The CSS tokens `--duration-tile-flip` and `--duration-tile-stagger` match these values.
- **`<script setup>` only**: No Options API. `defineProps`, `defineEmits`, `watch`, `ref`, `computed`, `onMounted` from `vue`.
- **No game logic in components**: GameTile and GameBoard are purely presentational — they render what they receive via props. Logic lives in `useGameStore` and `useGameEngine`.
- **GameView is the only store consumer**: GameBoard.vue does NOT import or use `useGameStore()` directly. It receives all data as props from GameView.vue.
- **Architecture naming**: File = `GameTile.vue` (PascalCase), test file = `GameTile.test.ts` (co-located).

### Tile State Visual Specification

| State | Background | Border | Text color | Notes |
|-------|-----------|--------|-----------|-------|
| `empty` | `bg-surface` (#1a1a22) | `tile-border-empty` (#3a3a45) | — | No letter shown |
| `filled` | `bg-surface` (#1a1a22) | `tile-border-active` (#565663) | `text-primary` (#f0f0f0) | Letter shown, Inter 700, uppercase |
| `correct` | `tile-correct` (#538d4e) | same color | white (#f0f0f0) | Revealed after flip |
| `present` | `tile-present` (#b59f3b) | same color | white (#f0f0f0) | Revealed after flip |
| `absent` | `tile-absent` (#3a3a45) | same color | `text-secondary` (#a0a0aa) | Revealed after flip |

For deuteranopia mode (future story 5.2): `tile-correct` → `tile-correct-d` (#4a90d9), `tile-present` → `tile-present-d` (#e8a030). **Do not implement this yet** — just build the standard palette. The `useSettingsStore` deuteranopia flag will be wired in story 5.2.

### Tile Flip Animation Implementation

The color must change at the **50% keyframe** (when tile is face-down). Use a two-phase approach in Vue:

**Recommended approach — watch + setTimeout:**

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import type { TileState } from '@/types/game'
import { TILE_FLIP_MS, TILE_STAGGER_MS } from '@/constants/timing'

const props = defineProps<{
  letter: string
  state: TileState
  revealIndex: number
}>()

const isFlipping = ref(false)
const displayState = ref<TileState>(props.state) // tracks the "visible" state

const revealedStates: TileState[] = ['correct', 'present', 'absent']

watch(() => props.state, (newState, oldState) => {
  if (oldState === 'filled' && revealedStates.includes(newState)) {
    const delay = props.revealIndex * TILE_STAGGER_MS
    setTimeout(() => {
      isFlipping.value = true
      // At the halfway point, flip the display state
      setTimeout(() => {
        displayState.value = newState
      }, TILE_FLIP_MS / 2)
      // End of animation
      setTimeout(() => {
        isFlipping.value = false
      }, TILE_FLIP_MS)
    }, delay)
  } else {
    displayState.value = newState
  }
})
</script>
```

Use `displayState` (not `props.state`) for color classes. Use `isFlipping` to trigger the CSS animation class.

**CSS animation:**
```css
@keyframes tile-flip {
  0% { transform: rotateX(0deg); }
  50% { transform: rotateX(-90deg); }
  100% { transform: rotateX(0deg); }
}

.tile-flipping {
  animation: tile-flip v-bind('TILE_FLIP_MS + "ms"') ease-in-out;
}

/* Reduced motion: skip rotation, just swap color */
@media (prefers-reduced-motion: reduce) {
  .tile-flipping {
    animation: none;
  }
}
```

Use `perspective: 250px` on the parent (or the tile itself) to make the 3D rotation visible. Without it, rotateX looks flat.

### GameBoard Row Logic

The board always renders 6 rows × 5 tiles. Determining tile content per row:
- **Submitted rows** (index < `activeRow`): Use `tileStates[rowIndex]` for states, `guesses[rowIndex][colIndex]` for letters
- **Active row** (index === `activeRow`): Use `currentInput[colIndex]` for letter (or `''` if index ≥ `currentInput.length`); state = `'filled'` if letter exists, else `'empty'`
- **Future rows** (index > `activeRow`): All tiles are `state='empty'`, `letter=''`

### Shake Animation for Invalid Guess

```css
@keyframes row-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

.row-shaking {
  animation: row-shake 300ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .row-shaking {
    animation: none;
    border-color: var(--color-text-secondary); /* brief flash fallback */
  }
}
```

**Important**: The `invalidGuessShake` in the store auto-resets after 300ms (already implemented in `useGameStore.triggerShake()`). GameBoard watches the prop and applies the CSS class; the store handles timing. Do NOT add a `setTimeout` in the component — trust the store.

Watch `shakingRow` prop:
```ts
watch(() => props.shakingRow, (val) => {
  if (val) shakeActive.value = true
  else shakeActive.value = false
})
```

### ARIA Requirements

```html
<!-- GameBoard template structure -->
<div role="grid" aria-label="Myrdl game board" class="game-board">
  <div v-for="row in 6" :key="row" role="row" :class="...">
    <GameTile
      v-for="col in 5" :key="col"
      role="gridcell"
      ...
    />
  </div>
</div>
<div aria-live="polite" aria-atomic="true" class="sr-only" id="board-announcer"></div>
```

**GameTile ARIA:**
- `empty`: `aria-hidden="true"` (no content to announce)
- `filled`: `aria-hidden="true"` (typing feedback comes from input, not tiles)
- `correct`/`present`/`absent`: `aria-label="[LETTER], [state]"` — e.g., `aria-label="R, correct"` (UPPERCASE letter, lowercase state word)

The `sr-only` class for the announcer needs to be defined or use Tailwind's `sr-only` utility. Tailwind v4 has `sr-only` as a built-in utility class.

### GameView.vue Update

Replace the board-placeholder section. The `initGame` call uses a UTC date helper:

```ts
function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10) // "YYYY-MM-DD" UTC
}

onMounted(() => {
  store.initGame(getTodayUTC())
})
```

The `store.initGame()` sets `answerWord`, initializes `boardState` to empty, and sets `todayDate`. After this call, the board will render 6 rows of 5 empty tiles correctly.

**Updated GameView.vue template sketch:**
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
  </main>
  <!-- top-right corner preserved from story 2.1 -->
  <div class="corner-reserved"></div>
</template>
```

### File Structure — What to Create/Modify

| File | Action | Notes |
|------|--------|-------|
| `src/components/game/GameTile.vue` | **CREATE** | Remove `.gitkeep` when creating |
| `src/components/game/GameTile.test.ts` | **CREATE** | Co-located Vitest test |
| `src/components/game/GameBoard.vue` | **CREATE** | |
| `src/components/game/GameBoard.test.ts` | **CREATE** | Co-located Vitest test |
| `src/components/game/.gitkeep` | **DELETE** | Replaced by real components |
| `src/views/GameView.vue` | **MODIFY** | Add store wiring + GameBoard component |

**Do NOT create or modify:**
- `src/components/game/KeyboardKey.vue` — Story 2.3
- `src/components/game/GameKeyboard.vue` — Story 2.3
- Any store files — stores are already implemented and working
- `src/style.css` — already complete from story 2.1
- `src/App.vue` — untouched

### Testing Requirements

Use `@vue/test-utils` `mount()`. All 41 existing unit tests must continue to pass.

**GameTile.test.ts — key scenarios:**
```ts
// Test empty state
const tile = mount(GameTile, { props: { letter: '', state: 'empty', revealIndex: 0 } })
expect(tile.attributes('aria-hidden')).toBe('true')
// Verify 62x62 class or style present

// Test filled state
const tile = mount(GameTile, { props: { letter: 'a', state: 'filled', revealIndex: 0 } })
expect(tile.text()).toBe('A') // uppercase
// Verify tile-border-active class

// Test correct state
const tile = mount(GameTile, { props: { letter: 'r', state: 'correct', revealIndex: 2 } })
expect(tile.attributes('aria-label')).toBe('R, correct')
// Verify tile-correct background class
```

**GameBoard.test.ts — key scenarios:**
```ts
// Test grid structure
const board = mount(GameBoard, {
  props: {
    tileStates: [], guesses: [], currentInput: '',
    activeRow: 0, shakingRow: false
  }
})
expect(board.findAll('[role="row"]')).toHaveLength(6)
expect(board.findAll('[role="gridcell"]')).toHaveLength(30) // 6×5

// Test current input appears in active row
const board = mount(GameBoard, {
  props: { tileStates: [], guesses: [], currentInput: 'hel', activeRow: 0, shakingRow: false }
})
const activeRowTiles = board.findAll('[role="row"]')[0].findAll('[role="gridcell"]')
expect(activeRowTiles[0].text()).toBe('H')
expect(activeRowTiles[1].text()).toBe('E')
expect(activeRowTiles[2].text()).toBe('L')
```

### Previous Story Context (2.1 Learnings)

- **Tailwind v4 design tokens are in place** in `src/style.css`. Use token names directly in classes: `bg-surface`, `text-primary`, `text-secondary`, `tile-correct`, `tile-present`, `tile-absent`, `tile-border-empty`, `tile-border-active` — these all resolve via `@theme`.
- **`overflow-x: hidden`** is set on the root to prevent horizontal scroll at narrow viewports. No overflow concerns for fixed-size tiles.
- **Board area** currently has `padding-top: 10vh` and `display: flex; justify-content: center`. GameBoard should be rendered inside the existing `.board-area` div — do not change the outer layout.
- **`src/style.css`** — do not modify. All needed tokens are already there.
- **`src/App.vue`** — do not modify. It already renders `<RouterView />`.
- **41 existing unit tests** pass (game engine, stores, data pipeline). Run `npm run test:unit` after implementation.
- **`.gitkeep` files** in `src/components/game/` are safe to delete now — this story creates the real component files.

### Store API Reference (Already Implemented)

`useGameStore()` returns:
```ts
// State (read these as props for GameBoard)
boardState.value.tileStates    // GuessResult[] — tile states for each submitted row
boardState.value.guesses       // string[] — submitted words
currentInput.value             // string — letters typed in current row
activeRow.value                // number — index of active row (0–5)
invalidGuessShake.value        // boolean — true for 300ms when invalid word submitted

// Actions (NOT used in this story — story 2.4 wires keyboard)
store.initGame(date)           // Initialize game for a date — USE THIS in GameView.onMounted
store.typeChar(char)           // Add a letter — story 2.4
store.deleteLast()             // Remove a letter — story 2.4
store.submitGuess(hardMode)    // Submit — story 2.4
```

The `invalidGuessShake` auto-resets after 300ms via `triggerShake()` in the store. No setTimeout needed in components.

### Stagger Timing Note

The UX spec says "~80ms stagger" but `src/constants/timing.ts` defines `TILE_STAGGER_MS = 100`. Use **100ms** (the TypeScript constant) — it is the authoritative source. The CSS token `--duration-tile-stagger: 100ms` matches.

### Board Dimensions Reminder

From story 2.1: board placeholder is 350px wide. The grid: 5 tiles × 62px + 4 gaps × 5px = 310 + 20 = 330px. Leave 10px margin on each side within the 350px container, or set grid width to `min-content` and let the board-area `justify-content: center` handle it. Do not change the outer 350px board-area width.

Actually: 5 × 62px tiles + 4 × 5px gaps = 310 + 20 = 330px grid width. The `.board-placeholder` is 350px. GameBoard can be ~330px wide (grid with `gap: 5px`). The 10px difference centers naturally.

For rows: 6 × 62px tiles + 5 × 5px gaps = 372 + 25 = 397px tall. This is the total board height.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_None_

### Completion Notes List

- Implemented `GameTile.vue` as a purely presentational component. Uses `displayState` ref (not `props.state`) for color classes so the tile color swaps at the 50% keyframe mid-flip. `isFlipping` ref drives the CSS `tile-flip` animation. `{ immediate: true }` not needed on tile watch — only fires on state transitions.
- Implemented `GameBoard.vue` rendering 6×5 grid. `watch(shakingRow, ..., { immediate: true })` needed so shake class applies immediately when prop is already `true` on mount (important for test correctness and edge cases).
- Updated `GameView.vue`: replaced `board-placeholder` div with `<GameBoard>` wired to `useGameStore`. `onMounted` calls `initGame(getTodayUTC())`.
- Deleted `src/components/game/.gitkeep`.
- All 72 tests pass: 41 pre-existing + 17 new GameTile tests + 14 new GameBoard tests.

### File List

- `src/components/game/GameTile.vue` (created)
- `src/components/game/GameTile.test.ts` (created)
- `src/components/game/GameBoard.vue` (created)
- `src/components/game/GameBoard.test.ts` (created)
- `src/components/game/.gitkeep` (deleted)
- `src/views/GameView.vue` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)

## Change Log

- 2026-03-20: Story 2.2 created — Tile and GameBoard Components
- 2026-03-20: Story 2.2 implemented — GameTile.vue, GameBoard.vue, GameView.vue wired; 31 new tests added; all 72 tests pass
- 2026-03-20: Story 2.2 code review complete — 8 patches applied: perspective moved to .board-row, setTimeout timer leak fixed (onUnmounted cleanup + cancel-on-refire), reduced-motion instant reveal added, shake reduced-motion fallback changed to outline, aria-label empty-letter guard added, shake animationend race fixed, shakeActive watcher simplified. All 72 tests pass.
