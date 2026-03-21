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
  constructor(src?: string) {
    if (src !== undefined) this.src = src
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
    const solve = instances.find((i) => i.src.includes('bowl-solve'))!
    const fail = instances.find((i) => i.src.includes('bowl-fail'))!
    solve.currentTime = 5
    trigger('won')
    expect(solve.currentTime).toBe(0)
    expect(solve.play).toHaveBeenCalledTimes(1)
    expect(fail.play).not.toHaveBeenCalled()
  })

  it('trigger("lost") resets currentTime and plays fail clip', () => {
    const { trigger } = useSoundManager()
    const solve = instances.find((i) => i.src.includes('bowl-solve'))!
    const fail = instances.find((i) => i.src.includes('bowl-fail'))!
    fail.currentTime = 5
    trigger('lost')
    expect(fail.currentTime).toBe(0)
    expect(fail.play).toHaveBeenCalledTimes(1)
    expect(solve.play).not.toHaveBeenCalled()
  })

  it('trigger("won") does not play when prefers-reduced-motion is active', () => {
    mockMatchMedia(true)
    const { trigger } = useSoundManager()
    trigger('won')
    instances.forEach((i) => expect(i.play).not.toHaveBeenCalled())
  })

  it('trigger("lost") does not play when prefers-reduced-motion is active', () => {
    mockMatchMedia(true)
    const { trigger } = useSoundManager()
    trigger('lost')
    instances.forEach((i) => expect(i.play).not.toHaveBeenCalled())
  })

  it('trigger can be called multiple times — each call plays independently', () => {
    const { trigger } = useSoundManager()
    const solve = instances.find((i) => i.src.includes('bowl-solve'))!
    trigger('won')
    solve.currentTime = 5
    trigger('won')
    expect(solve.currentTime).toBe(0)
    expect(solve.play).toHaveBeenCalledTimes(2)
  })
})
