import { describe, it, expect, beforeEach } from 'vitest'
import { getAllGameRecords, getStartingWordStats, getTileStatesForRecord } from './useAnalyticsData'
import type { DailyGameRecord } from '@/types/persistence'

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

function makeRecord(
  date: string,
  guess1: string,
  funnelAfterGuess1: number,
): DailyGameRecord {
  return {
    date,
    guesses: [guess1, 'xxxxx'],
    solved: true,
    funnelData: [2315, funnelAfterGuess1, 1],
  }
}

describe('getStartingWordStats', () => {
  it('returns null stats with validCount 0 for 0 records', () => {
    const result = getStartingWordStats([])
    expect(result.stats).toBeNull()
    expect(result.validCount).toBe(0)
  })

  it('returns null stats with validCount for 4 records (below threshold)', () => {
    const records = [
      makeRecord('2026-03-01', 'crane', 60),
      makeRecord('2026-03-02', 'crane', 50),
      makeRecord('2026-03-03', 'crane', 70),
      makeRecord('2026-03-04', 'crane', 80),
    ]
    const result = getStartingWordStats(records)
    expect(result.stats).toBeNull()
    expect(result.validCount).toBe(4)
  })

  it('returns correct average and most-used word for 5 records', () => {
    const records = [
      makeRecord('2026-03-01', 'crane', 60),
      makeRecord('2026-03-02', 'crane', 50),
      makeRecord('2026-03-03', 'crane', 70),
      makeRecord('2026-03-04', 'salty', 80),
      makeRecord('2026-03-05', 'crane', 40),
    ]
    const { stats } = getStartingWordStats(records)
    expect(stats).not.toBeNull()
    expect(stats!.averageRemaining).toBe(60) // (60+50+70+80+40)/5 = 60
    expect(stats!.mostUsedWord).toBe('CRANE')
    expect(stats!.mostUsedCount).toBe(4)
    expect(stats!.totalGames).toBe(5)
  })

  it('accepts any tied word for most-used when there is a tie', () => {
    const records = [
      makeRecord('2026-03-01', 'crane', 60),
      makeRecord('2026-03-02', 'crane', 50),
      makeRecord('2026-03-03', 'salty', 70),
      makeRecord('2026-03-04', 'salty', 80),
      makeRecord('2026-03-05', 'hello', 40),
    ]
    const { stats } = getStartingWordStats(records)
    expect(stats).not.toBeNull()
    expect(['CRANE', 'SALTY']).toContain(stats!.mostUsedWord)
    expect(stats!.mostUsedCount).toBe(2)
  })

  it('excludes records with malformed funnelData (length < 2) from average', () => {
    const records = [
      makeRecord('2026-03-01', 'crane', 100),
      makeRecord('2026-03-02', 'crane', 100),
      makeRecord('2026-03-03', 'crane', 100),
      makeRecord('2026-03-04', 'crane', 100),
      makeRecord('2026-03-05', 'crane', 100),
      // This record has short funnelData — should be excluded
      { date: '2026-03-06', guesses: ['crane', 'other'], solved: true, funnelData: [2315] },
    ]
    const { stats } = getStartingWordStats(records)
    expect(stats).not.toBeNull()
    expect(stats!.averageRemaining).toBe(100)
    expect(stats!.totalGames).toBe(5)
  })

  it('returns null stats with correct validCount when filtered records are below threshold', () => {
    const records = [
      makeRecord('2026-03-01', 'crane', 60),
      makeRecord('2026-03-02', 'crane', 50),
      // 3 malformed records
      { date: '2026-03-03', guesses: ['crane'], solved: true, funnelData: [2315] },
      { date: '2026-03-04', guesses: ['crane'], solved: true, funnelData: [2315] },
      { date: '2026-03-05', guesses: ['crane'], solved: true, funnelData: [2315] },
    ]
    const result = getStartingWordStats(records)
    expect(result.stats).toBeNull()
    expect(result.validCount).toBe(2)
  })

  it('rounds average to nearest integer', () => {
    const records = [
      makeRecord('2026-03-01', 'crane', 61),
      makeRecord('2026-03-02', 'crane', 62),
      makeRecord('2026-03-03', 'crane', 63),
      makeRecord('2026-03-04', 'crane', 64),
      makeRecord('2026-03-05', 'crane', 65),
    ]
    const { stats } = getStartingWordStats(records)
    // (61+62+63+64+65)/5 = 63
    expect(stats!.averageRemaining).toBe(63)
  })

  it('skips records with empty guesses array', () => {
    const records = [
      makeRecord('2026-03-01', 'crane', 60),
      makeRecord('2026-03-02', 'crane', 50),
      makeRecord('2026-03-03', 'crane', 70),
      makeRecord('2026-03-04', 'crane', 80),
      makeRecord('2026-03-05', 'crane', 40),
      { date: '2026-03-06', guesses: [], solved: false, funnelData: [2315, 100, 50] },
    ]
    const { stats } = getStartingWordStats(records)
    expect(stats).not.toBeNull()
    expect(stats!.totalGames).toBe(5)
  })
})

describe('getTileStatesForRecord', () => {
  // EPOCH_DATE is 2021-06-19, answers[0] = "oaken"
  // So getAnswerForDate('2021-06-19') returns 'oaken'

  it('returns correct tile states for a known record', () => {
    // guess "oaken" against answer "oaken" → all correct
    const record: DailyGameRecord = {
      date: '2021-06-19',
      guesses: ['oaken'],
      solved: true,
      funnelData: [2315, 1],
    }
    const result = getTileStatesForRecord(record)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(['correct', 'correct', 'correct', 'correct', 'correct'])
  })

  it('returns empty array for record with no guesses', () => {
    const record: DailyGameRecord = {
      date: '2021-06-19',
      guesses: [],
      solved: false,
      funnelData: [2315],
    }
    const result = getTileStatesForRecord(record)
    expect(result).toEqual([])
  })

  it('returns correct number of rows matching guesses length', () => {
    // answer for 2021-06-19 is "oaken"
    const record: DailyGameRecord = {
      date: '2021-06-19',
      guesses: ['crane', 'blank', 'oaken'],
      solved: true,
      funnelData: [2315, 100, 1],
    }
    const result = getTileStatesForRecord(record)
    expect(result).toHaveLength(3)
    // last guess is exact match
    expect(result[2]).toEqual(['correct', 'correct', 'correct', 'correct', 'correct'])
    // first guess "crane" against "oaken":
    // c→absent, r→absent, a→present, n→present, e→present
    expect(result[0][0]).toBe('absent')  // c
    expect(result[0][1]).toBe('absent')  // r
    expect(result[0][2]).toBe('present') // a (in oaken but not pos 2)
    expect(result[0][3]).toBe('present') // n (in oaken but not pos 3)
    expect(result[0][4]).toBe('present') // e (in oaken but not pos 4)
  })
})
