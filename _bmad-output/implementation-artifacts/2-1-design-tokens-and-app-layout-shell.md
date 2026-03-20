# Story 2.1: Design Tokens and App Layout Shell

Status: done

## Story

As a player,
I want the app to open with the correct dark palette, typography, and centered board layout,
so that the visual foundation of the ritual is in place before any gameplay is wired up.

## Acceptance Criteria

1. **Given** `src/style.css`, **When** reviewed, **Then** all design tokens are defined in a Tailwind v4 `@theme` block — bg-base (#111118), bg-surface (#1a1a22), tile-correct (#538d4e), tile-present (#b59f3b), tile-absent (#3a3a45), text-primary (#f0f0f0), text-secondary (#a0a0aa), accent-streak (#9999cc) **(UX-DR1)** **And** animation duration tokens are present for tile-flip (400ms), tile-stagger (100ms), board-dim (500ms), and funnel-fade (300ms)

2. **Given** `src/style.css`, **When** reviewed, **Then** Inter and Lora are imported via Google Fonts **And** Inter is applied to all default UI text and Lora is scoped exclusively to etymology card elements via a utility class or selector (UX-DR3)

3. **Given** `GameView.vue` rendered in the browser, **When** the page loads, **Then** the background is bg-base (#111118) **And** the board placeholder is horizontally centered and positioned in the upper-center of the viewport **And** the top-right corner has a reserved region for streak and settings (UX-DR19) **And** no content outside the board region competes visually during gameplay

4. **Given** the app at any viewport width ≥ 400px, **When** rendered, **Then** the board area fits without horizontal scrolling and remains centered

## Tasks / Subtasks

- [x] Task 1: Update `src/style.css` with Google Fonts and `@theme` design tokens (AC: 1, 2)
  - [x] 1.1: Add Google Fonts `@import` for Inter (weights 400, 500, 700) and Lora (weights 400, 700) before the tailwindcss import
  - [x] 1.2: Add `@theme` block with all color tokens using `--color-` prefix: bg-base, bg-surface, tile-border-empty (#3a3a45), tile-border-active (#565663), tile-correct, tile-present, tile-absent, text-primary, text-secondary, accent-streak, tile-correct-d (#4a90d9), tile-present-d (#e8a030)
  - [x] 1.3: Add `@theme` block duration tokens using `--duration-` prefix: tile-flip (400ms), tile-stagger (100ms), board-dim (500ms), funnel-fade (300ms)
  - [x] 1.4: Apply Inter as the default font on `body` or `:root`; add a `.etymology` utility class or `[data-etymology]` selector that scopes Lora to etymology card elements

- [x] Task 2: Implement layout shell in `src/views/GameView.vue` (AC: 3, 4)
  - [x] 2.1: Set full-viewport height with `bg-base` background
  - [x] 2.2: Center board placeholder horizontally; position it in the upper-center of the viewport (not vertically centered — upper-center means roughly top 40% of viewport)
  - [x] 2.3: Add top-right reserved corner region (`position: fixed` or flex/absolute) at 16px from edges — empty div with comment `<!-- StreakBadge + SettingsPanel wired in 2.5 -->`
  - [x] 2.4: Board placeholder is ~350px wide; verify no horizontal scroll at 400px viewport width

## Dev Notes

### Critical Constraints
- **Tailwind CSS v4 syntax**: No `tailwind.config.js` — all tokens live in `@theme` in `src/style.css`. Token naming convention from architecture: `--color-tile-correct`, `--duration-tile-flip` (kebab-case with `--` prefix). [Source: architecture.md#CSS design tokens]
- **`@theme` placement**: Must appear after `@import "tailwindcss"` in `style.css`. The file currently only has `@import "tailwindcss"` + comment.
- **This story is the layout SHELL only** — no game logic, no stores connected, no real components. Board area is a placeholder `<div>`. Stores, keyboard, and actual game components come in stories 2.2–2.4.
- **GameView is the only view that composes stores** (architecture boundary) — but this story does NOT wire stores yet. Reserve that for subsequent stories.

### Token Values (Complete Set)
From UX spec (color system section):

| Token | CSS Variable | Value |
|---|---|---|
| bg-base | `--color-bg-base` | `#111118` |
| bg-surface | `--color-bg-surface` | `#1a1a22` |
| tile-border-empty | `--color-tile-border-empty` | `#3a3a45` |
| tile-border-active | `--color-tile-border-active` | `#565663` |
| tile-correct | `--color-tile-correct` | `#538d4e` |
| tile-present | `--color-tile-present` | `#b59f3b` |
| tile-absent | `--color-tile-absent` | `#3a3a45` |
| text-primary | `--color-text-primary` | `#f0f0f0` |
| text-secondary | `--color-text-secondary` | `#a0a0aa` |
| accent-streak | `--color-accent-streak` | `#9999cc` |
| tile-correct-d | `--color-tile-correct-d` | `#4a90d9` |
| tile-present-d | `--color-tile-present-d` | `#e8a030` |

Duration tokens (match existing `src/constants/timing.ts` values exactly):

| Token | CSS Variable | Value |
|---|---|---|
| tile-flip | `--duration-tile-flip` | `400ms` |
| tile-stagger | `--duration-tile-stagger` | `100ms` |
| board-dim | `--duration-board-dim` | `500ms` |
| funnel-fade | `--duration-funnel-fade` | `300ms` |

### Layout Specification (Void+Altar hybrid)
From UX spec (Design Direction + Spacing & Layout Foundation):
- **Design philosophy**: Board owns the center. Minimal peripheral chrome. Nothing outside board region competes during gameplay.
- **Board area**: ~350px wide, 5×6 grid of 62×62px tiles with 5px gaps = 350px total — horizontally centered
- **Vertical position**: Upper-center of viewport — NOT vertically centered. Aim for ~15–20% from top (padding-top around 10vh or fixed px, with enough breathing room)
- **Streak/settings corner**: `position: fixed`, top-right, 16px from both top and right edges, small and calm
- **Responsive**: No layout changes across breakpoints. Board stays fixed-dimension and just centers in space. `@media (max-width: 400px)` graceful degradation only.

### Typography Application
- `font-family: 'Inter', sans-serif` on `body` or `html` — applies everywhere by default
- Lora is scoped to etymology card — use a wrapper class like `.lora` or target `[data-lora]` attribute. Do NOT apply Lora globally. Stories in Epic 3 (EtymologyCard.vue) will use this class.

### File Structure
- **Only files changed in this story**: `src/style.css`, `src/views/GameView.vue`
- Do NOT create any component files — those begin in story 2.2 (`GameTile.vue`, `GameBoard.vue`)
- Do NOT modify `src/App.vue` — it already correctly renders `<RouterView />`
- Do NOT modify `index.html` unless adding Google Fonts link there instead of CSS `@import` (either approach is acceptable; CSS `@import` is simpler)

### Google Fonts Import
Add to top of `style.css` before `@import "tailwindcss"`:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Lora:ital,wght@0,400;0,700;1,400&display=swap');
```

### No Tests Required
This story is pure CSS/layout with no logic. No Vitest tests needed. Visual verification via `npm run dev`.

### Project Structure Notes
- `src/style.css` — currently minimal (just `@import "tailwindcss"` + placeholder comment). This story fills it in.
- `src/views/GameView.vue` — currently just `<main><!-- Game UI wired in Story 2.1 --></main>`. Replace entirely.
- `src/components/game/.gitkeep`, `src/components/layout/.gitkeep` etc. — placeholder files, do NOT remove `.gitkeep` yet (components created in 2.2+)

### References
- Color tokens: [ux-design-specification.md — Visual Design Foundation / Color System]
- Duration tokens: [src/constants/timing.ts] — CSS values must match these constants exactly
- Layout principle: [ux-design-specification.md — Spacing & Layout Foundation]
- Design direction: [ux-design-specification.md — Chosen Direction: Void+Altar hybrid]
- Token naming convention: [architecture.md — Code Naming Conventions / CSS design tokens]
- Tailwind v4 @theme setup: [architecture.md — Styling Solution]
- GameView architectural boundary: [architecture.md — Architectural Boundaries]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_No issues encountered._

### Completion Notes List

- Implemented all 12 color tokens and 4 duration tokens in `@theme` block in `src/style.css` using Tailwind v4 syntax
- Google Fonts `@import` added before `@import "tailwindcss"` as required by Tailwind v4
- Inter applied as default via `body { font-family: 'Inter', sans-serif }`. Lora scoped via `.lora` and `[data-lora]` selectors.
- `GameView.vue` replaced with layout shell: `min-height: 100vh`, `bg-base` background, board placeholder centered at `padding-top: 10vh` (upper-center), fixed top-right corner at 16px edges
- Board placeholder set to 350px width; `overflow-x: hidden` on root prevents horizontal scroll at narrow viewports
- All 41 existing unit tests pass — no regressions

### File List

- src/style.css
- src/views/GameView.vue

## Change Log

- 2026-03-20: Story 2.1 implemented — design tokens (`@theme` colors + durations), Google Fonts (Inter/Lora), and GameView layout shell
