---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
status: 'complete'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
---

# Myrdl - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Myrdl, decomposing the requirements from the PRD, UX Design Specification, and Architecture Decision Document into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: The system delivers a unique word each calendar day, consistent for that date
FR2: The system selects the daily word deterministically from a curated answer word list
FR3: The player can submit a 5-letter guess using a keyboard or on-screen input
FR4: The system validates that each guess is a real word from the valid word list before accepting it
FR5: The system reveals tile feedback (correct position, wrong position, not in word) after each guess submission
FR6: The system enforces a maximum of 6 guesses per puzzle
FR7: The player can toggle hard mode, which requires all revealed hints to be used in subsequent guesses
FR8: The system reveals the correct answer when the player exhausts all guesses without solving
FR9: The system displays the post-solve funnel immediately after the puzzle ends (solve or failure)
FR10: The funnel shows the count of valid remaining words after each guess (e.g. 2315 → 48 → 9 → 3 → 1)
FR11: The system displays an etymology card for the day's answer word after the puzzle ends
FR12: The etymology card is available for both solved and failed puzzles
FR13: The player can dismiss the post-solve screen and return to a completed board view
FR14: The system maintains a complete list of valid 5-letter guess words
FR15: The system maintains a curated answer word list (subset of valid words)
FR16: The system stores etymology data for every word in the answer word list
FR17: The system displays "No etymology available for this word" in the etymology card position when etymology data is missing for an answer word
FR18: The system tracks a private daily streak counter stored locally
FR19: The streak increments when the player solves the daily puzzle
FR20: The streak resets when the player fails to solve or misses a day
FR21: The player can view their current streak at any time
FR22: The system functions fully offline after the first online load
FR23: The system caches all required assets (application code, word list, and etymology data) after first load to enable offline use
FR24: The system persists all player data (guess history, streak, settings) locally on the device
FR25: The system restores the current day's in-progress puzzle state on page reload
FR26: The player can enable or disable hard mode
FR27: The player can enable a deuteranopia-optimized tile color scheme (blue/orange) as an alternative to the default green/amber/grey
FR28: The system stores each completed puzzle's guess sequence and funnel data locally (Phase 2)
FR29: The player can view an aggregated funnel history showing narrowing rate over time (Phase 2)
FR30: The player can view starting word effectiveness — average valid words remaining after guess 1 (Phase 2)
FR31: The player can browse past puzzles with their answer and etymology (Phase 2)

### NonFunctional Requirements

NFR1: The app shell loads and is interactive within 2 seconds on first load on standard home broadband
NFR2: The app loads and is fully playable within 500ms on subsequent visits (offline, from cache)
NFR3: Tile flip feedback after each guess submission completes within 100ms of submission
NFR4: The post-solve funnel and etymology card render within 300ms of puzzle completion
NFR5: No network requests are made during gameplay — all word data and etymology content is available offline
NFR6: All interactive elements are reachable and operable via keyboard alone
NFR7: Tile state colors (correct, present, absent) meet WCAG AA contrast ratio (4.5:1 minimum) against tile background
NFR8: The deuteranopia-optimized palette meets WCAG AA contrast ratio (4.5:1 minimum) against tile background
NFR9: Player data (streak, guess history, settings) survives browser refresh, tab close, and browser restart
NFR10: An interrupted puzzle (mid-guess, page closed) is fully restored on next load with no data loss
NFR11: The app does not require an internet connection after the first successful load
NFR12: If device storage is unavailable or corrupted, the app displays an explicit error message and renders a clean initial state — never silent corruption or incorrect state
NFR13: The date-deterministic word selection produces the same answer for a given date regardless of device timezone offset

### Additional Requirements

- **Starter template (Epic 1, Story 1):** Use `create-vue` (official Vue scaffolding) with TypeScript, Vue Router, Pinia, Vitest, Playwright, ESLint + Prettier; then add Tailwind CSS v4 via `@tailwindcss/vite` and `vite-plugin-pwa`
- **Build-time data validation:** `scripts/validate-data.ts` wired as a `prebuild` npm hook; verifies every word in `answers.json` has an entry in `etymology.json`; missing entries surface as build warnings, not runtime surprises
- **localStorage schema:** Three independent keyed entries prefixed `myrdle_` — `myrdle_settings`, `myrdle_streak`, `myrdle_game_YYYY-MM-DD`; each key independently validated on read using `safeRead<T>` pattern; corruption in one key cannot affect others
- **Static data files:** Three separate JSON files compiled at build time — `src/data/valid-words.json` (~12K words), `src/data/answers.json` (~2.3K ordered answers by day offset from epoch), `src/data/etymology.json` (~500KB, keyed by word: `{ pos, definition, origin }`)
- **Game engine architecture:** `useGameEngine` composable (pure TypeScript, zero Vue dependencies, fully Vitest-testable) owns all game logic; `useGameStore` (Pinia composition style) owns reactive state only; elimination algorithm must have unit tests before any UI component references game state
- **PostSolveTransition orchestration:** `usePostSolveTransition` composable sequences the ritual with named timing constants defined in `constants/timing.ts` — `AUTO_ADVANCE_MS`, `TILE_FLIP_MS`, `TILE_STAGGER_MS`, `BOARD_DIM_MS`; no inline timing values in component CSS or templates
- **PWA service worker:** Cache manifest must include app shell + `valid-words.json` + `answers.json` + `etymology.json` + Google Fonts (Inter + Lora); generated by `vite-plugin-pwa` (Workbox-backed)
- **TypeScript strict mode:** `any` is banned; use `unknown` + type guards at all data boundaries (localStorage reads, JSON parsing); `TileState` union type used everywhere — never raw strings
- **Boundary enforcement:** `usePersistenceStore` is the sole localStorage accessor; `useSoundManager` is called exclusively from `usePostSolveTransition`; game logic lives in composables, never in Vue components
- **Implementation sequence:** scaffold → static data pipeline → `useGameEngine` + Vitest tests → Pinia stores → UI components Layer 1–4 → `usePostSolveTransition` → PWA service worker config

### E2E Test Policy (added 2026-03-21)

Starting with Epic 5, every story that introduces or modifies a user-visible feature MUST include a task for Playwright e2e tests. The story file template should include:

- Task: Write Playwright e2e test(s) in `e2e/<feature>.spec.ts`
  - Test the primary happy path in the browser
  - Guard any build-dependent tests (SW, PWA) with `test.skip(!process.env.CI, ...)`

Stories that are purely infrastructure, data pipeline, or unit-testable composables may mark this task [N/A] with a brief note.

Story 4.5 backfills e2e coverage for all features shipped in Epics 1–4 (gameplay loop, post-solve ritual, persistence restore, streak display). This policy ensures new features are covered going forward.

### UX Design Requirements

UX-DR1: Implement dark base color system with named design tokens defined via `@theme` in a single CSS file — bg-base (#111118), bg-surface (#1a1a22), tile-correct (#538d4e), tile-present (#b59f3b), tile-absent (#3a3a45), text-primary (#f0f0f0), text-secondary (#a0a0aa), accent-streak (#9999cc)
UX-DR2: Implement deuteranopia alternative palette tokens (tile-correct-d #4a90d9, tile-present-d #e8a030) toggled live without page reload via SettingsPanel; both color pairs must meet WCAG AA (4.5:1) against bg-surface
UX-DR3: Implement dual typography system — Inter (700 uppercase) for tile letters, keyboard keys, streak counter, and UI data labels; Lora (400/700) for etymology card prose only; both fonts via Google Fonts, cached by service worker for offline use
UX-DR4: Build Tile component with 5 states (empty, filled, correct, present, absent), 62×62px, CSS 3D rotateX flip animation (~400ms per tile, face-down at 50% reveals new background color), aria-label="[letter], [state]" on revealed tiles, aria-hidden on empty tiles
UX-DR5: Build GameBoard as 6×5 CSS grid with active row tracking, row shake animation (~300ms translateX, no sound) on invalid word submission, role="grid"/role="row"/role="gridcell" ARIA structure, aria-live="polite" announcer region for tile reveals and game-end state
UX-DR6: Build KeyboardKey with 5 states (default, correct, present, absent) and wide variant for Enter/⌫, click triggers same input handler as physical keyboard, hover+active visual states, role="button" + aria-label
UX-DR7: Build GameKeyboard with 3-row layout (Q-P / A-L offset / Enter Z-M ⌫), persisting best-known letter state per key (never reverts once colored), minimum 43×58px tap targets
UX-DR8: Build FunnelBar with proportional width (count/2315 × 100%), minimum 2px visible width, tile-correct color for guess rows, accent-streak color for solve row (✓), count label inside bar when wide enough otherwise outside
UX-DR9: Build FunnelChart with 1–6 FunnelBars, fades in as a unit after board dims, role="img" with comprehensive aria-label describing all funnel values; renders gracefully with a single bar on first-run (not suppressed)
UX-DR10: Build EtymologyCard with Lora typography hierarchy (word 1.75rem 700 uppercase; POS 0.875rem italic; definition 1.0625rem line-height 1.65; origin 0.9375rem italic line-height 1.55), fallback text "No etymology on record for this word." in origin position, dismiss via Escape/Enter/click-outside, role="article" aria-label="Etymology for [word]", max-width 480px with 32px internal padding
UX-DR11: Build StreakBadge fixed top-right corner (16px from edges), accent-streak color for count > 0, text-secondary for count = 0 with no animation or shame state, aria-label="Current streak: [n] days"
UX-DR12: Build SettingsPanel as inline panel (~220px, not a modal) anchored to corner trigger, hard mode toggle disabled mid-puzzle with quiet inline note "Available after today's puzzle", deuteranopia toggle live-updates all tile colors without page reload, dismiss via Escape or click-outside
UX-DR13: Build ShortcutOverlay triggered exclusively by `?` key, full-screen dark overlay (~0.85 opacity), content centered max-width 360px, dismissed by `?`/Escape/click-outside; never shown automatically; lists: A-Z, Enter, Backspace, Space, Escape, ?
UX-DR14: Implement PostSolveTransition with exact ritual sequence — 300ms pause after last tile → bowl ring (sound leads all visual changes) → board dims to 40% opacity over 500ms → funnel fades in ~400ms with slight Y rise → 4s auto-advance timer (cancellable via Space/Enter) → etymology fades in ~400ms; Escape returns to board at any point; timer never double-fires
UX-DR15: Implement SoundManager with 2 preloaded audio clips — A bowl note (solve, ~2s decay) and E Lydian chord/E G# A# B (fail, ~2.5s decay); triggered from usePostSolveTransition before any visual change; disabled when prefers-reduced-motion: reduce
UX-DR16: Implement prefers-reduced-motion support — tile flip becomes instant color change (no 3D rotation), row shake becomes brief border-color flash (no translateX), all fade transitions reduced to ~50ms, bowl sound disabled
UX-DR17: Implement keyboard-first ritual navigation — A-Z types letters, Enter submits guess and advances post-solve, Backspace deletes last letter, Space advances post-solve sequence, Escape returns to board from any post-solve state; keyboard is always hot (no click-to-focus required)
UX-DR18: Implement failed-solve answer reveal as a quiet label beneath the board (not a modal, not a banner); funnel and etymology receive identical visual treatment as a solve; streak resets to 0 displayed as calm number with no animation
UX-DR19: Implement Void+Altar hybrid layout — board centered ~350px wide at upper-center viewport, 62×62px tiles with 5px gaps; post-solve Procession model (funnel and etymology unfold below the dimmed board in the same spatial column without navigation); streak+settings fixed top-right corner at minimal visual weight

### FR Coverage Map

FR1: Epic 2 — Date-deterministic daily word delivery
FR2: Epic 2 — Deterministic answer selection from curated list
FR3: Epic 2 — Guess submission via physical keyboard and on-screen keyboard
FR4: Epic 2 — Valid word validation against word list
FR5: Epic 2 — Tile feedback reveal (correct/present/absent)
FR6: Epic 2 — 6 guesses maximum enforcement
FR7: Epic 2 — Hard mode toggle (use revealed hints in subsequent guesses)
FR8: Epic 2 — Answer reveal on failed solve
FR9: Epic 3 — Post-solve funnel display (solve and fail)
FR10: Epic 3 — Funnel shows valid word counts per guess
FR11: Epic 3 — Etymology card for the day's answer
FR12: Epic 3 — Etymology card available for both solve and fail
FR13: Epic 3 — Dismiss post-solve screen to return to completed board
FR14: Epic 1 — Valid 5-letter guess words list compiled at build time
FR15: Epic 1 — Curated answer word list compiled at build time
FR16: Epic 1 — Etymology data for all answer words compiled at build time
FR17: Epic 3 — Missing etymology graceful fallback text
FR18: Epic 4 — Private daily streak counter stored locally
FR19: Epic 4 — Streak increments on solve
FR20: Epic 4 — Streak resets on fail or missed day
FR21: Epic 2 — View current streak (StreakBadge visible)
FR22: Epic 4 — App functions fully offline after first load
FR23: Epic 4 — All assets cached on first load for offline use
FR24: Epic 4 — All player data persisted locally
FR25: Epic 4 — In-progress puzzle restored on page reload
FR26: Epic 5 — Hard mode enable/disable setting
FR27: Epic 5 — Deuteranopia-optimized tile color scheme
FR28: Epic 6 — Store completed puzzle guess sequence and funnel data (Phase 2)
FR29: Epic 6 — Aggregated funnel history view (Phase 2)
FR30: Epic 6 — Starting word effectiveness stat (Phase 2)
FR31: Epic 6 — Past puzzle browser (Phase 2)

## Epic List

### Epic 1: Foundation and Verified Game Engine

The project is scaffolded, the static data pipeline is built and validated, and the Wordle elimination algorithm is fully unit-tested. No UI exists yet, but correctness of the core logic — elimination, date-deterministic word selection, hard mode constraints — is guaranteed before any interface is built on top of it.

**FRs covered:** FR14, FR15, FR16

### Epic 2: Playable Daily Puzzle

Lord Farquaad can open the app and play today's word puzzle to completion — typing guesses with his physical keyboard, watching tiles reveal, playing in hard mode if desired. A streak badge is visible. The app reveals the answer if he fails. The full Void+Altar layout is in place.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR21

**UX-DRs covered:** UX-DR1, UX-DR3, UX-DR4, UX-DR5, UX-DR6, UX-DR7, UX-DR11, UX-DR17, UX-DR18, UX-DR19

### Epic 3: The Post-Solve Ritual

After completing the puzzle (solve or fail), the complete ritual sequence runs automatically: bowl ring → board dims → funnel visualization → etymology card. The ritual is keyboard-navigable. Myrdl's defining differentiator — the funnel as personal performance mirror — is fully realized.

**FRs covered:** FR9, FR10, FR11, FR12, FR13, FR17

**UX-DRs covered:** UX-DR8, UX-DR9, UX-DR10, UX-DR13, UX-DR14, UX-DR15

### Epic 4: Persistence, Streak and Offline

The app remembers everything across sessions. Streak increments and resets correctly. An interrupted puzzle restores on reload. The app works fully offline after first visit. Storage corruption surfaces as a clear message — never silent breakage.

**FRs covered:** FR18, FR19, FR20, FR22, FR23, FR24, FR25

**NFRs addressed:** NFR2, NFR9, NFR10, NFR11, NFR12, NFR13

### Epic 5: Settings, Accessibility and Polish

Hard mode is toggleable (with mid-puzzle lockout), the deuteranopia palette is live-switchable, keyboard shortcuts are discoverable via `?`, and the full accessibility baseline — WCAG AA, reduced-motion support, screen reader aria — is met.

**FRs covered:** FR26, FR27

**NFRs addressed:** NFR6, NFR7, NFR8

**UX-DRs covered:** UX-DR2, UX-DR12, UX-DR13, UX-DR16

### Epic 6: Analytics and History (Phase 2)

Lord Farquaad can review his technique fingerprint — aggregated funnel history over time, starting word effectiveness, and a browser for past puzzles and their etymologies. The private performance mirror comes online.

**FRs covered:** FR28, FR29, FR30, FR31

---

## Epic 1: Foundation and Verified Game Engine — Stories

The project is scaffolded, the static data pipeline is built and validated, and the Wordle elimination algorithm is fully unit-tested. No UI exists yet, but correctness of the core logic — elimination, date-deterministic word selection, hard mode constraints — is guaranteed before any interface is built on top of it.

### Story 1.1: Project Scaffold and Toolchain Setup

As a developer,
I want the project scaffolded with the full agreed toolchain,
So that all subsequent stories have a consistent, working foundation to build on.

**Acceptance Criteria:**

**Given** an empty project directory
**When** `npm create vue@latest` is run with TypeScript, Vue Router, Pinia, Vitest, Playwright, ESLint + Prettier selected
**Then** the project directory matches the agreed structure from the architecture document

**Given** the scaffolded project
**When** Tailwind CSS v4 is added via `npm install -D tailwindcss @tailwindcss/vite` and configured in `vite.config.ts`
**Then** `@import "tailwindcss"` in `src/style.css` compiles without errors during `npm run build`

**Given** the scaffolded project
**When** `vite-plugin-pwa` is added via `npm install -D vite-plugin-pwa` and registered in `vite.config.ts`
**Then** `npm run build` produces a `dist/` folder containing a service worker file

**Given** the configured project
**When** `npm run dev` is executed
**Then** the Vite dev server starts and the default Vue app is accessible in the browser

**Given** the configured project
**When** `npm run test:unit` is executed
**Then** Vitest runs successfully (zero tests, zero failures — runner is functional)

**Given** the configured project
**When** `npm run test:e2e` is executed
**Then** Playwright runs successfully (zero tests, zero failures — runner is functional)

**Given** `package.json`
**When** the `scripts` section is reviewed
**Then** a `prebuild` script entry exists pointing to `npx tsx scripts/validate-data.ts`
**And** `npm run build` executes the prebuild script before `vite build`

---

### Story 1.2: Static Data Pipeline

As a developer,
I want the three static data files compiled, placed, and validated at build time,
So that the game engine has correct, complete input data and missing etymology entries are caught before runtime.

**Acceptance Criteria:**

**Given** a sourced valid 5-letter word list (open-source Wordle word list)
**When** it is compiled into `src/data/valid-words.json`
**Then** the file is a JSON array of lowercase 5-letter strings with no duplicates
**And** the array contains at least 10,000 entries (FR14)

**Given** a curated answer word sequence
**When** it is compiled into `src/data/answers.json`
**Then** the file is a JSON array of lowercase 5-letter strings ordered by day offset from epoch
**And** every word in `answers.json` is also present in `valid-words.json` (FR15)
**And** the array contains at least 2,000 entries

**Given** an etymology data source
**When** it is compiled into `src/data/etymology.json`
**Then** the file is a JSON object keyed by uppercase word with values of shape `{ pos: string, definition: string, origin: string }` (FR16)

**Given** `scripts/validate-data.ts` is wired as the `prebuild` hook
**When** `npm run build` is executed and every word in `answers.json` has a matching key in `etymology.json`
**Then** the build completes with no warnings or errors

**Given** `scripts/validate-data.ts` is wired as the `prebuild` hook
**When** `npm run build` is executed and one or more words in `answers.json` are missing from `etymology.json`
**Then** the build logs a warning identifying each missing word by name
**And** the build does not silently pass — the gap is visible to the developer

---

### Story 1.3: Game Engine Composable and Algorithm Tests

As a developer,
I want `useGameEngine` implemented as a pure TypeScript composable with full Vitest coverage,
So that the elimination algorithm, tile state derivation, and date logic are proven correct before any UI component depends on them.

**Acceptance Criteria:**

**Given** `src/composables/useGameEngine.ts`
**When** it is imported in a Vitest test file
**Then** it imports without error and has zero Vue dependencies (no `ref`, `computed`, or Vue imports)

**Given** `useGameEngine.isValidWord(word)`
**When** called with a word present in `valid-words.json`
**Then** it returns `true`
**When** called with a word not in `valid-words.json` or not exactly 5 letters
**Then** it returns `false` (FR4)

**Given** `useGameEngine.getTileStates(guess, answer)`
**When** called with a known guess and answer pair
**Then** it returns an array of 5 `TileState` values (`'correct' | 'present' | 'absent'`) matching expected Wordle rules (FR5)
**And** it correctly handles duplicate letters per standard Wordle behavior

**Given** `useGameEngine.getValidWordsRemaining(guesses, tileStates)`
**When** called after each guess in a known solve sequence
**Then** it returns a `number[]` representing valid word counts that strictly decreases (or holds) as guesses are added (FR10)
**And** the first value equals the full `valid-words.json` count when no guesses have been made

**Given** `useGameEngine.getAnswerForDate(date)`
**When** called with the same `YYYY-MM-DD` date string from two different timezone offsets (simulated)
**Then** it returns the identical answer word both times (NFR13)
**And** it returns a different answer for consecutive calendar dates

**Given** `useGameEngine.isHardModeValid(newGuess, previousGuesses, previousTileStates)`
**When** called with a guess that violates a revealed hard mode constraint
**Then** it returns `false` (FR7)
**When** called with a guess that satisfies all revealed constraints
**Then** it returns `true`

**Given** all unit tests for `useGameEngine`
**When** `npm run test:unit` is executed
**Then** all tests pass with zero failures

---

### Story 1.4: Pinia Stores and Persistence Schema

As a developer,
I want the three Pinia stores implemented with correct boundaries and the localStorage schema established,
So that all subsequent UI stories have reactive state and safe persistence to build on.

**Acceptance Criteria:**

**Given** `src/stores/useGameStore.ts`
**When** reviewed
**Then** it uses Pinia composition style (`defineStore` with `setup` function)
**And** it contains only reactive state (`boardState`, `activeRow`, `gamePhase`, `funnelData`) — no game logic
**And** all game logic calls are delegated to `useGameEngine` composable functions

**Given** `src/stores/useSettingsStore.ts`
**When** reviewed
**Then** it exposes `hardMode: boolean` and `deuteranopia: boolean` as reactive state
**And** it contains no localStorage access directly

**Given** `src/stores/usePersistenceStore.ts`
**When** reviewed
**Then** it is the only file in the codebase that calls `localStorage.getItem` or `localStorage.setItem`
**And** all reads use a `safeRead<T>(key, fallback)` function wrapped in try/catch
**And** it exposes a reactive `storageError: boolean` flag that is set `true` when any read fails (NFR12)

**Given** `usePersistenceStore` and the `myrdle_` key schema
**When** `myrdle_settings`, `myrdle_streak`, or `myrdle_game_YYYY-MM-DD` keys are read from localStorage
**Then** each key is validated independently — corruption in one key does not affect reads of other keys
**And** a missing or unparseable key returns the defined fallback value without throwing

**Given** `src/types/game.ts`, `src/types/persistence.ts`, and `src/types/etymology.ts`
**When** reviewed
**Then** `TileState` is defined as `'empty' | 'filled' | 'correct' | 'present' | 'absent'`
**And** `GamePhase` is defined as an enum with at minimum `PLAYING`, `WON`, `LOST` values
**And** no file in the project uses raw strings where `TileState` or `GamePhase` are appropriate

**Given** `src/constants/game.ts` and `src/constants/timing.ts`
**When** reviewed
**Then** `WORD_LENGTH`, `MAX_GUESSES`, and `EPOCH_DATE` are defined in `game.ts`
**And** `AUTO_ADVANCE_MS`, `TILE_FLIP_MS`, `TILE_STAGGER_MS`, and `BOARD_DIM_MS` are defined in `timing.ts`
**And** no component or composable contains hardcoded numeric timing values

---

## Epic 2: Playable Daily Puzzle — Stories

Lord Farquaad can open the app and play today's word puzzle to completion — typing guesses with his physical keyboard, watching tiles reveal, playing in hard mode if desired. A streak badge is visible. The app reveals the answer if he fails. The full Void+Altar layout is in place.

### Story 2.1: Design Tokens and App Layout Shell

As a player,
I want the app to open with the correct dark palette, typography, and centered board layout,
So that the visual foundation of the ritual is in place before any gameplay is wired up.

**Acceptance Criteria:**

**Given** `src/style.css`
**When** reviewed
**Then** all design tokens are defined in a Tailwind v4 `@theme` block — bg-base (#111118), bg-surface (#1a1a22), tile-correct (#538d4e), tile-present (#b59f3b), tile-absent (#3a3a45), text-primary (#f0f0f0), text-secondary (#a0a0aa), accent-streak (#9999cc) (UX-DR1)
**And** animation duration tokens are present for tile-flip, tile-stagger, board-dim, and funnel-fade

**Given** `src/style.css`
**When** reviewed
**Then** Inter and Lora are imported via Google Fonts
**And** Inter is applied to all default UI text and Lora is scoped exclusively to etymology card elements (UX-DR3)

**Given** `GameView.vue` rendered in the browser
**When** the page loads
**Then** the background is bg-base (#111118)
**And** the board placeholder is horizontally centered and positioned in the upper-center of the viewport
**And** the top-right corner has a reserved region for streak and settings (UX-DR19)
**And** no content outside the board region competes visually during the gameplay area

**Given** the app at any viewport width ≥ 400px
**When** rendered
**Then** the board area fits without horizontal scrolling and remains centered

---

### Story 2.2: Tile and GameBoard Components

As a player,
I want to see a 6×5 game board with tiles that fill as I type and flip to reveal colors on submission,
So that the core visual feedback of the puzzle is present and correct.

**Acceptance Criteria:**

**Given** `GameTile.vue` in the `empty` state
**When** rendered
**Then** it displays at 62×62px with a `tile-border-empty` border and `bg-surface` background
**And** it has `aria-hidden="true"` (UX-DR4)

**Given** `GameTile.vue` in the `filled` state (letter typed, not yet submitted)
**When** rendered
**Then** it shows the letter in Inter 700 uppercase, `text-primary`, with `tile-border-active` border (UX-DR4)

**Given** `GameTile.vue` transitioning from `filled` to `correct`, `present`, or `absent`
**When** a guess is submitted
**Then** each tile performs a CSS 3D rotateX flip animation (~400ms per tile)
**And** the background color reveals at the 50% keyframe (face-down point)
**And** tiles flip left-to-right with ~80ms stagger between each tile (UX-DR4)
**And** `aria-label="[letter], [state]"` is set on the revealed tile

**Given** `GameBoard.vue`
**When** rendered
**Then** it displays as a 6×5 CSS grid with 5px gaps between tiles
**And** it has `role="grid"` and `aria-label="Myrdl game board"`, each row has `role="row"`, each tile has `role="gridcell"` (UX-DR5)
**And** an `aria-live="polite"` announcer region exists for tile reveals and game-end state

**Given** `GameBoard.vue` and an invalid word submission
**When** the active row receives a shake trigger
**Then** the row applies a translateX shake animation (~300ms) and then resets
**And** no sound plays and no color changes occur (UX-DR5)

---

### Story 2.3: On-Screen Keyboard Component

As a player,
I want an on-screen keyboard that mirrors the state of each letter and accepts click input,
So that I can play using either the physical keyboard or the on-screen keys.

**Acceptance Criteria:**

**Given** `GameKeyboard.vue`
**When** rendered
**Then** it displays three rows: Q–P (10 keys), A–L (9 keys, inset), Enter + Z–M + ⌫
**And** Enter and ⌫ use a wide variant of `KeyboardKey.vue` (UX-DR7)

**Given** `KeyboardKey.vue` for a letter that has not been guessed
**When** rendered
**Then** it shows the default (unused) background color

**Given** `KeyboardKey.vue` for a letter with a known state (correct, present, or absent)
**When** rendered after a guess that revealed that letter's state
**Then** it displays the matching tile color (`tile-correct`, `tile-present`, or `tile-absent`)
**And** once colored, the key never reverts to a lower-information state (UX-DR7)

**Given** `KeyboardKey.vue`
**When** clicked or tapped
**Then** it triggers the same input handler as the equivalent physical key
**And** it shows a subtle hover state on mouseover and a slight active state on press (UX-DR6)
**And** it has `role="button"` and `aria-label` set to the key value or state (UX-DR6)
**And** minimum tap target size is 43×58px (UX-DR7)

---

### Story 2.4: Gameplay Loop and Physical Keyboard

As a player,
I want to type guesses with my physical keyboard, see tile reveals, and have the game enforce all rules correctly,
So that the complete daily puzzle experience works end-to-end.

**Acceptance Criteria:**

**Given** the app is loaded and `GameView.vue` is active
**When** I press any letter key (A–Z)
**Then** the letter appears immediately in the next empty tile of the active row — no click-to-focus required (FR3, UX-DR17)

**Given** a letter has been typed in the active row
**When** I press Backspace
**Then** the last typed letter is removed from the active row (UX-DR17)

**Given** the active row has 5 letters
**When** I press Enter and the word is not in `valid-words.json`
**Then** the row shakes and resets — no sound, no color change (FR4)

**Given** the active row has 5 letters
**When** I press Enter and the word is valid
**Then** tiles flip left-to-right revealing correct/present/absent states (FR5)
**And** the on-screen keyboard updates to reflect best-known states for each guessed letter
**And** `useGameStore.funnelData` is updated with the valid word count remaining after this guess (FR10)

**Given** hard mode is enabled and a previous guess revealed a correct-position letter
**When** I submit a guess that does not use that letter in that position
**Then** the guess is rejected with a row shake — the hard mode constraint is enforced (FR7)

**Given** the player submits the correct word
**When** the final tile flip completes
**Then** `gamePhase` transitions to `WON`
**And** the board remains visible in its completed state

**Given** the player submits 6 incorrect guesses
**When** the last tile flip completes
**Then** `gamePhase` transitions to `LOST`
**And** the correct answer is displayed as a quiet label beneath the board (FR8, UX-DR18)
**And** no punitive color, animation, or messaging is applied

**Given** the game is in `WON` or `LOST` phase
**When** the player presses any letter key
**Then** no input is accepted — the board is locked (FR6)

---

### Story 2.5: Streak Badge

As a player,
I want to see my current streak in the top-right corner,
So that the quiet motivator is present from the very first session.

**Acceptance Criteria:**

**Given** `StreakBadge.vue`
**When** rendered
**Then** it is fixed in the top-right corner, 16px from the top and right edges (UX-DR11)
**And** it has `aria-label="Current streak: [n] days"` (UX-DR11)

**Given** the streak value is greater than 0
**When** `StreakBadge.vue` renders
**Then** the count is displayed in `accent-streak` (#9999cc) color using Inter 700 (UX-DR11)

**Given** the streak value is 0
**When** `StreakBadge.vue` renders
**Then** the count "0" is displayed in `text-secondary` color with no animation, badge, or urgency encoding (FR21, UX-DR11)

**Given** `usePersistenceStore` reads `myrdle_streak` from localStorage
**When** the key is present and valid
**Then** `StreakBadge.vue` displays the stored count on load

**Given** `usePersistenceStore` reads `myrdle_streak` from localStorage
**When** the key is missing or corrupted
**Then** `StreakBadge.vue` displays 0 — no error shown for this field specifically

---

## Epic 3: The Post-Solve Ritual — Stories

After completing the puzzle (solve or fail), the complete ritual sequence runs automatically: bowl ring → board dims → funnel visualization → etymology card. The ritual is keyboard-navigable. Myrdl's defining differentiator — the funnel as personal performance mirror — is fully realized.

### Story 3.1: SoundManager

As a player,
I want the correct ritual sound to play the moment the puzzle ends — before anything else moves,
So that the bowl ring is the sensory signal that separates gameplay from reflection.

**Acceptance Criteria:**

**Given** `src/composables/useSoundManager.ts`
**When** reviewed
**Then** it preloads two audio clips at initialization — one for solve (A bowl note) and one for fail (E Lydian chord)
**And** it exposes a `trigger(outcome: 'won' | 'lost')` function that plays the corresponding clip
**And** it contains no Vue template dependencies — pure composable (UX-DR15)

**Given** `useSoundManager.trigger('won')` is called
**When** the A bowl clip plays
**Then** audio begins within 50ms of the call
**And** no visual change has occurred yet — sound fires before any post-solve visual update (UX-DR14)

**Given** `useSoundManager.trigger('lost')` is called
**When** the E Lydian chord plays
**Then** the fail clip plays — a different sound from the solve clip, same instrument (UX-DR15)

**Given** the OS or browser `prefers-reduced-motion: reduce` setting is active
**When** `useSoundManager.trigger()` is called
**Then** no audio plays — sound is disabled alongside motion (UX-DR15, UX-DR16)

**Given** `useSoundManager`
**When** searching the codebase for calls to `trigger()`
**Then** it is called only from `usePostSolveTransition` — never from components, stores, or other composables (Architecture boundary)

---

### Story 3.2: FunnelChart and FunnelBar Components

As a player,
I want to see a proportional funnel visualization of how the solution space narrowed with each guess,
So that the shape of my solve — or my fail — is readable at a glance before I read a single number.

**Acceptance Criteria:**

**Given** `FunnelBar.vue` with a word count and total starting count
**When** rendered
**Then** its width is proportional — `(count / 2315) * 100%` — and never less than 2px wide (UX-DR8)
**And** guess rows use `tile-correct` (#538d4e) fill color (UX-DR8)
**And** the solving row (✓) uses `accent-streak` (#9999cc) fill color (UX-DR8)
**And** the count label appears inside the bar when the bar is wide enough, outside when too narrow (UX-DR8)

**Given** `FunnelChart.vue` after a successful solve in N guesses
**When** rendered
**Then** it displays N guess bars plus one ✓ row for the solving guess (FR9, FR10)
**And** each bar's width accurately encodes the valid word count remaining after that guess

**Given** `FunnelChart.vue` after a failed solve (6 guesses, no solution)
**When** rendered
**Then** it displays 6 bars with no ✓ row (FR9, FR10)
**And** wide bars on a hard word communicate vocabulary gap visually — no text explanation needed

**Given** `FunnelChart.vue` on a player's very first session (one data point)
**When** rendered
**Then** a single bar renders normally — not suppressed, not replaced with a placeholder (UX-DR9)

**Given** `FunnelChart.vue`
**When** reviewed for accessibility
**Then** it has `role="img"` and `aria-label` that describes all funnel values — e.g. "Solve funnel: 2315 words after guess 1, 48 after guess 2, solved on guess 3" (UX-DR9)

---

### Story 3.3: EtymologyCard Component

As a player,
I want to read the etymology of today's answer word in a calm, book-quality card,
So that the ritual ends with a moment of vocabulary discovery regardless of whether I solved or failed.

**Acceptance Criteria:**

**Given** `EtymologyCard.vue` with a valid etymology entry
**When** rendered
**Then** the answer word is displayed in Lora 700 uppercase at 1.75rem (UX-DR10)
**And** the part of speech is displayed in Lora 400 italic at 0.875rem in `text-secondary` (UX-DR10)
**And** the definition is displayed in Lora 400 at 1.0625rem with line-height 1.65 (UX-DR10)
**And** the origin is displayed in Lora 400 italic at 0.9375rem with line-height 1.55 (UX-DR10)
**And** the card has max-width 480px and 32px internal padding, horizontally centered (UX-DR10)

**Given** `EtymologyCard.vue` when the etymology entry for today's word is missing
**When** rendered
**Then** the text "No etymology on record for this word." appears in the origin position in Lora italic (FR17, UX-DR10)
**And** the card layout is identical to a card with data — no broken state, no missing section

**Given** `EtymologyCard.vue` is visible
**When** the player presses Escape or Enter
**Then** the card dismisses and the completed board is returned to full opacity (FR13)

**Given** `EtymologyCard.vue` is visible
**When** the player clicks anywhere outside the card
**Then** the card dismisses and the completed board is returned to full opacity (FR13)

**Given** `EtymologyCard.vue`
**When** reviewed for accessibility
**Then** it has `role="article"` and `aria-label="Etymology for [WORD]"` (UX-DR10)
**And** the card receives focus when it appears so keyboard users can read it without additional navigation

**Given** `EtymologyCard.vue`
**When** reviewed
**Then** Lora font is used exclusively within this component — no other component in the project uses Lora (UX-DR3)

---

### Story 3.4: PostSolveTransition Orchestration

As a player,
I want the post-solve ritual to run itself automatically — bowl, dimming board, funnel, etymology — without me having to navigate anywhere,
So that the transition from play to reflection is seamless and the sequence is the experience.

**Acceptance Criteria:**

**Given** `gamePhase` transitions to `WON` or `LOST`
**When** the last tile flip animation completes (~300ms pause after)
**Then** `usePostSolveTransition` triggers `useSoundManager` — sound fires before any visual change (UX-DR14)

**Given** the sound has triggered
**When** 0ms after the sound call
**Then** the board begins dimming to 40% opacity over `BOARD_DIM_MS` (500ms) (UX-DR14)

**Given** the board has dimmed
**When** the dim transition completes
**Then** `FunnelChart` fades in over ~400ms with a slight upward Y rise (UX-DR14)

**Given** `FunnelChart` is visible
**When** `AUTO_ADVANCE_MS` (4 seconds) elapse with no user input
**Then** `EtymologyCard` automatically fades in — the ritual completes itself (UX-DR14, FR11, FR12)

**Given** `FunnelChart` is visible and the auto-advance timer is running
**When** the player presses Space or Enter
**Then** the timer cancels immediately and `EtymologyCard` fades in (UX-DR14)
**And** the timer does not fire again after manual advance — never double-fires (UX-DR14)

**Given** the player is at any point in the post-solve sequence (funnel or etymology visible)
**When** the player presses Escape
**Then** the post-solve sequence ends and the completed board is returned to full opacity (FR13, UX-DR14)

**Given** `usePostSolveTransition.ts`
**When** reviewed
**Then** all timing values reference named constants from `src/constants/timing.ts`
**And** no numeric millisecond values are hardcoded in the composable or its template (Architecture)

---

## Epic 4: Persistence, Streak and Offline — Stories

The app remembers everything across sessions. Streak increments and resets correctly. An interrupted puzzle restores on reload. The app works fully offline after first visit. Storage corruption surfaces as a clear message — never silent breakage.

### Story 4.1: Game State Persistence and Restore

As a player,
I want my puzzle progress saved automatically and restored when I return to the app,
So that a page reload, tab close, or browser restart never loses my in-progress or completed game.

**Acceptance Criteria:**

**Given** the player has typed letters into the active row but not submitted
**When** the page is reloaded
**Then** the board restores with all previously submitted rows intact and the active row cleared to empty (FR25, NFR10)
**And** the game phase is `PLAYING` — the puzzle continues from where it left off

**Given** the player has completed today's puzzle (WON or LOST)
**When** the page is reloaded
**Then** the board restores in its completed state with all guesses visible (FR24, NFR9)
**And** the game phase is `WON` or `LOST` — no new input is accepted

**Given** `usePersistenceStore` writing `myrdle_game_YYYY-MM-DD`
**When** any guess is submitted
**Then** the key is written immediately — not deferred or batched (NFR10)
**And** the stored value includes `guesses: string[]`, `solved: boolean`, and `funnelData: number[]`

**Given** the player opens the app on a new calendar day
**When** `usePersistenceStore` reads game state
**Then** no previous day's game key is loaded for today's puzzle — a fresh board is presented (FR1)
**And** previous day keys remain in localStorage untouched (for Phase 2 analytics)

**Given** `usePersistenceStore` reads `myrdle_game_YYYY-MM-DD`
**When** the key is missing (first time today)
**Then** a clean initial board state is returned with no error (FR25)

---

### Story 4.2: Streak Logic

As a player,
I want my streak to increment when I solve and reset when I fail or miss a day,
So that the quiet motivator reflects my actual daily practice accurately.

**Acceptance Criteria:**

**Given** the player solves today's puzzle
**When** `gamePhase` transitions to `WON`
**Then** `usePersistenceStore` increments `myrdle_streak.count` by 1 and sets `lastSolvedDate` to today's UTC date (FR19)
**And** `StreakBadge.vue` updates to reflect the new count immediately

**Given** the player fails today's puzzle (6 guesses, no solve)
**When** `gamePhase` transitions to `LOST`
**Then** `usePersistenceStore` resets `myrdle_streak.count` to 0 (FR20)
**And** `StreakBadge.vue` displays 0 calmly — no animation, no shame state (UX-DR11)

**Given** the player opens the app and `myrdle_streak.lastSolvedDate` is not yesterday or today in UTC
**When** the streak is read on load
**Then** `myrdle_streak.count` is reset to 0 — a missed day breaks the streak (FR20)

**Given** streak date comparison logic
**When** the player's device is in any timezone
**Then** "today" and "yesterday" are always evaluated in UTC — not local time — so a midnight timezone edge case cannot incorrectly reset or preserve the streak (NFR13)

**Given** the player solves the puzzle and the streak increments
**When** the page is reloaded
**Then** the incremented streak count is still displayed — it persisted correctly (FR18, NFR9)

---

### Story 4.3: PWA Service Worker and Offline Caching

As a player,
I want the app to load instantly and work completely offline after my first visit,
So that my morning ritual is never blocked by network availability.

**Acceptance Criteria:**

**Given** the player visits the app for the first time on a live connection
**When** the page finishes loading
**Then** the service worker installs silently in the background — no progress indicator, no "installing" UI (FR23, UX Journey 3)
**And** `valid-words.json`, `answers.json`, `etymology.json`, and Google Fonts (Inter + Lora) are all cached

**Given** the service worker has been installed on a previous visit
**When** the player opens the app with no network connection
**Then** the app shell loads and is fully playable — board, keyboard, word validation, tile reveals all function (FR22, NFR11)
**And** the etymology card displays correctly using cached data

**Given** the app loads from the service worker cache
**When** measured from navigation start to interactive
**Then** load time is within 500ms (NFR2)

**Given** `vite.config.ts` PWA configuration
**When** reviewed
**Then** the cache manifest explicitly includes the app shell, `valid-words.json`, `answers.json`, `etymology.json`, and Google Fonts URLs
**And** the service worker is generated by `vite-plugin-pwa` (Workbox-backed)

**Given** `npm run preview` serving the production `dist/`
**When** Chrome DevTools Network tab is set to Offline after first load
**Then** a full page reload serves the app entirely from cache — zero network requests (NFR5, NFR11)

---

### Story 4.4: Storage Corruption Handling

As a player,
I want the app to tell me clearly if my saved data can't be read, and still show me a working board,
So that a storage failure never leaves me with a broken or silently incorrect game state.

**Acceptance Criteria:**

**Given** `localStorage.getItem('myrdle_streak')` returns a malformed JSON string
**When** `usePersistenceStore` reads the key via `safeRead`
**Then** `storageError` is set to `true`
**And** the streak falls back to its default value (`{ count: 0, lastSolvedDate: null }`)
**And** no unhandled exception is thrown (NFR12)

**Given** `localStorage.getItem('myrdle_game_YYYY-MM-DD')` returns a malformed JSON string
**When** `usePersistenceStore` reads the key
**Then** `storageError` is set to `true`
**And** a clean initial board state is returned — not an incorrect or partial state (NFR12)

**Given** `storageError` is `true` in `usePersistenceStore`
**When** `GameView.vue` renders
**Then** a visible error message is displayed: "Unable to load saved data — your progress may be affected" (NFR12)
**And** the board renders in a clean, playable initial state — the error does not block gameplay

**Given** `storageError` is `false`
**When** `GameView.vue` renders
**Then** no error message is shown — the error UI is invisible under normal conditions

**Given** `myrdle_settings` is corrupted but `myrdle_streak` is valid
**When** both keys are read
**Then** only `myrdle_settings` falls back to defaults — `myrdle_streak` reads correctly
**And** `storageError` is set to `true` (corruption in one key does not suppress reporting)

---

### Story 4.5: Core Gameplay e2e Test Coverage

As a developer,
I want Playwright smoke tests covering all shipped core user flows,
so that regressions in gameplay, post-solve ritual, persistence, and streak are caught before they reach users.

**Acceptance Criteria:**

**Given** the player types a valid 5-letter word and presses Enter
**When** the first row resolves
**Then** all 5 tiles in row 1 have a revealed state class (correct, present, or absent)

**Given** the player solves the puzzle (types the correct answer and presses Enter)
**When** the win state triggers
**Then** a win message or post-solve overlay is visible in the DOM

**Given** the puzzle has been solved and the post-solve ritual runs
**When** the transition completes
**Then** both FunnelChart and EtymologyCard are rendered in the DOM

**Given** the player has typed 2 letters into the current guess row
**When** the page is reloaded
**Then** those 2 tiles are still present in row 1 (persistence restore from localStorage)

**Given** the player solves today's puzzle
**When** the post-solve state renders
**Then** StreakBadge shows a count ≥ 1

---

## Epic 5: Settings, Accessibility and Polish — Stories

Hard mode is toggleable (with mid-puzzle lockout), the deuteranopia palette is live-switchable, keyboard shortcuts are discoverable via `?`, and the full accessibility baseline — WCAG AA, reduced-motion support, screen reader aria — is met.

### Story 5.1: SettingsPanel and Hard Mode Toggle

As a player,
I want to toggle hard mode from a peripheral corner panel without interrupting my puzzle,
So that I can configure my daily ritual without the settings ever competing with the board.

**Acceptance Criteria:**

**Given** a small trigger icon in the top-right corner area
**When** the player clicks it
**Then** `SettingsPanel.vue` opens as an inline panel (~220px wide) anchored below/beside the trigger — not a centered modal (FR26, UX-DR12)

**Given** `SettingsPanel.vue` is open and no puzzle is in progress today
**When** the player toggles the hard mode switch
**Then** `useSettingsStore.hardMode` toggles immediately
**And** the new value is persisted to `myrdle_settings` via `usePersistenceStore` (FR26)

**Given** `SettingsPanel.vue` is open and a puzzle is already in progress today
**When** the player views the hard mode toggle
**Then** the toggle is non-interactive and displays the quiet inline note "Available after today's puzzle" (FR26, UX-DR12)

**Given** `SettingsPanel.vue` is open
**When** the player presses Escape or clicks outside the panel
**Then** the panel closes and focus returns to the board (UX-DR12)

**Given** `useSettingsStore.hardMode` is `true` and a puzzle is in progress
**When** the player submits a guess that violates a revealed hard mode constraint
**Then** the guess is rejected (enforced via `useGameEngine.isHardModeValid` — already wired in Epic 2 Story 2.4)

---

### Story 5.2: Deuteranopia Palette Toggle

As a player,
I want to switch to a blue/orange tile color scheme that works with my color vision,
So that tile state feedback is always unambiguous regardless of how I perceive red-green hues.

**Acceptance Criteria:**

**Given** `src/style.css` `@theme` block
**When** reviewed
**Then** `tile-correct-d` (#4a90d9) and `tile-present-d` (#e8a030) tokens are defined (UX-DR2)
**And** both colors achieve at least 4.5:1 contrast ratio against `bg-surface` (#1a1a22) (NFR8)

**Given** `SettingsPanel.vue` with a colour scheme toggle (Standard / Deuteranopia)
**When** the player switches to Deuteranopia
**Then** all correct-position tiles and keyboard keys immediately switch to `tile-correct-d` (blue) (FR27)
**And** all present-but-wrong-position tiles and keyboard keys immediately switch to `tile-present-d` (orange) (FR27)
**And** no page reload occurs — the change is live (UX-DR2)

**Given** the deuteranopia setting is enabled
**When** the page is reloaded
**Then** the deuteranopia palette is still active — the preference persisted in `myrdle_settings` (FR24)

**Given** the player switches back to the Standard palette
**When** the toggle is set to Standard
**Then** all tile and keyboard key colors revert to the default palette immediately

---

### Story 5.3: ShortcutOverlay and Keyboard Navigation Audit

As a player,
I want to discover all keyboard shortcuts via `?` and complete my entire daily ritual without touching a mouse,
So that the app rewards keyboard fluency and never requires pointer input.

**Acceptance Criteria:**

**Given** the player presses `?` at any point during gameplay or post-solve
**When** the ShortcutOverlay renders
**Then** a full-screen dark overlay (~0.85 opacity) appears with a centered content block (max-width 360px) listing all shortcuts (UX-DR13)

**Given** `ShortcutOverlay.vue` content
**When** reviewed
**Then** it lists: A–Z (type letter), Enter (submit guess / advance post-solve), Backspace (delete last letter), Space (advance post-solve), Escape (return to board), ? (show/hide overlay) (UX-DR13)

**Given** `ShortcutOverlay.vue` is visible
**When** the player presses `?`, Escape, or clicks outside
**Then** the overlay closes (UX-DR13)
**And** `ShortcutOverlay` is never shown automatically — always user-initiated (UX-DR13)

**Given** a complete daily ritual (load → type guesses → submit → post-solve → etymology → dismiss)
**When** performed using only the physical keyboard
**Then** every step completes without requiring a mouse click (NFR6, UX-DR17)
**And** keyboard focus is never lost or trapped in an unescapable state

**Given** `SettingsPanel.vue` and `ShortcutOverlay.vue`
**When** open and navigated by keyboard
**Then** focus is trapped within each overlay while open
**And** focus returns to the board or its previous location on dismiss (UX-DR12, UX-DR13)

---

### Story 5.4: Accessibility Audit and Reduced-Motion Support

As a player,
I want the app to respect my motion preferences and be fully usable by screen readers,
So that the experience is accessible regardless of sensory or motor constraints.

**Acceptance Criteria:**

**Given** `@media (prefers-reduced-motion: reduce)` is active
**When** a guess is submitted
**Then** tile flip plays no 3D rotation — tile color changes instantly (UX-DR16)

**Given** `@media (prefers-reduced-motion: reduce)` is active
**When** an invalid word is submitted
**Then** the row shake animation is suppressed — a brief `border-color` flash is applied instead (UX-DR16)

**Given** `@media (prefers-reduced-motion: reduce)` is active
**When** the post-solve sequence runs
**Then** all fade transitions complete in ~50ms (near-instant) (UX-DR16)
**And** `useSoundManager` plays no audio — sound is disabled alongside motion (UX-DR15, UX-DR16)

**Given** all tile states on the board (correct, present, absent)
**When** contrast ratios are measured against `bg-surface` (#1a1a22)
**Then** `tile-correct` (#538d4e) achieves ≥ 4.5:1 (NFR7)
**And** `tile-present` (#b59f3b) achieves ≥ 4.5:1 (NFR7)
**And** `tile-correct-d` (#4a90d9) achieves ≥ 4.5:1 (NFR8)
**And** `tile-present-d` (#e8a030) achieves ≥ 4.5:1 (NFR8)

**Given** `GameBoard.vue`, `FunnelChart.vue`, and `EtymologyCard.vue`
**When** reviewed for screen reader compatibility
**Then** `GameBoard` has `role="grid"`, rows have `role="row"`, tiles have `role="gridcell"` and `aria-label="[letter], [state]"` on revealed cells (UX-DR5)
**And** `FunnelChart` has `role="img"` with a complete `aria-label` describing all funnel values (UX-DR9)
**And** `EtymologyCard` has `role="article"` and `aria-label="Etymology for [WORD]"` (UX-DR10)
**And** an `aria-live="polite"` region announces tile reveals and game-end state changes (UX-DR5)

**Given** keyboard focus rings
**When** any interactive element receives focus via keyboard (Tab or arrow keys)
**Then** a visible `focus-visible` outline is shown using `accent-streak` color (UX-DR12)
**And** `:focus:not(:focus-visible)` has no outline — mouse clicks do not show focus rings

### Story 5.5: Etymology Schema and Card Enrichment

As Lord Farquaad,
I want the etymology card to display richer word information — including when the word first appeared, how its form evolved, related words, and a joke —
So that the post-solve ritual delivers genuine delight and linguistic discovery, not a placeholder.

**Acceptance Criteria:**

**Given** the `EtymologyEntry` interface in `src/types/etymology.ts`
**When** the dev inspects it
**Then** it defines 7 fields: `pos`, `definition`, `origin`, `firstUsed`, `evolution`, `relatedWords` (string[]), and `joke` — all required

**Given** an `EtymologyEntry` with all 7 fields populated
**When** `EtymologyCard` renders
**Then** it displays `firstUsed`, `evolution`, `relatedWords`, and `joke` in addition to the existing `pos`, `definition`, and `origin`

**Given** an entry where `firstUsed`, `evolution`, `relatedWords`, and/or `joke` are empty strings or empty array (current data shape)
**When** `EtymologyCard` renders
**Then** only populated fields are shown — no blank sections, no layout breakage

**Given** the updated `EtymologyCard.test.ts` with an enriched mock entry
**When** tests run
**Then** there are passing tests for: `firstUsed` renders, `evolution` renders, `relatedWords` renders (with "Related:" prefix), `joke` renders (with 😄 prefix), and graceful fallback when new fields are absent

**Given** no changes to `etymology.json`
**When** the full test suite runs
**Then** all pre-existing tests continue to pass

**Note:** This is Story A of a two-part effort. Story B (data regeneration) will populate the new fields across all ~9,260 entries. This story ships the schema and component changes only; `etymology.json` is untouched.

---

### Story 5.6: Etymology Data Regeneration

As Lord Farquaad,
I want `etymology.json` to be fully enriched with real definitions, origins, first-use eras, evolution notes, related words, and jokes for every answer word,
So that the post-solve etymology card delivers the genuine linguistic delight it was designed for, with no placeholder stubs remaining.

**Acceptance Criteria:**

**Given** the `scripts/enrich-etymology.ts` script
**When** run with a valid `ANTHROPIC_API_KEY` environment variable
**Then** it reads the 2,315 stub entries from `src/data/etymology.json`, calls the Claude API in batches, and writes enriched entries back to `src/data/etymology.json`

**Given** the enrichment script
**When** a batch call succeeds
**Then** each enriched entry contains non-empty values for all 7 fields: `pos`, `definition`, `origin`, `firstUsed`, `evolution`, `relatedWords` (non-empty array), and `joke`

**Given** the enrichment script is interrupted mid-run
**When** re-run
**Then** it skips already-enriched entries and continues from where it left off (resume-safe via a progress cache file)

**Given** the fully enriched `src/data/etymology.json`
**When** `npm run test:unit` runs
**Then** all data-integrity tests pass, including the TODO assertions added in Story 5.5 (now activated) confirming all 7 fields are non-empty on every entry

**Given** the enriched data
**When** `npm run validate-data` runs
**Then** every answer word still has a valid etymology entry — no regressions

**Note:** This is Story B of a two-part effort. Story A (5.5) shipped the schema and card changes. This story populates the data. The `@anthropic-ai/sdk` package is added as a dev dependency for the enrichment script only — it is never imported in app source code.

---

## Epic 6: Analytics and History — Stories

Lord Farquaad can review his technique fingerprint — aggregated funnel history over time, starting word effectiveness, and a browser for past puzzles and their etymologies. The private performance mirror comes online.

### Story 6.1: Analytics Data Foundation

As a player,
I want each completed puzzle's data to be available for aggregation,
So that the analytics views have reliable historical data to draw from without any schema migration.

**Acceptance Criteria:**

**Given** `usePersistenceStore` after Epic 4 is complete
**When** reviewed
**Then** every `myrdle_game_YYYY-MM-DD` entry already includes `guesses: string[]`, `solved: boolean`, and `funnelData: number[]` — no schema change required (FR28)

**Given** `AnalyticsView.vue`
**When** the player navigates to the analytics route
**Then** the view loads and renders without error (route wired via Vue Router)

**Given** a utility function that reads all `myrdle_game_*` keys from localStorage
**When** called
**Then** it returns an array of `DailyGameRecord` objects sorted by date ascending
**And** it skips and ignores any malformed or unreadable keys without throwing

---

### Story 6.2: Aggregated Funnel History View

As a player,
I want to see how my solution-space elimination has trended over my last N sessions,
So that I can identify whether my technique is improving, stalling, or changing shape.

**Acceptance Criteria:**

**Given** the player has at least 2 completed puzzle records
**When** the Funnel History section of `AnalyticsView.vue` renders
**Then** it displays each session's funnel data in chronological order (FR29)
**And** the visual representation makes narrowing trends readable across sessions — shape before data

**Given** the player has only 1 completed puzzle record
**When** the Funnel History section renders
**Then** a single session is shown with a graceful note that more data will appear over time — not suppressed, not broken

**Given** the player has no completed puzzle records
**When** the Funnel History section renders
**Then** an empty state is shown: "Play your first puzzle to start building your history."

---

### Story 6.3: Starting Word Effectiveness Stat

As a player,
I want to see how effective my opening guess has been on average,
So that I can understand whether my starter is a strategic strength or a drag on my funnel.

**Acceptance Criteria:**

**Given** the player has at least 5 completed puzzle records with funnel data
**When** the Starting Word Effectiveness section renders
**Then** it displays the average valid words remaining after guess 1 across all sessions (FR30)
**And** it displays the player's most frequently used opening word

**Given** the player has fewer than 5 completed puzzle records
**When** the Starting Word Effectiveness section renders
**Then** a note is shown indicating how many more sessions are needed before the stat is meaningful — not a broken or zero value

---

### Story 6.4: Past Puzzle Browser

As a player,
I want to browse my past puzzles — their answers, my guesses, and the etymology — to revisit the words I've encountered,
So that vocabulary retention is reinforced beyond the single moment of the etymology card.

**Acceptance Criteria:**

**Given** the player has completed at least one puzzle
**When** the Past Puzzles section of `AnalyticsView.vue` renders
**Then** a list of past puzzle dates is shown in reverse chronological order (FR31)
**And** each entry shows: the date, the answer word, whether it was solved or failed, and guess count

**Given** the player selects a past puzzle entry
**When** the detail view renders
**Then** the complete guess sequence is shown with tile state colors
**And** the etymology card for that answer word is displayed (FR31)
**And** if etymology data is missing for that word, the fallback text is shown — same as the live card

**Given** the past puzzle browser
**When** reviewed
**Then** it reads exclusively from `myrdle_game_*` localStorage keys via `usePersistenceStore` — no new data model required

---

### Story 6.5: Accessibility Color Fix and Secondary Indicators

As a colorblind player,
I want tile and keyboard colors to be distinguishable through more than color alone,
So that I can play the game without relying on color perception to understand tile feedback.

**Acceptance Criteria:**

**Given** the deuteranopia palette toggle is enabled
**When** tiles display correct-position and wrong-position states
**Then** the colors provide sufficient contrast that a deuteranopic user can distinguish the two states without side-by-side comparison

**Given** the game board after a guess is submitted
**When** tiles reveal their feedback state
**Then** a secondary shape indicator (e.g. checkmark for correct, dot for present) is visible on each tile — not relying on color alone

**Given** the on-screen keyboard
**When** keys update to reflect used/unused/correct/present/absent states
**Then** lighter keys indicate available (unused) letters and darker keys indicate eliminated letters — matching the intuitive expectation that lighter = available

**Given** both normal and deuteranopia modes
**When** only one color state (e.g. only yellow/present tiles) appears on screen with no contrasting state visible
**Then** the secondary indicator makes the tile state unambiguous without needing a second color for comparison

---

### Story 6.6: Post-Solve Layout and Music Toggle

As a player,
I want the post-solve experience to fit on one screen without scrolling,
So that I can see the funnel, board, and etymology simultaneously after solving.

**Acceptance Criteria:**

**Given** a completed puzzle on a desktop viewport (>= 1024px wide)
**When** the post-solve transition completes
**Then** a three-column layout is displayed: funnel chart (left), game board collapsed to winning row (center), etymology card (right)
**And** no vertical scrolling is required to see all post-solve content

**Given** a completed puzzle on a narrow viewport (< 1024px)
**When** the post-solve transition completes
**Then** the layout falls back to the current vertical stacked arrangement (board, funnel, etymology)

**Given** the game header
**When** the page loads
**Then** a visible music on/off toggle button (speaker icon) is displayed
**And** music is off by default
**And** tapping the toggle starts or stops background music immediately

**Given** the post-solve board on desktop
**When** the transition completes
**Then** the board collapses to show only the winning row (or final failed row), freeing vertical space for the three-column layout

---

### Story 6.7: Theme Toggle and OS Theme Responsiveness

As a player,
I want the app to respect my OS light/dark mode preference or let me toggle it manually,
So that the app appearance matches my environment and is comfortable to use.

**Acceptance Criteria:**

**Given** the app loads for the first time
**When** the OS is set to light mode
**Then** the app renders in light mode

**Given** the app loads for the first time
**When** the OS is set to dark mode
**Then** the app renders in dark mode

**Given** the settings panel
**When** the player selects a theme option (light, dark, or system)
**Then** the app immediately switches to the selected theme
**And** the preference is persisted across sessions

**Given** the player has selected "system" theme
**When** the OS theme changes (e.g. from dark to light)
**Then** the app responds in real time without requiring a page refresh
