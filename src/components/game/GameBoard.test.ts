import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GameBoard from './GameBoard.vue'
import type { GuessResult } from '@/types/game'

const defaultProps = {
  tileStates: [] as GuessResult[],
  guesses: [] as string[],
  currentInput: '',
  activeRow: 0,
  shakingRow: false,
}

describe('GameBoard', () => {
  describe('grid structure', () => {
    it('renders 6 rows', () => {
      const board = mount(GameBoard, { props: defaultProps })
      expect(board.findAll('[role="row"]')).toHaveLength(6)
    })

    it('renders 30 tiles (6×5)', () => {
      const board = mount(GameBoard, { props: defaultProps })
      expect(board.findAll('[role="gridcell"]')).toHaveLength(30)
    })

    it('renders 5 tiles per row', () => {
      const board = mount(GameBoard, { props: defaultProps })
      const rows = board.findAll('[role="row"]')
      rows.forEach((row) => {
        expect(row.findAll('[role="gridcell"]')).toHaveLength(5)
      })
    })

    it('has role="grid" on the container', () => {
      const board = mount(GameBoard, { props: defaultProps })
      expect(board.find('[role="grid"]').exists()).toBe(true)
    })

    it('has aria-label="Myrdl game board" on the grid', () => {
      const board = mount(GameBoard, { props: defaultProps })
      expect(board.find('[role="grid"]').attributes('aria-label')).toBe('Myrdl game board')
    })

    it('has an aria-live announcer region', () => {
      const board = mount(GameBoard, { props: defaultProps })
      const announcer = board.find('#board-announcer')
      expect(announcer.exists()).toBe(true)
      expect(announcer.attributes('aria-live')).toBe('polite')
      expect(announcer.attributes('aria-atomic')).toBe('true')
    })
  })

  describe('current input display', () => {
    it('shows current input letters in active row', () => {
      const board = mount(GameBoard, {
        props: { ...defaultProps, currentInput: 'hel', activeRow: 0 },
      })
      const rows = board.findAll('[role="row"]')
      const activeRowTiles = rows[0].findAll('[role="gridcell"]')
      expect(activeRowTiles[0].text()).toBe('H')
      expect(activeRowTiles[1].text()).toBe('E')
      expect(activeRowTiles[2].text()).toBe('L')
    })

    it('shows empty tiles beyond current input length in active row', () => {
      const board = mount(GameBoard, {
        props: { ...defaultProps, currentInput: 'ab', activeRow: 0 },
      })
      const rows = board.findAll('[role="row"]')
      const activeRowTiles = rows[0].findAll('[role="gridcell"]')
      // Tiles at index 2, 3, 4 should be empty (no text)
      expect(activeRowTiles[2].text()).toBe('')
      expect(activeRowTiles[3].text()).toBe('')
      expect(activeRowTiles[4].text()).toBe('')
    })

    it('renders future rows as all empty', () => {
      const board = mount(GameBoard, {
        props: { ...defaultProps, currentInput: 'hello', activeRow: 1 },
      })
      const rows = board.findAll('[role="row"]')
      // Rows 2-5 (index 2-5) should have no text content
      for (let i = 2; i < 6; i++) {
        const tiles = rows[i].findAll('[role="gridcell"]')
        tiles.forEach((tile) => expect(tile.text()).toBe(''))
      }
    })
  })

  describe('submitted rows', () => {
    it('displays guesses from submitted rows', () => {
      const tileStates: GuessResult[] = [
        ['correct', 'present', 'absent', 'absent', 'correct'],
      ]
      const board = mount(GameBoard, {
        props: {
          ...defaultProps,
          tileStates,
          guesses: ['crane'],
          activeRow: 1,
        },
      })
      const rows = board.findAll('[role="row"]')
      const submittedRow = rows[0].findAll('[role="gridcell"]')
      expect(submittedRow[0].find('.tile-letter').text()).toBe('C')
      expect(submittedRow[1].find('.tile-letter').text()).toBe('R')
      expect(submittedRow[2].find('.tile-letter').text()).toBe('A')
    })
  })

  describe('collapseToRow prop', () => {
    it('renders all 6 rows when collapseToRow is null (default)', () => {
      const board = mount(GameBoard, { props: defaultProps })
      expect(board.findAll('[role="row"]')).toHaveLength(6)
    })

    it('renders only 1 row when collapseToRow is set', () => {
      const tileStates: GuessResult[] = [
        ['correct', 'correct', 'correct', 'correct', 'correct'],
        ['absent', 'absent', 'absent', 'absent', 'absent'],
        ['present', 'present', 'present', 'present', 'present'],
      ]
      const board = mount(GameBoard, {
        props: {
          ...defaultProps,
          tileStates,
          guesses: ['crane', 'birds', 'feast'],
          activeRow: 3,
          collapseToRow: 0,
        },
      })
      expect(board.findAll('[role="row"]')).toHaveLength(1)
    })

    it('renders the correct row content when collapsed', () => {
      const tileStates: GuessResult[] = [
        ['absent', 'absent', 'absent', 'absent', 'absent'],
        ['correct', 'correct', 'correct', 'correct', 'correct'],
      ]
      const board = mount(GameBoard, {
        props: {
          ...defaultProps,
          tileStates,
          guesses: ['crane', 'feast'],
          activeRow: 2,
          collapseToRow: 1,
        },
      })
      const tiles = board.findAll('[role="gridcell"]')
      expect(tiles).toHaveLength(5)
      expect(tiles[0].find('.tile-letter').text()).toBe('F')
    })

    it('adds data-testid="collapsed-board" when collapsed', () => {
      const board = mount(GameBoard, {
        props: { ...defaultProps, collapseToRow: 0 },
      })
      expect(board.find('[data-testid="collapsed-board"]').exists()).toBe(true)
    })

    it('does not add data-testid="collapsed-board" when not collapsed', () => {
      const board = mount(GameBoard, { props: defaultProps })
      expect(board.find('[data-testid="collapsed-board"]').exists()).toBe(false)
    })

    it('applies game-board--collapsed class when collapsed', () => {
      const board = mount(GameBoard, {
        props: { ...defaultProps, collapseToRow: 2 },
      })
      expect(board.find('.game-board').classes()).toContain('game-board--collapsed')
    })
  })

  describe('shake animation', () => {
    it('applies row-shaking class to active row when shakingRow is true', async () => {
      const board = mount(GameBoard, {
        props: { ...defaultProps, shakingRow: true, activeRow: 0 },
      })
      const rows = board.findAll('[role="row"]')
      expect(rows[0].classes()).toContain('row-shaking')
    })

    it('does not apply row-shaking to non-active rows', async () => {
      const board = mount(GameBoard, {
        props: { ...defaultProps, shakingRow: true, activeRow: 2 },
      })
      const rows = board.findAll('[role="row"]')
      expect(rows[0].classes()).not.toContain('row-shaking')
      expect(rows[1].classes()).not.toContain('row-shaking')
      expect(rows[2].classes()).toContain('row-shaking')
    })

    it('does not apply row-shaking when shakingRow is false', () => {
      const board = mount(GameBoard, {
        props: { ...defaultProps, shakingRow: false, activeRow: 0 },
      })
      const rows = board.findAll('[role="row"]')
      rows.forEach((row) => expect(row.classes()).not.toContain('row-shaking'))
    })
  })
})
