import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GameTile from './GameTile.vue'

describe('GameTile', () => {
  describe('empty state', () => {
    it('renders with aria-hidden true', () => {
      const tile = mount(GameTile, { props: { letter: '', state: 'empty', revealIndex: 0 } })
      expect(tile.attributes('aria-hidden')).toBe('true')
    })

    it('has game-tile class with 62px dimensions via CSS class', () => {
      const tile = mount(GameTile, { props: { letter: '', state: 'empty', revealIndex: 0 } })
      expect(tile.classes()).toContain('game-tile')
    })

    it('applies tile-state-empty class', () => {
      const tile = mount(GameTile, { props: { letter: '', state: 'empty', revealIndex: 0 } })
      expect(tile.classes()).toContain('tile-state-empty')
    })

    it('does not render a letter span when empty', () => {
      const tile = mount(GameTile, { props: { letter: '', state: 'empty', revealIndex: 0 } })
      expect(tile.find('.tile-letter').exists()).toBe(false)
    })

    it('has role="gridcell"', () => {
      const tile = mount(GameTile, { props: { letter: '', state: 'empty', revealIndex: 0 } })
      expect(tile.attributes('role')).toBe('gridcell')
    })
  })

  describe('filled state', () => {
    it('displays letter in uppercase', () => {
      const tile = mount(GameTile, { props: { letter: 'a', state: 'filled', revealIndex: 0 } })
      expect(tile.text()).toBe('A')
    })

    it('applies tile-state-filled class', () => {
      const tile = mount(GameTile, { props: { letter: 'a', state: 'filled', revealIndex: 0 } })
      expect(tile.classes()).toContain('tile-state-filled')
    })

    it('has aria-hidden true for filled state', () => {
      const tile = mount(GameTile, { props: { letter: 'a', state: 'filled', revealIndex: 0 } })
      expect(tile.attributes('aria-hidden')).toBe('true')
    })

    it('does not set aria-label on filled state', () => {
      const tile = mount(GameTile, { props: { letter: 'a', state: 'filled', revealIndex: 0 } })
      expect(tile.attributes('aria-label')).toBeUndefined()
    })
  })

  describe('correct state', () => {
    it('sets aria-label with uppercase letter and state', () => {
      const tile = mount(GameTile, { props: { letter: 'r', state: 'correct', revealIndex: 2 } })
      expect(tile.attributes('aria-label')).toBe('R, correct')
    })

    it('applies tile-state-correct class', () => {
      const tile = mount(GameTile, { props: { letter: 'r', state: 'correct', revealIndex: 0 } })
      expect(tile.classes()).toContain('tile-state-correct')
    })

    it('does not have aria-hidden', () => {
      const tile = mount(GameTile, { props: { letter: 'r', state: 'correct', revealIndex: 0 } })
      expect(tile.attributes('aria-hidden')).toBeUndefined()
    })

    it('displays the letter', () => {
      const tile = mount(GameTile, { props: { letter: 'r', state: 'correct', revealIndex: 0 } })
      expect(tile.find('.tile-letter').text()).toBe('R')
    })
  })

  describe('present state', () => {
    it('sets aria-label with uppercase letter and state', () => {
      const tile = mount(GameTile, { props: { letter: 'e', state: 'present', revealIndex: 1 } })
      expect(tile.attributes('aria-label')).toBe('E, present')
    })

    it('applies tile-state-present class', () => {
      const tile = mount(GameTile, { props: { letter: 'e', state: 'present', revealIndex: 0 } })
      expect(tile.classes()).toContain('tile-state-present')
    })
  })

  describe('absent state', () => {
    it('sets aria-label with uppercase letter and state', () => {
      const tile = mount(GameTile, { props: { letter: 's', state: 'absent', revealIndex: 3 } })
      expect(tile.attributes('aria-label')).toBe('S, absent')
    })

    it('applies tile-state-absent class', () => {
      const tile = mount(GameTile, { props: { letter: 's', state: 'absent', revealIndex: 0 } })
      expect(tile.classes()).toContain('tile-state-absent')
    })
  })

  describe('secondary indicator', () => {
    it('correct state renders indicator with ✓ content and aria-hidden', () => {
      const tile = mount(GameTile, { props: { letter: 'r', state: 'correct', revealIndex: 0 } })
      const indicator = tile.find('[data-testid="tile-indicator"]')
      expect(indicator.exists()).toBe(true)
      expect(indicator.text()).toBe('✓')
      expect(indicator.attributes('aria-hidden')).toBe('true')
    })

    it('present state renders indicator with · content and aria-hidden', () => {
      const tile = mount(GameTile, { props: { letter: 'e', state: 'present', revealIndex: 0 } })
      const indicator = tile.find('[data-testid="tile-indicator"]')
      expect(indicator.exists()).toBe(true)
      expect(indicator.text()).toBe('·')
      expect(indicator.attributes('aria-hidden')).toBe('true')
    })

    it('absent state renders no indicator', () => {
      const tile = mount(GameTile, { props: { letter: 's', state: 'absent', revealIndex: 0 } })
      expect(tile.find('[data-testid="tile-indicator"]').exists()).toBe(false)
    })

    it('filled state renders no indicator', () => {
      const tile = mount(GameTile, { props: { letter: 'a', state: 'filled', revealIndex: 0 } })
      expect(tile.find('[data-testid="tile-indicator"]').exists()).toBe(false)
    })

    it('empty state renders no indicator', () => {
      const tile = mount(GameTile, { props: { letter: '', state: 'empty', revealIndex: 0 } })
      expect(tile.find('[data-testid="tile-indicator"]').exists()).toBe(false)
    })
  })

  describe('revealIndex stagger', () => {
    it('accepts revealIndex 0-4 without errors', () => {
      for (let i = 0; i < 5; i++) {
        const tile = mount(GameTile, { props: { letter: 'a', state: 'filled', revealIndex: i } })
        expect(tile.exists()).toBe(true)
      }
    })
  })
})
