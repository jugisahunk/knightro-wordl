import { describe, it, expect } from 'vitest'
import type { GameRecord } from './persistence'

describe('GameRecord schema contract (FR28)', () => {
  it('has guesses, solved, and funnelData fields with correct types', () => {
    // Runtime shape check — ensures the interface contract holds
    const record: GameRecord = {
      guesses: ['crane', 'salty'],
      solved: true,
      funnelData: [2315, 100, 12],
    }

    expect(Array.isArray(record.guesses)).toBe(true)
    expect(typeof record.solved).toBe('boolean')
    expect(Array.isArray(record.funnelData)).toBe(true)
  })

  it('accepts an empty guesses array and empty funnelData', () => {
    const record: GameRecord = {
      guesses: [],
      solved: false,
      funnelData: [],
    }

    expect(record.guesses).toEqual([])
    expect(record.solved).toBe(false)
    expect(record.funnelData).toEqual([])
  })
})
