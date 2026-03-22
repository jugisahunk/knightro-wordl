# Sprint Change Proposal
**Date:** 2026-03-21
**Project:** knightro-wordle
**Scope Classification:** Minor
**Prepared by:** Bob (Scrum Master)

---

## Section 1: Issue Summary

**Problem Statement:**
The project's e2e test strategy was never formally defined. Core user-facing features — gameplay loop, post-solve ritual (FunnelChart, EtymologyCard, PostSolveTransition), persistence restore, and streak display — have no Playwright smoke tests. This represents a quality gap that will grow as Epics 5 and 6 add more features.

**Discovery Context:**
Identified during sprint review while Epic 4 is in-progress (story 4.3 in review). An audit of 11 completed story files confirmed zero e2e test tasks were ever planned across Epics 1–3. Only stories 3.1 and 4.3 organically produced e2e tests (`audio.spec.ts` and `first-launch.spec.ts` respectively).

**Evidence:**
- 11 stories audited → 0 planned e2e tests
- Current e2e coverage: `audio.spec.ts` (3 tests), `first-launch.spec.ts` (4 CI-only PWA tests)
- Zero coverage for: gameplay loop, win/loss states, post-solve transition, FunnelChart rendering, EtymologyCard rendering, persistence restore, streak display

**Root Cause:**
Planning gap — not a delivery failure. No story was marked done and left e2e tests behind. The test strategy simply never incorporated Playwright coverage for UI-layer features.

---

## Section 2: Impact Analysis

**Epic Impact:**
- Epic 4 (in-progress): Add story 4.5 for e2e backfill. Story 4.4 (storage corruption handling) is unaffected and proceeds as planned.
- Epics 5 and 6 (backlog): No structural changes. A process policy is added to `epics.md` so future story creation includes e2e test tasks.
- Epics 1–3 (done): No changes. The backfill story covers their shipped features.

**Story Impact:**
- New story 4.5 added to Epic 4
- No existing story modifications

**Artifact Conflicts:**
- PRD: None — MVP scope unchanged
- Architecture: None — Playwright infrastructure already exists and is configured
- UX/UI: None
- `epics.md`: Minor addition — e2e test policy note for future story authoring

**Technical Impact:**
- Purely additive — new `e2e/gameplay.spec.ts` (or similar) file
- No source code changes
- No new tooling or dependencies

---

## Section 3: Recommended Approach

**Selected Path: Direct Adjustment (Option 1)**

Add story 4.5 to Epic 4 and a process policy note to `epics.md`. No rollback, no MVP scope change.

**Rationale:**
- Playwright is already installed and configured — zero tooling overhead
- All features to be tested are shipped and stable — no moving targets
- Story 4.5 fits naturally in Epic 4's reliability theme
- Low effort, low risk, purely additive

**Effort:** Low
**Risk:** Low
**Timeline Impact:** One additional story in Epic 4 (after 4.4)

---

## Section 4: Detailed Change Proposals

### Change 1: New Story 4.5

**Epic:** Epic 4 — Persistence, Streak and Offline
**Action:** ADD new story 4.5

```
Story 4.5: Core Gameplay End-to-End Test Coverage

As a developer,
I want Playwright smoke tests covering all shipped core user flows,
so that regressions in gameplay, post-solve ritual, persistence, and streak
are caught before they reach users.

Acceptance Criteria:
1. Gameplay loop: type a 5-letter word, press Enter, assert all 5 tiles in
   row 1 have a revealed state (correct/present/absent class)
2. Win state: solve the puzzle (mock or use known answer), assert win
   message or post-solve overlay is visible
3. Post-solve ritual: after a solve, assert FunnelChart and EtymologyCard
   are rendered in the DOM
4. Persistence restore: navigate to app, type 2 tiles, reload page, assert
   those 2 tiles are still present in row 1
5. Streak display: after a solve, assert StreakBadge shows a count ≥ 1

Rationale: These features shipped across Epics 2–4 with no e2e coverage.
A planning gap meant no story ever included Playwright tasks. This story
backfills the missing smoke test layer.
```

---

### Change 2: E2E Test Policy in `epics.md`

**Artifact:** `_bmad-output/planning-artifacts/epics.md`
**Action:** ADD testing strategy section

```
## E2E Test Policy (added 2026-03-21)

Starting with Epic 5, every story that introduces or modifies a
user-visible feature MUST include a task for Playwright e2e tests.
The story file template should include:

- Task: Write Playwright e2e test(s) in `e2e/<feature>.spec.ts`
  - Test the primary happy path in the browser
  - Guard any build-dependent tests (SW, PWA) with `test.skip(!process.env.CI, ...)`

Stories that are purely infrastructure, data pipeline, or unit-testable
composables may mark this task [N/A] with a brief note.

Rationale: E2e coverage was absent from Epics 1–3 due to a planning gap.
Story 4.5 backfills existing features. This policy ensures new features
are covered going forward.
```

---

## Section 5: Implementation Handoff

**Scope Classification:** Minor — development team implements directly

**Handoff Recipients:**
- **SM (Bob):** Update `sprint-status.yaml` to add story 4.5 entry; update `epics.md` with policy note; create story 4.5 file via `bmad-create-story`
- **Dev Agent:** Implement story 4.5 (write Playwright tests, no source changes needed)

**Success Criteria:**
- Story 4.5 file created and contextually complete
- `e2e/gameplay.spec.ts` (or equivalent) created with 5 passing tests
- `sprint-status.yaml` updated with `4-5-core-gameplay-e2e-test-coverage: backlog`
- `epics.md` updated with e2e policy note
- All existing tests (236 unit + audio.spec.ts) still pass
