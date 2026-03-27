import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

interface MockAudioInstance {
  loop: boolean
  volume: number
  currentTime: number
  src: string
  play: ReturnType<typeof vi.fn>
  pause: ReturnType<typeof vi.fn>
}

let instances: MockAudioInstance[] = []

class MockAudio implements MockAudioInstance {
  loop = false
  volume = 1
  currentTime = 0
  src = ''
  play = vi.fn().mockResolvedValue(undefined)
  pause = vi.fn()
  constructor(_src?: string) {
    if (_src !== undefined) this.src = _src
    instances.push(this)
  }
}

vi.stubGlobal('Audio', MockAudio)

// Mock matchMedia to report reduced-motion BEFORE useAudio loads
vi.stubGlobal('matchMedia', (query: string) => ({
  matches: query === '(prefers-reduced-motion: reduce)',
  addListener: vi.fn(),
  removeListener: vi.fn(),
}))

const { useAudio } = await import('./useAudio')

afterAll(() => {
  vi.unstubAllGlobals()
})

function mountWithAudio() {
  let api: ReturnType<typeof useAudio> | undefined
  const Comp = defineComponent({
    setup() {
      api = useAudio()
    },
    template: '<div />',
  })
  const wrapper = mount(Comp)
  return { wrapper, api: api! }
}

describe('useAudio — prefers-reduced-motion: reduce', () => {
  beforeEach(() => {
    instances = []
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('startBackground does not play when reduced motion is active', () => {
    const { wrapper, api } = mountWithAudio()
    const bg = instances[0]
    api.startBackground()
    expect(bg.play).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('playBell does not play when reduced motion is active', () => {
    const { wrapper, api } = mountWithAudio()
    const bell = instances[1]
    api.playBell()
    expect(bell.play).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
