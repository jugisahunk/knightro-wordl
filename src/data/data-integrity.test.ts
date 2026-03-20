/**
 * data-integrity.test.ts
 * Verifies the three static data files meet the shape and size requirements
 * defined in Story 1.2 Acceptance Criteria.
 */

import { describe, it, expect } from 'vitest'
import validWords from './valid-words.json'
import answers from './answers.json'
import etymology from './etymology.json'

// ─── valid-words.json (AC 1) ──────────────────────────────────────────────────

describe('valid-words.json', () => {
  it('is an array', () => {
    expect(Array.isArray(validWords)).toBe(true)
  })

  it('contains at least 10,000 entries', () => {
    expect(validWords.length).toBeGreaterThanOrEqual(10000)
  })

  it('all entries are exactly 5 lowercase letters', () => {
    const invalid = validWords.filter(
      (w: unknown) => typeof w !== 'string' || w.length !== 5 || !/^[a-z]+$/.test(w as string),
    )
    expect(invalid).toHaveLength(0)
  })

  it('has no duplicate entries', () => {
    const unique = new Set(validWords)
    expect(unique.size).toBe(validWords.length)
  })
})

// ─── answers.json (AC 2) ──────────────────────────────────────────────────────

describe('answers.json', () => {
  it('is an array', () => {
    expect(Array.isArray(answers)).toBe(true)
  })

  it('contains at least 2,000 entries', () => {
    expect(answers.length).toBeGreaterThanOrEqual(2000)
  })

  it('all entries are exactly 5 lowercase letters', () => {
    const invalid = answers.filter(
      (w: unknown) => typeof w !== 'string' || w.length !== 5 || !/^[a-z]+$/.test(w as string),
    )
    expect(invalid).toHaveLength(0)
  })

  it('every answer word is present in valid-words.json', () => {
    const validSet = new Set(validWords)
    const missing = answers.filter((w: string) => !validSet.has(w))
    expect(missing).toHaveLength(0)
  })

  it('has no duplicate entries', () => {
    const unique = new Set(answers)
    expect(unique.size).toBe(answers.length)
  })
})

// ─── etymology.json (AC 3) ────────────────────────────────────────────────────

describe('etymology.json', () => {
  it('is a plain object (not an array)', () => {
    expect(typeof etymology).toBe('object')
    expect(Array.isArray(etymology)).toBe(false)
  })

  it('all keys are uppercase 5-letter strings', () => {
    const invalidKeys = Object.keys(etymology).filter(
      k => k !== k.toUpperCase() || k.length !== 5,
    )
    expect(invalidKeys).toHaveLength(0)
  })

  it('all entries have the correct shape { pos, definition, origin }', () => {
    const malformed = Object.entries(etymology).filter(
      ([, v]) =>
        typeof v !== 'object' ||
        v === null ||
        typeof (v as Record<string, unknown>).pos !== 'string' ||
        typeof (v as Record<string, unknown>).definition !== 'string' ||
        typeof (v as Record<string, unknown>).origin !== 'string',
    )
    expect(malformed).toHaveLength(0)
  })

  it('all pos, definition, and origin strings are non-empty', () => {
    const emptyStrings = Object.entries(etymology).filter(([, v]) => {
      const entry = v as { pos: string; definition: string; origin: string }
      return !entry.pos || !entry.definition || !entry.origin
    })
    expect(emptyStrings).toHaveLength(0)
  })
})

// ─── Cross-file validation ────────────────────────────────────────────────────

describe('cross-file integrity', () => {
  it('every answer word has a corresponding etymology entry', () => {
    const missing = answers.filter((w: string) => !(etymology as Record<string, unknown>)[w.toUpperCase()])
    expect(missing).toHaveLength(0)
  })
})
