---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
inputDocuments: []
workflowType: 'prd'
briefCount: 0
researchCount: 0
brainstormingCount: 0
projectDocsCount: 0
classification:
  projectType: 'web_app'
  domain: 'general'
  complexity: 'low'
  projectContext: 'greenfield'
  scale: 'single user, personal'
---

# Product Requirements Document - Myrdle

**Author:** Lord Farquaad
**Date:** 2026-03-18

> **Myrdle** — *My Wordle.* A personal word mastery ritual.

## Executive Summary

Myrdle is a personal, browser-based daily word puzzle — a Wordle clone built for a single user who treats the daily solve as a deliberate practice ritual, not casual entertainment. The product serves one clearly defined need: structured self-improvement in word deduction, supported by vocabulary enrichment, without any social or competitive layer.

The core user loop is: solve the daily puzzle using a methodical guessing technique → review a post-solve funnel showing how efficiently the solution space was eliminated → absorb a brief etymology card for the answer word. Over time, aggregated analytics surface the user's technique fingerprint — where their strategy is strong, where it stalls, and whether they're improving.

### What Makes This Special

Most Wordle variants add features outward — sharing, streaks, leaderboards, multiplayer. Myrdle adds features *inward*. The differentiator is a private performance mirror: analytics that reveal how a specific person thinks under constraint, not how they rank against others. The etymology card deepens vocabulary retention in the moment of highest engagement — immediately after a solve — without disrupting the minimalist ritual feel. There is no audience. The only feedback loop is between the user and their own improving capability.

## Project Classification

| Attribute | Value |
| --- | --- |
| **Project Type** | Web App (SPA/PWA) |
| **Domain** | General |
| **Complexity** | Low |
| **Context** | Greenfield |
| **Scale** | Single user, personal |

## Success Criteria

### User Success

- The daily solve feels like a complete, satisfying ritual — puzzle → funnel review → etymology card — in under 5 minutes
- After 30 days, the user can observe a measurable trend in their guess funnel (improving elimination rate, or at minimum understanding *why* they stall)
- Etymology cards surface words or origins the user finds genuinely interesting at least occasionally — not every day, but enough to be worth the moment
- The app never interrupts or adds friction to the solve itself; analytics and etymology are always *after*, never *during*

### Habit & Longevity Success

- Still being used daily after 90 days (the ritual has stuck)
- The technique fingerprint data tells a coherent story by day 60 — enough history to be meaningful
- Zero dependency failures during morning use (offline-first working as designed)

### Technical Success

- Loads and plays fully offline after first visit
- Etymology data pre-cached at build time — no runtime API calls during the solve ritual
- Local storage reliably persists guess history across sessions without data loss
- All valid answer words have etymology entries (no gaps in the post-solve card)

### Measurable Outcomes

- Daily streak maintained (private, local)
- Funnel narrowing rate improves or stabilizes within 60 days
- Average valid words remaining at solve decreases over time (tighter technique)

## Product Scope

### MVP — Minimum Viable Product

- Standard Wordle gameplay (6 guesses, color feedback, hard mode toggle)
- Daily puzzle from a curated word list, deterministic by date
- Post-solve funnel visualization (valid word count per guess)
- Post-solve etymology card (pre-cached)
- Private streak counter (local)
- Offline-first (PWA, service worker caching)

### Growth Features (Post-MVP)

- Aggregated technique fingerprint dashboard (funnel shape over time, starting word effectiveness)
- Personal word history — browse past puzzles and their etymologies
- Hard mode analytics (does hard mode change your funnel shape?)

### Vision (Future)

- Vocabulary pattern insights — which word families do you solve fastest/slowest?
- Starting word optimizer — ranked suggestions based on your personal funnel data
- Calendar heatmap of solve quality over months/years

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Experience MVP — the minimum that delivers the complete daily ritual: solve → funnel → etymology. Nothing is valuable until all three work together.

**Resource Requirements:** Solo developer. Scope must stay lean enough to ship and actually use.

**Core User Journeys Supported in MVP:** Journey 1 (morning ritual), Journey 2 (failed solve), Journey 3 (first launch)

### Risk Mitigation Strategy

**Technical Risk:** Funnel calculation requires a complete valid-word list with correct Wordle elimination logic — the most complex piece of the MVP. Mitigation: use the well-documented open-source Wordle word list and a tested elimination function before building any UI.

**Resource Risk:** Solo build. Mitigation: Phase 2 analytics are explicitly post-MVP — ship the ritual first, add the mirror later.

**Market Risk:** Not applicable — personal tool.

## User Journeys

### Journey 1: The Morning Ritual (Happy Path)

It's 7:14am. Lord Farquaad opens his laptop with coffee in hand. He navigates to Myrdle — it loads instantly, offline cache doing its job. Today's puzzle is waiting, clean and familiar.

He types his opener — CRANE, as always — and watches the tiles flip. Two yellows. He's already thinking. Second guess tightens the frame. Third guess and the funnel is closing fast. Fifth guess: solved.

The board settles. A quiet transition — no fanfare — and the funnel appears: `2315 → 48 → 9 → 3 → 1`. He pauses on guess 3. Nine words left, but he waited until three. *That's the hesitation.* He logs it mentally.

Then the etymology card slides up: *BRINY — from Old English brīne, salt water used for preserving. First recorded 1550s.* He reads it. Closes the tab. Carries the word with him.

**Capabilities revealed:** Daily word delivery, offline load, gameplay mechanics, post-solve funnel screen, etymology card, streak increment.

---

### Journey 2: The Off Day (Edge Case — Failed Solve)

It's a bad morning. He goes 6 guesses deep on a word he'd never retrieve under pressure. The board fills. No solve.

The game ends with grace — no judgment, just the answer revealed. The funnel still appears: `2315 → 312 → 87 → 34 → 18 → 6`. Wide all the way down. He sees the shape immediately — this wasn't a technique failure, it was a vocabulary gap. He'd never have gotten KNAVE from that cluster.

The etymology card still shows. *KNAVE — from Old English cnafa, boy or male servant. Cognate with German Knabe.* That's actually interesting. He didn't solve it, but he learned something.

Streak resets to zero. No drama. Tomorrow is another puzzle.

**Capabilities revealed:** Failed-solve state handling, answer reveal, funnel on failure, etymology on failure, streak reset logic.

---

### Journey 3: First Launch — Getting Started

First time opening Myrdle. No history, no cache yet. He loads the app on his home connection — the service worker installs, etymologies cache silently in the background. Today's puzzle is ready.

No tutorial. No onboarding wizard. The board is there, the keyboard is there. He knows how Wordle works. He plays.

After the solve, the funnel is a single data point — not meaningful yet. The etymology card appears. He reads it. *Okay. This is what this is.*

The streak sits at 1. Something worth protecting.

**Capabilities revealed:** First-load PWA install, service worker caching, zero-history state for funnel (graceful single-point display), streak initialization.

---

### Journey 4: Checking In on Progress (Analytics Review)

It's been 45 days. He opens the stats/history view — not every morning, but today he's curious. His funnel shape over time is rendered: the first two weeks were wide, but the last 10 days show consistent narrowing to 3-5 words by guess 3.

He notices his opener is working well — guess 1 consistently drops him from 2315 to under 60. But guess 3 is his stall point. The data has named his problem for him.

He closes the stats. Tomorrow he'll try committing earlier at guess 3.

**Capabilities revealed:** Historical funnel aggregation view, starting word effectiveness stat, streak calendar, technique fingerprint summary.

---

### Journey Requirements Summary

| Capability Area | Revealed By |
| --- | --- |
| Daily puzzle engine (date-deterministic) | Journeys 1, 2, 3 |
| Offline-first / PWA caching | Journeys 1, 3 |
| Post-solve funnel visualization | Journeys 1, 2 |
| Etymology card (pre-cached) | Journeys 1, 2 |
| Failed-solve state + answer reveal | Journey 2 |
| Streak logic (increment + reset) | Journeys 2, 3 |
| Zero-history graceful state | Journey 3 |
| Aggregated analytics / history view | Journey 4 |

## Innovation & Novel Patterns

### Detected Innovation Areas

#### Solution-Space Funnel as Personal Performance Metric

The core innovation in Myrdle is treating each guess not as a move toward a solution, but as an information event with a measurable yield. By tracking valid word count remaining after each guess (e.g. `2315 → 48 → 9 → 3 → SOLVED`), Myrdle makes the *efficiency of deduction* visible — something no mainstream Wordle clone surfaces. Over time, the shape of this funnel becomes a personal technique fingerprint: a quantified, evolving picture of how a specific person thinks under constraint.

This is a new interaction pattern in the daily word puzzle genre: from outcome reporting to process analysis.

#### Etymology as Ritual Completion, Not Feature

Embedding the etymology card as the natural close of the solve ritual — not a popup, not a tab, not a toggle — is a UX pattern that treats vocabulary enrichment as intrinsic to the experience rather than additive. The timing (post-solve, peak engagement) is deliberate and differentiating.

### Validation Approach

- The funnel visualization is self-validating: if the data is interesting after 30 days of play, it's working
- Etymology value is subjective but measurable by continued daily engagement with the card
- No A/B testing needed — single user, qualitative signal is sufficient

### Risk Mitigation

- Funnel calculation requires maintaining a complete valid-word list with Wordle-compatible elimination logic — this is a well-understood algorithm; risk is low
- If etymology pre-caching has gaps (missing words), graceful fallback to a "no etymology available" state preserves the ritual without breaking it

## Web App Specific Requirements

### Project-Type Overview

Myrdle is a single-page application (SPA) with PWA capabilities, built for personal daily use in Chrome. No server required — all data is local. The app is designed for local-only deployment initially, with a clean path to static hosting (GitHub Pages, Netlify) in the future without architectural changes.

### Technical Architecture Considerations

- **SPA** — single view for gameplay; secondary view for stats/history; no routing library required beyond simple state-driven view switching
- **PWA** — service worker for offline caching of app shell, word list, and pre-cached etymology data; installable to desktop/home screen
- **No backend** — zero server dependencies; all state in `localStorage` or `IndexedDB`
- **Static deployable** — all assets are build-time artifacts; hosting requires only a static file server

### Browser Support

| Browser | Support Level |
| --- | --- |
| Chrome (desktop) | Primary — full support required |
| Other browsers | Not required; graceful degradation acceptable |

### Responsive Design

- Desktop-first (daily laptop use)
- Mobile layout not required but should not be broken

### Implementation Considerations

- Word list and answer sequence stored as static JSON at build time
- Etymology data compiled as static JSON keyed by word at build time
- `localStorage` for streak, guess history, and settings persistence
- Future hosting: deploy as static site with no configuration changes required

## Functional Requirements

### Daily Puzzle

- FR1: The system delivers a unique word each calendar day, consistent for that date
- FR2: The system selects the daily word deterministically from a curated answer word list
- FR3: The player can submit a 5-letter guess using a keyboard or on-screen input
- FR4: The system validates that each guess is a real word from the valid word list before accepting it
- FR5: The system reveals tile feedback (correct position, wrong position, not in word) after each guess submission
- FR6: The system enforces a maximum of 6 guesses per puzzle
- FR7: The player can toggle hard mode, which requires all revealed hints to be used in subsequent guesses
- FR8: The system reveals the correct answer when the player exhausts all guesses without solving

### Post-Solve Experience

- FR9: The system displays the post-solve funnel immediately after the puzzle ends (solve or failure)
- FR10: The funnel shows the count of valid remaining words after each guess (e.g. 2315 → 48 → 9 → 3 → 1)
- FR11: The system displays an etymology card for the day's answer word after the puzzle ends
- FR12: The etymology card is available for both solved and failed puzzles
- FR13: The player can dismiss the post-solve screen and return to a completed board view

### Word & Etymology Data

- FR14: The system maintains a complete list of valid 5-letter guess words
- FR15: The system maintains a curated answer word list (subset of valid words)
- FR16: The system stores etymology data for every word in the answer word list
- FR17: The system provides a graceful fallback when no etymology data exists for a given word

### Streak & Progress Tracking

- FR18: The system tracks a private daily streak counter stored locally
- FR19: The streak increments when the player solves the daily puzzle
- FR20: The streak resets when the player fails to solve or misses a day
- FR21: The player can view their current streak at any time

### Offline & Persistence

- FR22: The system functions fully offline after the first online load
- FR23: The system caches the app shell, word list, and etymology data for offline use
- FR24: The system persists all player data (guess history, streak, settings) in local storage
- FR25: The system restores the current day's in-progress puzzle state on page reload

### Settings

- FR26: The player can enable or disable hard mode
- FR27: The player can view a color-blind friendly tile color scheme

### Analytics (Phase 2)

- FR28: The system stores each completed puzzle's guess sequence and funnel data locally
- FR29: The player can view an aggregated funnel history showing narrowing rate over time
- FR30: The player can view starting word effectiveness (average valid words remaining after guess 1)
- FR31: The player can browse past puzzles with their answer and etymology

## Non-Functional Requirements

### Performance

- NFR1: The app shell loads and is interactive within 2 seconds on a standard home broadband connection on first load
- NFR2: The app loads and is fully playable within 500ms on subsequent visits (offline, from service worker cache)
- NFR3: Tile flip feedback after each guess submission completes within 100ms
- NFR4: The post-solve funnel and etymology card render within 300ms of puzzle completion
- NFR5: Etymology data for all answer words is pre-compiled at build time — zero runtime network requests during gameplay

### Accessibility

- NFR6: All interactive elements are reachable and operable via keyboard alone
- NFR7: Tile state colors (correct, present, absent) meet WCAG AA contrast ratio (4.5:1 minimum)
- NFR8: A color-blind friendly palette is available as an alternative to the default green/yellow/grey scheme

### Reliability

- NFR9: Player data (streak, guess history, settings) survives browser refresh, tab close, and browser restart
- NFR10: An interrupted puzzle (mid-guess, page closed) is fully restored on next load with no data loss
- NFR11: The app does not require an internet connection after the first successful load

### Data Integrity

- NFR12: Local storage data is never silently corrupted — if storage is unavailable or corrupted, the app fails gracefully with a clear message rather than incorrect state
- NFR13: The date-deterministic word selection produces the same answer for a given date regardless of device timezone offset
