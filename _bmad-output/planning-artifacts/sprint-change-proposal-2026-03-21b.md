# Sprint Change Proposal
**Date:** 2026-03-21
**Project:** knightro-wordle
**Scope Classification:** Minor
**Prepared by:** Bob (Scrum Master)

---

## Section 1: Issue Summary

**Problem Statement:**
Story 4.3 (PWA Service Worker and Offline Caching) was submitted for review with two tests that technically pass but do not verify what their Acceptance Criteria actually require. The tests gave false confidence: the assertions were too weak to catch a broken offline engine or an incomplete SW cache.

**Discovery Context:**
Identified during code review of story 4.3 (status: `review`). The `bmad-code-review` workflow produced findings BS-2 and BS-4 under the "Bad Spec" category.

**Evidence:**

- **BS-2** (`e2e/first-launch.spec.ts:56-57`): The "word validation works offline" test asserted that 5 tile slots exist in the first row. In a Wordle board, 5 tile slots are *always* rendered in the DOM before any guess — so this assertion proves the page loaded, not that the offline game engine processed the guess. Additionally, the selectors used (`.tile-row` / `.tile`) do not match the real DOM class names (`board-row` / `game-tile`), meaning the test would fail in CI regardless.

- **BS-4** (`e2e/first-launch.spec.ts` offline load test): AC 5 explicitly requires "zero network requests" on offline reload. The test only checked that `#app` is non-empty — it did not detect uncached resources that would produce network errors when offline.

**Root Cause:**
Spec gap — Task 3.2 and Task 3.3 in the story file under-specified what the assertions needed to prove. Not a delivery failure.

---

## Section 2: Impact Analysis

**Epic Impact:**
- Epic 4 (in-progress): Story 4.3 reverts from `review` to `in-progress` for a targeted fix. No other stories affected. Timeline impact: one short implementation pass.

**Story Impact:**
- Story 4.3 spec: Tasks 3.2 and 3.3 amended (see Section 4)
- No other stories modified

**Artifact Conflicts:**
- PRD: None — AC 1 and AC 5 are already correct in the PRD; tests now properly verify them
- Architecture: None
- UX/UI: None
- `e2e/first-launch.spec.ts`: Two tests updated (see Section 4)

**Technical Impact:**
- Purely additive assertions — no source code changes
- No new dependencies
- The `board-row` / `game-tile` selector fix is also required for the tests to work at all in CI

---

## Section 3: Recommended Approach

**Selected Path: Direct Adjustment (Option 1)**

Amend story 4.3 spec (Tasks 3.2 and 3.3) and apply matching code fixes to `e2e/first-launch.spec.ts`. Story reverts to `in-progress`; re-enters review after fixes.

**Rationale:**
- Changes are confined to two test assertions — zero source code risk
- The `requestfailed` listener pattern is the correct Playwright mechanism for AC 5; no page.route() interference with SW
- The `tile-state-*` class check is the minimal correct proof that the Wordle engine ran
- Low effort, low risk, no timeline impact beyond a single short implementation pass

**Effort:** Low
**Risk:** Low
**Timeline Impact:** Minimal — story 4.3 re-enters review after one focused pass

---

## Section 4: Detailed Change Proposals

### Change 1 — Story 4.3 spec: amend Task 3.3 (BS-2)

**File:** `_bmad-output/implementation-artifacts/4-3-pwa-service-worker-and-offline-caching.md`

OLD:
```
3.3: Test — offline gameplay: after SW install and going offline, type a 5-letter word
     and press Enter, assert the first tile row is rendered and contains tiles —
     word validation works from cache
```

NEW:
```
3.3: Test — offline gameplay: after SW install and going offline, type a 5-letter word
     and press Enter, assert at least one tile in the first row has a tile-state-correct,
     tile-state-present, or tile-state-absent class — proves the game engine ran and
     evaluated the guess from cache, not just that 5 tile slots exist in the DOM
```

---

### Change 2 — Story 4.3 spec: amend Task 3.2 (BS-4)

**File:** `_bmad-output/implementation-artifacts/4-3-pwa-service-worker-and-offline-caching.md`

OLD:
```
3.2: Test — offline load: visit app online, wait for SW install, set context.setOffline(true),
     reload, assert page loads (title or #app is non-empty), set offline back to false
```

NEW:
```
3.2: Test — offline load: visit app online, wait for SW install, register a requestfailed
     listener, set context.setOffline(true), reload, assert page loads (#app is non-empty)
     AND assert zero requestfailed events fired — proves all resources were served from the
     SW cache with no network escapes (AC 5), set offline back to false
```

---

### Change 3 — Code fix: word validation test (BS-2)

**File:** `e2e/first-launch.spec.ts`
**Test:** `'word validation works offline'`

OLD:
```ts
const tiles = page.locator('.tile-row').first().locator('.tile')
await expect(tiles).toHaveCount(5)
```

NEW:
```ts
const revealedTiles = page
  .locator('.board-row')
  .first()
  .locator('.tile-state-correct, .tile-state-present, .tile-state-absent')
await expect(revealedTiles).toHaveCount(5)
```

Rationale: `.tile-row`/`.tile` are wrong selectors (real classes: `board-row`/`game-tile`). Checking for 5 revealed-state tiles is the correct proof — `tile-state-*` classes are only applied by the game engine after evaluating a guess. Playwright's auto-retry handles the stagger animation (~1s max).

---

### Change 4 — Code fix: offline load test (BS-4)

**File:** `e2e/first-launch.spec.ts`
**Test:** `'app loads offline after SW install'`

Added before `context.setOffline(true)`:
```ts
const failedRequests: string[] = []
page.on('requestfailed', req => failedRequests.push(req.url()))
```

Added inside the `try` block after `#app` assertion:
```ts
expect(failedRequests, 'all resources should be served from SW cache').toHaveLength(0)
```

Rationale: When offline and the SW cache is complete, `requestfailed` never fires — the SW intercepts every fetch and serves from cache. Any uncached resource causes a network error and fires `requestfailed` with the URL. This is the correct Playwright mechanism for verifying AC 5's "zero network requests" requirement.

---

## Section 5: Implementation Handoff

**Scope Classification:** Minor — development team implements directly

**Status:** All four changes have been applied.

**Files modified:**
- `_bmad-output/implementation-artifacts/4-3-pwa-service-worker-and-offline-caching.md` — Tasks 3.2 and 3.3 amended
- `e2e/first-launch.spec.ts` — word validation and offline load tests updated
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story 4.3 reverted to `in-progress`

**Next steps for Dev Agent:**
- Verify `e2e/first-launch.spec.ts` changes look correct
- Run `npm run build && CI=true npm run test:e2e` to confirm the two updated tests pass in preview mode
- Move story 4.3 back to `review` and re-run `bmad-code-review`

**Success Criteria:**
- `'word validation works offline'` — asserts 5 revealed-state tiles after Enter, not just tile count
- `'app loads offline after SW install'` — asserts zero `requestfailed` events after offline reload
- All 236 unit tests still pass
- Existing `audio.spec.ts` tests unaffected
