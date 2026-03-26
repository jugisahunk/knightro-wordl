import { describe, it, expect, beforeEach } from 'vitest'
import { getAllGameRecords } from './useAnalyticsData'

beforeEach(() => {
  localStorage.clear()
})

describe('getAllGameRecords', () => {
  it('returns empty array when localStorage is empty', () => {
    expect(getAllGameRecords()).toEqual([])
  })

  it('returns valid records sorted by date ascending', () => {
    localStorage.setItem(
      'myrdle_game_2026-03-20',
      JSON.stringify({ guesses: ['crane'], solved: true, funnelData: [2315] }),
    )
    localStorage.setItem(
      'myrdle_game_2026-03-18',
      JSON.stringify({ guesses: ['salty', 'crane'], solved: false, funnelData: [2315, 100] }),
    )
    localStorage.setItem(
      'myrdle_game_2026-03-19',
      JSON.stringify({ guesses: ['hello'], solved: true, funnelData: [500] }),
    )

    const records = getAllGameRecords()
    expect(records).toHaveLength(3)
    expect(records[0].date).toBe('2026-03-18')
    expect(records[1].date).toBe('2026-03-19')
    expect(records[2].date).toBe('2026-03-20')
    expect(records[0].solved).toBe(false)
    expect(records[2].guesses).toEqual(['crane'])
  })

  it('skips non-myrdle_game_ keys', () => {
    localStorage.setItem('myrdle_settings', JSON.stringify({ hardMode: false }))
    localStorage.setItem('myrdle_streak', JSON.stringify({ count: 5 }))
    localStorage.setItem(
      'myrdle_game_2026-03-20',
      JSON.stringify({ guesses: ['crane'], solved: true, funnelData: [100] }),
    )

    const records = getAllGameRecords()
    expect(records).toHaveLength(1)
    expect(records[0].date).toBe('2026-03-20')
  })

  it('skips keys with non-date suffixes (e.g. myrdle_game_corrupt)', () => {
    localStorage.setItem(
      'myrdle_game_corrupt',
      JSON.stringify({ guesses: ['crane'], solved: true, funnelData: [100] }),
    )
    localStorage.setItem(
      'myrdle_game_2026-03-20',
      JSON.stringify({ guesses: ['crane'], solved: true, funnelData: [100] }),
    )

    const records = getAllGameRecords()
    expect(records).toHaveLength(1)
    expect(records[0].date).toBe('2026-03-20')
  })

  it('skips malformed JSON values without throwing', () => {
    localStorage.setItem('myrdle_game_2026-03-18', 'not-json{{{')
    localStorage.setItem(
      'myrdle_game_2026-03-20',
      JSON.stringify({ guesses: ['crane'], solved: true, funnelData: [100] }),
    )

    expect(() => getAllGameRecords()).not.toThrow()
    const records = getAllGameRecords()
    expect(records).toHaveLength(1)
    expect(records[0].date).toBe('2026-03-20')
  })

  it('skips records with invalid shape (missing guesses array)', () => {
    localStorage.setItem(
      'myrdle_game_2026-03-18',
      JSON.stringify({ solved: true, funnelData: [100] }),
    )
    localStorage.setItem(
      'myrdle_game_2026-03-19',
      JSON.stringify({ guesses: 'not-array', solved: true, funnelData: [100] }),
    )
    localStorage.setItem(
      'myrdle_game_2026-03-20',
      JSON.stringify({ guesses: ['crane'], solved: true, funnelData: [100] }),
    )

    const records = getAllGameRecords()
    expect(records).toHaveLength(1)
    expect(records[0].date).toBe('2026-03-20')
  })

  it('skips records where solved is not a boolean', () => {
    localStorage.setItem(
      'myrdle_game_2026-03-18',
      JSON.stringify({ guesses: ['crane'], solved: 'yes', funnelData: [100] }),
    )

    expect(getAllGameRecords()).toEqual([])
  })

  it('skips records where funnelData is not an array', () => {
    localStorage.setItem(
      'myrdle_game_2026-03-18',
      JSON.stringify({ guesses: ['crane'], solved: true, funnelData: 42 }),
    )

    expect(getAllGameRecords()).toEqual([])
  })
})
