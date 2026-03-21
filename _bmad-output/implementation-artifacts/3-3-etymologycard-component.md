# Story 3.3: EtymologyCard Component

Status: review

## Story

As a player,
I want to read the etymology of today's answer word in a calm, book-quality card,
So that the ritual ends with a moment of vocabulary discovery regardless of whether I solved or failed.

## Acceptance Criteria

1. **Given** `EtymologyCard.vue` with a valid etymology entry **When** rendered **Then** the answer word is displayed in Lora 700 uppercase at 1.75rem (UX-DR10)
   **And** the part of speech is displayed in Lora 400 italic at 0.875rem in `--color-text-secondary` (UX-DR10)
   **And** the definition is displayed in Lora 400 at 1.0625rem with line-height 1.65 (UX-DR10)
   **And** the origin is displayed in Lora 400 italic at 0.9375rem with line-height 1.55 (UX-DR10)
   **And** the card has max-width 480px and 32px internal padding, horizontally centered (UX-DR10)

2. **Given** `EtymologyCard.vue` when the etymology entry for today's word is missing (`entry` prop is `null`) **When** rendered **Then** the text `"No etymology on record for this word."` appears in the origin position in Lora italic (FR17, UX-DR10)
   **And** the card layout is identical to a card with data — no broken state, no missing section

3. **Given** `EtymologyCard.vue` is visible **When** the player presses Escape or Enter **Then** the component emits `dismiss` (FR13)

4. **Given** `EtymologyCard.vue` is visible **When** the player clicks anywhere outside the card (on the backdrop) **Then** the component emits `dismiss` (FR13)

5. **Given** `EtymologyCard.vue` **When** reviewed for accessibility **Then** it has `role="article"` and `aria-label="Etymology for [WORD]"` (UX-DR10)
   **And** the card receives focus when it appears so keyboard users can read it without additional navigation

6. **Given** `EtymologyCard.vue` **When** reviewed **Then** Lora font is used exclusively within this component — no other component in the project uses Lora (UX-DR3)

## Tasks / Subtasks

- [x] Task 0: Verify `src/types/etymology.ts` exists (AC: 1)
  - [x] 0.1: Check if `src/types/etymology.ts` exists. If it does NOT exist, create it with:
    ```ts
    export type EtymologyEntry = {
      pos: string
      definition: string
      origin: string
    }
    ```
  - [x] 0.2: Do NOT modify this file if it already exists — import from it as-is

- [x] Task 1: Create `src/components/post-solve/EtymologyCard.vue` (AC: 1, 2, 3, 4, 5, 6)
  - [x] 1.1: Define props: `word: string`, `entry: EtymologyEntry | null` (import from `@/types/etymology`)
  - [x] 1.2: Define emit: `dismiss`
  - [x] 1.3: Template structure: outer backdrop `<div>` covers viewport; inner card `<div role="article">` holds content
    - Backdrop uses `@click.self="emit('dismiss')"` so clicking outside card triggers dismiss
    - Card uses `@keydown="onKeyDown"` and `ref="cardRef"` with `tabindex="0"`
  - [x] 1.4: Compute `ariaLabel = 'Etymology for ' + props.word` — bind to card as `:aria-label="ariaLabel"`
  - [x] 1.5: Word display: `<h2>` — text content is `props.word` displayed uppercase — CSS: Lora 700, 1.75rem
  - [x] 1.6: Part of speech display: `<p class="pos">` — text content is `props.entry?.pos ?? ''` — CSS: Lora 400 italic, 0.875rem, `--color-text-secondary`; hide this element if `entry` is null (use `v-if="entry"`)
  - [x] 1.7: Definition display: `<p class="definition">` — text content is `props.entry?.definition ?? ''` — CSS: Lora 400, 1.0625rem, line-height 1.65; hide if `entry` is null
  - [x] 1.8: Origin/fallback display: `<p class="origin">` — CSS: Lora 400 italic, 0.9375rem, line-height 1.55
    - When `entry` is not null: shows `props.entry.origin`
    - When `entry` is null: shows `"No etymology on record for this word."` — same element, same CSS
  - [x] 1.9: Card layout CSS: `max-width: 480px`, `padding: 32px`, horizontally centered (e.g. `margin: 0 auto`)
  - [x] 1.10: Focus on mount: `const cardRef = ref<HTMLElement | null>(null)` — `onMounted(() => cardRef.value?.focus())`
  - [x] 1.11: `onKeyDown` handler: if `event.key === 'Escape' || event.key === 'Enter'` → `emit('dismiss')`
  - [x] 1.12: Scoped CSS uses `font-family: 'Lora', serif` for all card text — Lora is already loaded in `src/style.css`

- [x] Task 2: Create `src/components/post-solve/EtymologyCard.test.ts` (AC: 1, 2, 3, 4, 5)
  - [x] 2.1: Mount with valid entry — verify word text appears and is rendered uppercase
  - [x] 2.2: Mount with valid entry — verify pos text appears; verify definition text appears; verify origin text appears
  - [x] 2.3: Mount with `entry=null` — verify `"No etymology on record for this word."` appears in origin position; verify pos and definition elements are absent (or empty, per implementation)
  - [x] 2.4: Mount — trigger `keydown` with `{ key: 'Escape' }` on card element — verify `dismiss` emitted
  - [x] 2.5: Mount — trigger `keydown` with `{ key: 'Enter' }` on card element — verify `dismiss` emitted
  - [x] 2.6: Mount — trigger `click` on backdrop (the outer wrapper) — verify `dismiss` emitted (use `wrapper.find('.etymology-backdrop').trigger('click')` or similar)
  - [x] 2.7: Verify `role="article"` on inner card element
  - [x] 2.8: Verify `aria-label` contains `"Etymology for "` + the word (case-insensitive check acceptable)
  - [x] 2.9: Run `npm run test:unit` — confirm 163 pre-existing tests still pass (new total: 163 + 8 = 172 ✅)

## Dev Notes

### Architecture Boundary — Props Only, No Store Access

`EtymologyCard` is a **pure presentation component**. It receives props only. No store imports.

- `word` comes from `useGameStore().answerWord` — but wiring happens in Story 3.4 (`PostSolveTransition.vue`)
- `entry` comes from an etymology lookup in Story 3.4 — look up `etymologyJson[word.toUpperCase()]` or `etymologyJson[word]` depending on key casing
- **Do NOT** import `useGameStore`, `usePersistenceStore`, `useSettingsStore`, or any composable
- **Do NOT** import `src/data/etymology.json` in the component — data flows through props

### EtymologyEntry Type

`src/types/etymology.ts` — may or may not already exist. **Check before creating.**

```ts
export type EtymologyEntry = {
  pos: string        // Part of speech — e.g. "noun", "adjective", "verb"
  definition: string // Full definition text
  origin: string     // Etymology origin story — e.g. 'Old French "cabane"'
}
```

The `etymology.json` structure (for Story 3.4 reference — do NOT import here):
```json
{
  "CABIN": { "pos": "noun", "definition": "A small shelter...", "origin": "Old French \"cabane\"" },
  "OZONE": { "pos": "noun", "definition": "A form of oxygen...", "origin": "Greek \"ozein\"" }
}
```

Keys are **UPPERCASE** — matches `word.toUpperCase()`. (Story 3.4 concern; noted for context.)

### Template Structure

```vue
<template>
  <div class="etymology-backdrop" @click.self="emit('dismiss')">
    <div
      ref="cardRef"
      class="etymology-card"
      role="article"
      :aria-label="ariaLabel"
      tabindex="0"
      @keydown="onKeyDown"
    >
      <h2 class="etymology-word">{{ word }}</h2>
      <p v-if="entry" class="etymology-pos">{{ entry.pos }}</p>
      <p v-if="entry" class="etymology-definition">{{ entry.definition }}</p>
      <p class="etymology-origin">
        {{ entry ? entry.origin : 'No etymology on record for this word.' }}
      </p>
    </div>
  </div>
</template>
```

**Why this structure:**
- `@click.self` on backdrop handles "click outside" — only fires when backdrop itself is clicked, not card content
- `tabindex="0"` on card enables `@keydown` and programmatic focus
- `v-if="entry"` hides pos/definition when null — origin element always renders (shows fallback text)

### Scoped CSS — Typography Spec

All text within the card uses Lora exclusively (UX-DR3). Lora is already `@import`ed in `src/style.css` — no additional font loading needed.

```css
.etymology-backdrop {
  /* fills viewport or parent — exact sizing is a Story 3.4 concern */
  display: flex;
  align-items: center;
  justify-content: center;
}

.etymology-card {
  max-width: 480px;
  width: 100%;
  padding: 32px;
  background-color: var(--color-bg-surface);
  outline: none; /* suppress focus ring on the card div */
}

.etymology-word {
  font-family: 'Lora', serif;
  font-weight: 700;
  font-size: 1.75rem;
  text-transform: uppercase;
  color: var(--color-text-primary);
}

.etymology-pos {
  font-family: 'Lora', serif;
  font-weight: 400;
  font-style: italic;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.etymology-definition {
  font-family: 'Lora', serif;
  font-weight: 400;
  font-size: 1.0625rem;
  line-height: 1.65;
  color: var(--color-text-primary);
}

.etymology-origin {
  font-family: 'Lora', serif;
  font-weight: 400;
  font-style: italic;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--color-text-secondary);
}
```

**Do NOT use Tailwind utility classes for typography in this component** — the pixel-precise font sizes (1.0625rem, 0.9375rem) don't map to standard Tailwind scale. Use scoped CSS.

### Script Setup Pattern

Follow `FunnelChart.vue` and `FunnelBar.vue` patterns established in Story 3.2:

```ts
<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import type { EtymologyEntry } from '@/types/etymology'

const props = defineProps<{
  word: string
  entry: EtymologyEntry | null
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const cardRef = ref<HTMLElement | null>(null)
const ariaLabel = computed(() => `Etymology for ${props.word}`)

onMounted(() => {
  cardRef.value?.focus()
})

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape' || event.key === 'Enter') {
    emit('dismiss')
  }
}
</script>
```

**`<script setup>` ordering:**
1. Imports
2. `defineProps` / `defineEmits`
3. Refs
4. Computed properties
5. Functions / event handlers
6. Lifecycle hooks

### Testing Pattern

Pure prop component — **no Pinia setup needed**. Follow `FunnelBar.test.ts` structure:

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EtymologyCard from './EtymologyCard.vue'
import type { EtymologyEntry } from '@/types/etymology'

const sampleEntry: EtymologyEntry = {
  pos: 'noun',
  definition: 'A small dwelling or shelter.',
  origin: 'Old English "hūs"',
}

describe('EtymologyCard', () => {
  it('renders word text', () => {
    const wrapper = mount(EtymologyCard, {
      props: { word: 'HOUSE', entry: sampleEntry },
    })
    expect(wrapper.find('.etymology-word').text()).toContain('HOUSE')
  })

  it('emits dismiss on Escape key', async () => {
    const wrapper = mount(EtymologyCard, {
      props: { word: 'HOUSE', entry: sampleEntry },
    })
    await wrapper.find('[role="article"]').trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('dismiss')).toBeTruthy()
  })
})
```

**Focus test note:** `onMounted` focus will call `cardRef.value?.focus()`. In jsdom, focus events work but may need `attachTo: document.body` to behave like a real browser:

```ts
const wrapper = mount(EtymologyCard, {
  props: { word: 'HOUSE', entry: sampleEntry },
  attachTo: document.body,
})
```

### Design Tokens Used

All colors via CSS custom properties — never hardcode hex values:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg-surface` | `#1a1a22` | Card background |
| `--color-text-primary` | `#f0f0f0` | Word, definition text |
| `--color-text-secondary` | `#a0a0aa` | POS, origin text |

### File Structure

| File | Action | Notes |
|------|--------|-------|
| `src/types/etymology.ts` | **CREATE if missing** | May already exist — check first |
| `src/components/post-solve/EtymologyCard.vue` | **CREATE** | Pure prop component, no store access |
| `src/components/post-solve/EtymologyCard.test.ts` | **CREATE** | Co-located Vitest test |

**`src/components/post-solve/` directory already exists** — FunnelBar.vue and FunnelChart.vue are there from Story 3.2.

**Do NOT create or modify:**
- `src/stores/useGameStore.ts` — data wiring is a Story 3.4 concern
- `src/composables/usePostSolveTransition.ts` — orchestration is a Story 3.4 concern
- `src/components/layout/PostSolveTransition.vue` — wiring happens in Story 3.4
- Any game component (`GameBoard.vue`, `GameTile.vue`, etc.) — unrelated
- `src/data/etymology.json` — static data, read-only

### Cross-Story Context (Epic 3)

| Story | What it builds | Status |
|-------|---------------|--------|
| 3.1 | `useSoundManager.ts` | Done ✅ |
| 3.2 | `FunnelBar.vue` + `FunnelChart.vue` | Done ✅ |
| **3.3** | `EtymologyCard.vue` | **This story** |
| 3.4 | `usePostSolveTransition` + `PostSolveTransition.vue` | Wires 3.1, 3.2, 3.3 together |

Story 3.4 will:
- Look up `etymology.json[answerWord.toUpperCase()]` → pass as `entry` prop to `EtymologyCard`
- Pass `useGameStore().answerWord` → `word` prop
- Handle the `dismiss` emit to restore board opacity

Keep props clean: `word: string`, `entry: EtymologyEntry | null`, emit `dismiss`.

### Previous Story Intelligence (Story 3.2)

- **163 tests passing** after Story 3.2 (151 pre-story-3.2 + 12 new). Confirm all 163 still pass.
- **Pure prop pattern confirmed** — FunnelBar and FunnelChart have zero store imports. Same for EtymologyCard.
- **Co-located tests** — `.test.ts` files live alongside `.vue` files in same directory.
- **No `any` type** — TypeScript strict mode throughout.
- **`<script setup lang="ts">` ordering:** imports → defineProps/defineEmits → refs → computed → functions → lifecycle.
- **No Pinia in tests** for pure prop components — `mount` with no `global.plugins`.
- **`src/components/post-solve/` directory exists** — verified live, contains FunnelBar and FunnelChart files.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Boundaries]
- [Source: _bmad-output/planning-artifacts/architecture.md#Post-solve sequence]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Structures]
- [Source: src/components/post-solve/FunnelBar.vue — script setup pattern]
- [Source: src/components/post-solve/FunnelChart.vue — script setup pattern]
- [Source: src/style.css — Lora font already loaded, design tokens]
- [Source: src/types/etymology.ts — EtymologyEntry type (create if missing)]
- [Source: src/data/etymology.json — uppercase-keyed word entries]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — implementation was straightforward. `src/types/etymology.ts` already existed as an interface (not type); imported as-is per Task 0 instructions.

### Completion Notes List

- Task 0: `src/types/etymology.ts` already exists with `EtymologyEntry` interface. No changes made.
- Task 1: Created `src/components/post-solve/EtymologyCard.vue` — pure prop component, no store access. Follows `<script setup lang="ts">` ordering from Dev Notes. Scoped CSS uses Lora exclusively for all text. Backdrop `@click.self` handles outside-click dismiss. `onMounted` focuses the card element. `onKeyDown` emits `dismiss` on Escape or Enter.
- Task 2: Created `src/components/post-solve/EtymologyCard.test.ts` — 8 tests covering all ACs: word rendering, pos/definition/origin with valid entry, null entry fallback text and absent elements, Escape key dismiss, Enter key dismiss, backdrop click dismiss, `role="article"`, `aria-label` content.
- All 172 tests pass (163 pre-existing + 8 new). Zero regressions.

### File List

- src/components/post-solve/EtymologyCard.vue (created)
- src/components/post-solve/EtymologyCard.test.ts (created)

## Change Log

- Created `EtymologyCard.vue` — pure presentation component with backdrop/card structure, Lora typography, focus-on-mount, Escape/Enter dismiss, and backdrop-click dismiss (Date: 2026-03-20)
- Created `EtymologyCard.test.ts` — 8 tests covering all ACs; 172 total tests pass (Date: 2026-03-20)
