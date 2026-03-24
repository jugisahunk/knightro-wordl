---
Story: 5-5
Title: Etymology Schema and Card Enrichment
Status: review
Epic: 5 — Settings, Accessibility and Polish
Created: 2026-03-23
---

# Story 5.5: Etymology Schema and Card Enrichment

## User Story

As Lord Farquaad,
I want the etymology card to display richer word information — including when the word first appeared, how its form evolved, related words, and a joke —
So that the post-solve ritual delivers genuine delight and linguistic discovery, not a placeholder.

## Context

The current `EtymologyEntry` type has three fields: `pos`, `definition`, `origin`. The current `etymology.json` contains **1,678 stub entries** (definition = "A five-letter English word.", origin = "English") and all entries lack the new fields entirely.

**This story is Story A of a two-story effort:**
- **Story A (this story):** Extend the TypeScript schema and update `EtymologyCard.vue` to render the new fields. No data changes — use mock data in tests only.
- **Story B (next story):** Regenerate `etymology.json` with fully enriched data for all entries.

**Do NOT regenerate or patch `etymology.json` in this story.** The card must handle both the current sparse data (gracefully) and the future enriched data (fully rendered).

## Acceptance Criteria

**AC1 — Schema extended:**
Given the `EtymologyEntry` interface,
When the dev inspects `src/types/etymology.ts`,
Then it defines 7 fields: `pos`, `definition`, `origin` (all required), and `firstUsed`, `evolution`, `relatedWords` (string[]), `joke` (all optional — required fields become required after Story B enriches the data).

**AC2 — Card renders new fields when present:**
Given an `EtymologyEntry` with all 7 fields populated,
When `EtymologyCard` renders,
Then it displays `firstUsed`, `evolution`, `relatedWords`, and `joke` in addition to the existing `pos`, `definition`, and `origin`.

**AC3 — Card degrades gracefully when new fields are empty/absent:**
Given an entry where `firstUsed`, `evolution`, `relatedWords`, and/or `joke` are empty strings or absent (current data shape),
When `EtymologyCard` renders,
Then only populated fields are shown — no blank sections, no layout breakage.

**AC4 — Component tests cover new fields:**
Given the updated `EtymologyCard.test.ts`,
When tests run with an enriched mock entry,
Then there are passing tests for: `firstUsed` renders, `evolution` renders, `relatedWords` renders, `joke` renders, and graceful fallback when new fields are absent.

**AC5 — Existing tests still pass:**
Given no changes to `etymology.json`,
When the full test suite runs (`npm run test:unit` and `npm run test:e2e`),
Then all pre-existing tests continue to pass.

**AC6 — E2E smoke test passes:**
Given the app running in dev mode,
When an e2e smoke test loads the app after the schema change,
Then the app loads without JS errors (reaching the post-solve card state in e2e is deferred; a homepage smoke test is sufficient for this story).

## Tasks

### Task 1: Extend `EtymologyEntry` interface

**File:** `src/types/etymology.ts`

Replace the existing interface with:

```typescript
export interface EtymologyEntry {
  pos: string            // part of speech: "noun", "verb", "adjective"
  definition: string     // real definition (no placeholders)
  origin: string         // brief origin: e.g. "Old English dūstig"
  firstUsed?: string     // era of first recorded use: e.g. "13th century" or "circa 1823" (populated in Story B)
  evolution?: string     // how the word's form or meaning changed over time (populated in Story B)
  relatedWords?: string[]// cognates, derivatives, or siblings: e.g. ["DUSK", "DUST"] (populated in Story B)
  joke?: string          // one-liner involving the word (populated in Story B)
}

export type EtymologyMap = Record<string, EtymologyEntry>
```

**Note:** `EtymologyMap` is unchanged. The four new fields are optional (`?`) because the existing 1,678 JSON entries lack them — making them required would be a type lie. They become required after Story B enriches the data. The `v-if` guards in `EtymologyCard.vue` handle absent/undefined values identically to empty strings.

### Task 2: Update `EtymologyCard.vue` to render new fields

**File:** `src/components/post-solve/EtymologyCard.vue`

**Rendering order (top to bottom):**
1. Word (existing `.etymology-word`)
2. POS (existing `.etymology-pos`, `v-if="entry && entry.pos"`)
3. Definition (existing `.etymology-definition`, `v-if="entry && entry.definition"`)
4. Origin (existing `.etymology-origin` — keep current logic including fallback text)
5. First Used — new `<p class="etymology-first-used">` — `v-if="entry && entry.firstUsed"`
6. Evolution — new `<p class="etymology-evolution">` — `v-if="entry && entry.evolution"`
7. Related Words — new `<p class="etymology-related">` — `v-if="entry && entry.relatedWords && entry.relatedWords.length"`
8. Joke — new `<p class="etymology-joke">` — `v-if="entry && entry.joke"`

**Related words display format:** `Related: DUSK, DUST, MURKY` (join array with `", "`, prefix with "Related: ")

**Joke display format:** Include the 😄 emoji prefix directly in the template: `😄 {{ entry.joke }}`

**New CSS classes (add to `<style scoped>`):**

```css
.etymology-first-used {
  font-family: 'Lora', serif;
  font-weight: 400;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin-top: 8px;
}

.etymology-evolution {
  font-family: 'Lora', serif;
  font-weight: 400;
  font-style: italic;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--color-text-secondary);
  margin-top: 8px;
}

.etymology-related {
  font-family: 'Lora', serif;
  font-weight: 400;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  letter-spacing: 0.02em;
}

.etymology-joke {
  font-family: 'Lora', serif;
  font-weight: 400;
  font-style: italic;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--color-text-primary);
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-tile-border-empty);
}
```

**⚠️ ANTI-REGRESSION:** The existing `v-if="entry"` guards on `etymology-pos` and `etymology-definition` must be preserved exactly. The `etymology-origin` fallback logic (`entry ? entry.origin : 'No etymology on record for this word.'`) must not change.

**⚠️ DO NOT** add `aria-modal`, `role="dialog"`, or any focus-trap changes — the card's accessibility model is already complete and tested.

### Task 3: Update `EtymologyCard.test.ts`

**File:** `src/components/post-solve/EtymologyCard.test.ts`

**Update the `sampleEntry` fixture** to include all 7 fields:

```typescript
const sampleEntry: EtymologyEntry = {
  pos: 'noun',
  definition: 'A small dwelling or shelter.',
  origin: 'Old English "hūs"',
  firstUsed: '8th century',
  evolution: 'Derived from Proto-Germanic *husą. The meaning narrowed from "building" to "dwelling" over time.',
  relatedWords: ['HOME', 'HAVEN', 'HOVER'],
  joke: 'Why did the word HOUSE get promoted? Because it had great foundations.',
}
```

**Add 5 new tests** to the existing `describe('EtymologyCard')` block:

```typescript
// 2.9: firstUsed renders
it('renders firstUsed when present', () => {
  const wrapper = mount(EtymologyCard, {
    props: { word: 'HOUSE', entry: sampleEntry },
  })
  expect(wrapper.find('.etymology-first-used').text()).toContain('8th century')
})

// 2.10: evolution renders
it('renders evolution when present', () => {
  const wrapper = mount(EtymologyCard, {
    props: { word: 'HOUSE', entry: sampleEntry },
  })
  expect(wrapper.find('.etymology-evolution').text()).toContain('Proto-Germanic')
})

// 2.11: relatedWords renders as joined list with prefix
it('renders relatedWords as comma-joined list with "Related:" prefix', () => {
  const wrapper = mount(EtymologyCard, {
    props: { word: 'HOUSE', entry: sampleEntry },
  })
  const text = wrapper.find('.etymology-related').text()
  expect(text).toContain('Related:')
  expect(text).toContain('HOME')
  expect(text).toContain('HOUSE')
})

// 2.12: joke renders with emoji prefix
it('renders joke with emoji prefix', () => {
  const wrapper = mount(EtymologyCard, {
    props: { word: 'HOUSE', entry: sampleEntry },
  })
  const text = wrapper.find('.etymology-joke').text()
  expect(text).toContain('😄')
  expect(text).toContain('HOUSE')
})

// 2.13: new fields absent when entry fields are empty strings
it('does not render new field elements when fields are empty', () => {
  const sparseEntry: EtymologyEntry = {
    pos: 'noun',
    definition: 'A small dwelling.',
    origin: 'Old English "hūs"',
    firstUsed: '',
    evolution: '',
    relatedWords: [],
    joke: '',
  }
  const wrapper = mount(EtymologyCard, {
    props: { word: 'HOUSE', entry: sparseEntry },
  })
  expect(wrapper.find('.etymology-first-used').exists()).toBe(false)
  expect(wrapper.find('.etymology-evolution').exists()).toBe(false)
  expect(wrapper.find('.etymology-related').exists()).toBe(false)
  expect(wrapper.find('.etymology-joke').exists()).toBe(false)
})
```

**Existing 9 tests must all continue to pass unchanged.** Do not modify any existing test.

### Task 4: Add TODO note to `data-integrity.test.ts`

**File:** `src/data/data-integrity.test.ts`

**Do NOT add failing tests.** Add a comment block after the existing `etymology.json` describe block:

```typescript
// TODO (Story B): When etymology.json is regenerated with enriched data, add validation here for:
// - firstUsed: non-empty string on all entries
// - evolution: non-empty string on all entries
// - relatedWords: non-empty array on all entries
// - joke: non-empty string on all entries
// The cross-file integrity test (every answer has an etymology entry) remains valid and must continue to pass.
```

**Do NOT touch any existing test in this file.**

### Task 5: E2E smoke test

**File:** `e2e/post-solve.spec.ts` (create if not exists) or add to existing post-solve e2e file

Check if an e2e test for post-solve/etymology exists:
- If `e2e/post-solve.spec.ts` or similar file exists, add a test there
- If none exists, create `e2e/post-solve.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('etymology card', () => {
  test('etymology card renders without error after schema change', async ({ page }) => {
    // Navigate and force a game-complete state is complex — smoke test only:
    // Verify the app loads cleanly (no JS errors from schema change)
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    expect(errors).toHaveLength(0)
  })
})
```

**Note from E2E policy (added Epic 5):** Every story touching user-visible features MUST have a Playwright test. Guard build-dependent tests (SW, PWA) with `test.skip(!process.env.CI, ...)`.

## Architecture Constraints

- `EtymologyCard.vue` lives in `src/components/post-solve/` — **do not move it**
- Layer boundary: `EtymologyCard` is a pure display component — it receives `entry` as a prop, emits `dismiss`, does nothing else. No store access, no composable calls.
- `<script setup>` syntax only — Options API is banned project-wide
- No new dependencies — all styling via existing CSS custom properties (`--color-*`)
- All timing constants are in `constants/timing.ts` — the card has no animations, so no timing constants needed here
- `usePersistenceStore` is the sole localStorage accessor — etymology data is static JSON, not stored
- TypeScript strict mode: `any` is banned. The `relatedWords: string[]` field is an array — access it as an array, never cast

## File Structure

| File | Action |
|------|--------|
| `src/types/etymology.ts` | MODIFY — add 4 new required fields to `EtymologyEntry` |
| `src/components/post-solve/EtymologyCard.vue` | MODIFY — render new fields with v-if guards, add 4 CSS classes |
| `src/components/post-solve/EtymologyCard.test.ts` | MODIFY — update fixture, add 5 new tests |
| `src/data/data-integrity.test.ts` | MODIFY — add TODO comment only, no new tests |
| `e2e/post-solve.spec.ts` | CREATE or MODIFY — 1 smoke test |

**Do NOT modify:**
- `src/data/etymology.json` — data regeneration is Story B
- `src/components/layout/PostSolveTransition.vue` — wiring is already correct; the `as Record<string, EtymologyEntry>` cast handles the schema mismatch at runtime
- `src/stores/` — no store changes needed
- `e2e/settings.spec.ts`, `e2e/gameplay.spec.ts`, `e2e/audio.spec.ts`, `e2e/first-launch.spec.ts` — do not touch

## Previous Story Intelligence (from 5.1)

- **Unit test baseline:** 266 Vitest tests passing. This story adds 5 new → expect **271** after.
- **E2E baseline:** 10 Playwright tests passing (+1 new smoke test → expect **11**, excluding PWA-skipped).
- **`<script setup>` is mandatory** — all components use composition API with `<script setup>`.
- **`v-model` pattern for panel open/close** is established in `SettingsPanel.vue` — not relevant here but confirms pattern.
- **Focus management on `onMounted`** is already in `EtymologyCard.vue` (`cardRef.value?.focus()`) — do not remove or duplicate it.
- **`click.self` on backdrop** is already working — the `@click.self="emit('dismiss')"` on `.etymology-backdrop` must be preserved exactly.
- **JSON imports with `with { type: 'json' }` required in Node 24 ESM** for Playwright tests — if post-solve e2e imports JSON data files, use this syntax.

## Rendering Reference

Expected rendered output for a fully enriched entry (DUSTY):

```
DUSTY
noun
Covered in dust; dull and outdated.

Old English dūstig, from dūst (dust).
13th century
Over centuries, the word gained a figurative sense — calling ideas "dusty" implies they are hopelessly out of date.

Related: DUSK, DUST, MURKY

😄 Why did the librarian get fired? Her knowledge was too DUSTY.
```

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Completion Notes List

- Task 1: Extended `EtymologyEntry` interface with 4 new **optional** fields: `firstUsed?`, `evolution?`, `relatedWords?` (string[]), `joke?`. Fields are optional because existing JSON data lacks them; they become required after Story B. `EtymologyMap` unchanged.
- Task 2: Updated `EtymologyCard.vue` template with 4 new `v-if`-guarded `<p>` elements (firstUsed, evolution, relatedWords, joke). Related words join with `", "` and prefix `"Related: "`. Joke prefixed with `😄` emoji in template. Added 4 new CSS classes. `.etymology-evolution` has `margin-top: 8px`. `.etymology-joke` separator uses `var(--color-tile-border-empty)`. All existing guards and fallback logic preserved unchanged.
- Task 3: Updated `EtymologyCard.test.ts` — updated `sampleEntry` fixture to include all 7 fields (`relatedWords: ['HOME', 'HAVEN', 'HOVER']` — no word appears in its own related list); added 5 new tests (2.9–2.13) covering each new field render and graceful fallback when fields are empty. Test 2.11 asserts exact comma-joined format `'HOME, HAVEN, HOVER'`. All 9 existing tests continue to pass.
- Task 4: Added TODO comment block to `data-integrity.test.ts` after the etymology.json describe block — no tests added or modified.
- Task 5: Created `e2e/post-solve.spec.ts` with 1 smoke test confirming app loads without JS errors after schema change.
- All 272 unit tests pass (267 pre-existing + 5 new). All 12 e2e tests pass (4 SW/PWA tests skipped as expected in non-CI).

### File List

- `src/types/etymology.ts`
- `src/components/post-solve/EtymologyCard.vue`
- `src/components/post-solve/EtymologyCard.test.ts`
- `src/data/data-integrity.test.ts`
- `e2e/post-solve.spec.ts` (created)

## Change Log

- 2026-03-23: Story created — etymology schema extension and card enrichment (Story A of 2-part etymology enrichment effort)
- 2026-03-23: Implementation complete — schema extended, card updated with 4 new fields, 5 unit tests added, TODO placeholder added to data-integrity, e2e smoke test created. 272 unit + 12 e2e tests passing.
- 2026-03-23: Code review complete — applied review corrections: new fields made optional (BS-1), joke separator border fixed to `--color-tile-border-empty` (BS-2), evolution margin-top added (BS-3), data-integrity test description updated (BS-4), sampleEntry relatedWords fixture corrected to exclude target word (BS-5), test 2.11 strengthened to assert full comma-joined format, AC6 wording aligned with implemented smoke test scope.
