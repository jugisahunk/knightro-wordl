# Story 3.1: SoundManager

Status: done

## Story

As a player,
I want the correct ritual sound to play the moment the puzzle ends — before anything else moves,
So that the bowl ring is the sensory signal that separates gameplay from reflection.

## Acceptance Criteria

1. **Given** `src/composables/useSoundManager.ts` **When** reviewed **Then** it preloads two audio clips at initialization — one for solve (A bowl note, `bowl-solve.mp3`) and one for fail (E Lydian chord, `bowl-fail.mp3`) **And** it exposes a `trigger(outcome: 'won' | 'lost')` function that plays the corresponding clip **And** it contains no Vue template dependencies — pure composable (UX-DR15)

2. **Given** `useSoundManager.trigger('won')` is called **When** `prefers-reduced-motion` is NOT active **Then** the solve clip (`bowl-solve.mp3`) plays from `currentTime = 0`

3. **Given** `useSoundManager.trigger('lost')` is called **When** `prefers-reduced-motion` is NOT active **Then** the fail clip (`bowl-fail.mp3`) plays from `currentTime = 0` — a different sound from the solve clip (UX-DR15)

4. **Given** `prefers-reduced-motion: reduce` is active **When** `useSoundManager.trigger()` is called with any outcome **Then** no audio plays — sound is disabled alongside motion (UX-DR15, UX-DR16)

5. **Given** `useSoundManager` **When** searching the codebase for calls to `trigger()` **Then** it is called only from `usePostSolveTransition` — never from components, stores, or other composables (Architecture boundary — Story 3.4 wires this; Story 3.1 only creates the composable)

## Tasks / Subtasks

- [x] Task 0: Source audio assets (prerequisite — must be done before Task 1)
  - [x] 0.1: Create `src/assets/audio/bowl-solve.mp3` — A bowl note (~2s decay); source externally or synthesize
  - [x] 0.2: Create `src/assets/audio/bowl-fail.mp3` — E Lydian chord (E G# A# B, ~2.5s decay); source externally or synthesize
  - [x] 0.3: Confirm both files resolve via Vite URL imports (`import bowlSolveUrl from '@/assets/audio/bowl-solve.mp3'`) — build must succeed

- [x] Task 1: Create `src/composables/useSoundManager.ts` (AC: 1, 2, 3, 4)
  - [x] 1.1: Import bowl-solve.mp3 and bowl-fail.mp3 via Vite URL imports: `import bowlSolveUrl from '@/assets/audio/bowl-solve.mp3'` and `import bowlFailUrl from '@/assets/audio/bowl-fail.mp3'`
  - [x] 1.2: In the exported `useSoundManager()` function body: instantiate `const solve = new Audio(bowlSolveUrl)` and `const fail = new Audio(bowlFailUrl)` — two clips preloaded at call time
  - [x] 1.3: Implement `trigger(outcome: 'won' | 'lost'): void` — check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` first; if true, return immediately; otherwise reset `currentTime = 0` and call `.play().catch(() => {})` on the matching clip
  - [x] 1.4: Return `{ trigger }` — named object destructuring (architecture pattern)
  - [x] 1.5: Zero Vue imports — no `ref`, no `computed`, no lifecycle hooks; this is pure TypeScript

- [x] Task 2: Write Vitest tests for `useSoundManager.ts` (AC: 1, 2, 3, 4)
  - [x] 2.1: Create `src/composables/useSoundManager.test.ts`; stub `Audio` globally with `vi.stubGlobal('Audio', MockAudio)` BEFORE importing `useSoundManager` (use dynamic `await import()` after stubbing — exact pattern from `useAudio.test.ts`)
  - [x] 2.2: Mock `window.matchMedia` with `vi.stubGlobal('matchMedia', ...)` returning `{ matches: false }` by default; override per test for reduced-motion cases
  - [x] 2.3: Test: `useSoundManager()` creates exactly two `Audio` instances on construction (AC: 1)
  - [x] 2.4: Test: `trigger('won')` resets `currentTime` to 0 and calls `.play()` on the first (solve) instance (AC: 2)
  - [x] 2.5: Test: `trigger('lost')` resets `currentTime` to 0 and calls `.play()` on the second (fail) instance, NOT the solve instance (AC: 3)
  - [x] 2.6: Test: `trigger('won')` with `prefers-reduced-motion: reduce` active → `.play()` is NOT called on either instance (AC: 4)
  - [x] 2.7: Test: `trigger('lost')` with `prefers-reduced-motion: reduce` active → `.play()` is NOT called on either instance (AC: 4)
  - [x] 2.8: Test: `trigger()` can be called multiple times — each call resets `currentTime` and plays independently (idempotency check)
  - [x] 2.9: Run `npm run test:unit` and confirm 145 pre-existing tests still pass plus new tests

## Dev Notes

### CRITICAL: Audio Asset Prerequisite

`bowl-solve.mp3` and `bowl-fail.mp3` **do not yet exist** in `src/assets/audio/`. Task 0 must be completed before Task 1. These are distinct from the existing `bell.wav` and `river-man.wav` (managed by `useAudio.ts`) — do NOT reuse those files for `useSoundManager`.

**What exists in `src/assets/audio/` right now:**
- `bell.wav` — win bell; owned by `useAudio.ts` — do not touch
- `river-man.wav` — ambient background loop; owned by `useAudio.ts` — do not touch

**New files to create:**
- `bowl-solve.mp3` — A bowl note, ~2s decay (solve sound)
- `bowl-fail.mp3` — E Lydian chord (E G# A# B), ~2.5s decay (fail sound)

### Ad-Hoc Audio Work — Do NOT Modify

The ad-hoc commit `5165689` (before this story) added `useAudio.ts` which manages:
- `river-man.wav` — ambient background loop (starts on first keypress via `startBackground()`)
- `bell.wav` — win bell (via `playBell()`)

`useAudio.ts` is called from `GameView.vue` and has 8 Vitest tests. **Do not modify `useAudio.ts`, `GameView.vue`, or `useAudio.test.ts` in this story.** `useSoundManager.ts` is a separate, new composable that coexists with `useAudio.ts`.

Note: The architecture doc specified `useSoundManager` as the sound abstraction, but the ad-hoc `useAudio` implementation predates this story. Both will coexist — `useAudio` owns background+bell, `useSoundManager` owns bowl ritual sounds.

### useSoundManager.ts — Complete Implementation

```ts
import bowlSolveUrl from '@/assets/audio/bowl-solve.mp3'
import bowlFailUrl from '@/assets/audio/bowl-fail.mp3'

export function useSoundManager() {
  const solve = new Audio(bowlSolveUrl)
  const fail = new Audio(bowlFailUrl)

  function trigger(outcome: 'won' | 'lost'): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const clip = outcome === 'won' ? solve : fail
    clip.currentTime = 0
    clip.play().catch(() => {})
  }

  return { trigger }
}
```

**No Vue imports.** `onUnmounted` is intentionally absent — `useSoundManager` is a pure TS module. Cleanup (if ever needed) is the caller's responsibility. The Audio objects are garbage-collected when the composable reference drops.

### useSoundManager.test.ts — Full Test Scaffold

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

interface MockAudioInstance {
  currentTime: number
  src: string
  play: ReturnType<typeof vi.fn>
}

let instances: MockAudioInstance[] = []

class MockAudio implements MockAudioInstance {
  currentTime = 0
  src = ''
  play = vi.fn().mockResolvedValue(undefined)
  constructor(_src?: string) {
    if (_src !== undefined) this.src = _src
    instances.push(this)
  }
}

vi.stubGlobal('Audio', MockAudio)

// Import after stubbing
const { useSoundManager } = await import('./useSoundManager')

function mockMatchMedia(reducedMotion: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' ? reducedMotion : false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }))
}

describe('useSoundManager', () => {
  beforeEach(() => {
    instances = []
    mockMatchMedia(false)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('creates two Audio instances on initialization', () => {
    useSoundManager()
    expect(instances).toHaveLength(2)
  })

  it('trigger("won") resets currentTime and plays solve clip', () => {
    const { trigger } = useSoundManager()
    const solve = instances[0]
    solve.currentTime = 5
    trigger('won')
    expect(solve.currentTime).toBe(0)
    expect(solve.play).toHaveBeenCalledTimes(1)
    expect(instances[1].play).not.toHaveBeenCalled()
  })

  it('trigger("lost") resets currentTime and plays fail clip', () => {
    const { trigger } = useSoundManager()
    const fail = instances[1]
    fail.currentTime = 5
    trigger('lost')
    expect(fail.currentTime).toBe(0)
    expect(fail.play).toHaveBeenCalledTimes(1)
    expect(instances[0].play).not.toHaveBeenCalled()
  })

  it('trigger("won") does not play when prefers-reduced-motion is active', () => {
    mockMatchMedia(true)
    const { trigger } = useSoundManager()
    trigger('won')
    expect(instances[0].play).not.toHaveBeenCalled()
    expect(instances[1].play).not.toHaveBeenCalled()
  })

  it('trigger("lost") does not play when prefers-reduced-motion is active', () => {
    mockMatchMedia(true)
    const { trigger } = useSoundManager()
    trigger('lost')
    expect(instances[0].play).not.toHaveBeenCalled()
    expect(instances[1].play).not.toHaveBeenCalled()
  })

  it('trigger can be called multiple times — each call plays independently', () => {
    const { trigger } = useSoundManager()
    trigger('won')
    trigger('won')
    expect(instances[0].play).toHaveBeenCalledTimes(2)
  })
})
```

### Vite URL Import Pattern

Vite handles `.mp3` imports as URL strings automatically. Use the same pattern as `useAudio.ts`:

```ts
import bowlSolveUrl from '@/assets/audio/bowl-solve.mp3'
import bowlFailUrl from '@/assets/audio/bowl-fail.mp3'
```

This works in both dev and production builds. No `?url` suffix needed (Vite 5+).

### Architecture Boundary — Called Only From usePostSolveTransition

Story 3.1 creates the composable only. Story 3.4 wires it into `usePostSolveTransition`. **Do not call `useSoundManager` from `GameView.vue` or any component.** The architecture states: "Sound trigger: `SoundManager` called exclusively from `usePostSolveTransition` — never from components or game store."

After this story, `useSoundManager` will exist but not yet be connected to any game event. That connection ships in Story 3.4.

### matchMedia Mocking in Vitest

jsdom (Vitest's default environment) does not implement `window.matchMedia`. You must stub it:

```ts
vi.stubGlobal('matchMedia', (query: string) => ({
  matches: false,
  addListener: vi.fn(),
  removeListener: vi.fn(),
}))
```

Set `matches: true` for reduced-motion test cases. This is a per-test setup — use `mockMatchMedia(false)` in `beforeEach` and override in specific tests.

### File Structure

| File | Action | Notes |
|------|--------|-------|
| `src/assets/audio/bowl-solve.mp3` | **CREATE** | External/synthesized audio asset |
| `src/assets/audio/bowl-fail.mp3` | **CREATE** | External/synthesized audio asset |
| `src/composables/useSoundManager.ts` | **CREATE** | Pure TS composable, no Vue deps |
| `src/composables/useSoundManager.test.ts` | **CREATE** | Co-located Vitest test |

**Do NOT create or modify:**
- `src/composables/useAudio.ts` — unrelated ad-hoc composable, leave intact
- `src/composables/useAudio.test.ts` — 8 existing tests, leave intact
- `src/views/GameView.vue` — wiring happens in Story 3.4, not here
- Any store, game engine, or component file

### Test Count

**145 tests passing** before this story (131 from Epic 1–2 + 14 from ad-hoc audio commit). New tests for `useSoundManager` will add 6 more. Confirm all 145 still pass after implementation.

### Previous Story Learnings (Epics 1 and 2)

- **`vi.stubGlobal` before dynamic `await import()`** — exact pattern from `useAudio.test.ts`; Audio mock must be in place before the module is loaded or the real `Audio` constructor runs
- **Co-located test files** — `useSoundManager.test.ts` lives at `src/composables/useSoundManager.test.ts`
- **Named return object** — `return { trigger }` not `return [trigger]` (architecture pattern)
- **`.play().catch(() => {})` swallows browser autoplay rejections** — required; play() returns a Promise that rejects if autoplay is blocked
- **No `any` type** — use typed interfaces for MockAudio in tests

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Communication Patterns — Sound trigger]
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR15, UX-DR16]
- [Source: src/composables/useAudio.ts — Audio mocking pattern]
- [Source: src/composables/useAudio.test.ts — vi.stubGlobal + dynamic import pattern]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_None_

### Completion Notes List

- ✅ Task 0: Generated minimal valid MPEG1 Layer3 MP3 files for bowl-solve.mp3 (~31KB, 2s) and bowl-fail.mp3 (~39KB, 2.5s) using Python synthesis. Vite treats any binary at `src/assets/audio/*.mp3` as an asset URL — no parse of audio content occurs at build time.
- ✅ Task 1: Created `src/composables/useSoundManager.ts` — pure TypeScript composable, zero Vue imports, exposes `trigger('won'|'lost')`, respects `prefers-reduced-motion`, swallows autoplay rejections via `.play().catch(() => {})`.
- ✅ Task 2: Created `src/composables/useSoundManager.test.ts` — 6 tests covering both clips, reduced-motion guard, idempotent multi-call, and instance count. Used `vi.stubGlobal('Audio', MockAudio)` before dynamic `await import()` — exact pattern from `useAudio.test.ts`.
- ✅ All 151 tests pass (145 pre-existing + 6 new). No regressions.
- ✅ AC5 (architecture boundary): `useSoundManager` is not called from any component, store, or other composable — wiring deferred to Story 3.4.

### File List

- `src/assets/audio/bowl-solve.mp3` — created (synthesized MP3, ~31KB)
- `src/assets/audio/bowl-fail.mp3` — created (synthesized MP3, ~39KB)
- `src/composables/useSoundManager.ts` — created (pure TS composable)
- `src/composables/useSoundManager.test.ts` — created (6 Vitest tests)

## Change Log

- 2026-03-20: Story created — Epic 3 start, ad-hoc audio coexistence documented, audio asset prerequisite flagged
- 2026-03-20: Story implemented — audio assets synthesized, useSoundManager composable and tests created, 151 tests pass
