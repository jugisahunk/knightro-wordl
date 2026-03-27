import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Mock Audio before importing useAudio
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

// Default matchMedia mock — no reduced motion
vi.stubGlobal('matchMedia', (query: string) => ({
  matches: false,
  addListener: vi.fn(),
  removeListener: vi.fn(),
}))

// Import after stubbing
const { useAudio } = await import('./useAudio')
const { useSettingsStore } = await import('@/stores/useSettingsStore')

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

describe('useAudio', () => {
  beforeEach(() => {
    instances = []
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('creates two Audio instances on setup', () => {
    const { wrapper } = mountWithAudio()
    expect(instances).toHaveLength(2)
    wrapper.unmount()
  })

  it('sets background to loop at 0.4 volume', () => {
    const { wrapper } = mountWithAudio()
    const bg = instances[0]
    expect(bg.loop).toBe(true)
    expect(bg.volume).toBe(0.4)
    wrapper.unmount()
  })

  it('auto-starts background music on mount when musicEnabled is already true', () => {
    const settings = useSettingsStore()
    settings.setMusicEnabled(true)
    const { wrapper } = mountWithAudio()
    const bg = instances[0]
    expect(bg.play).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('startBackground does not play when musicEnabled is false', () => {
    const { wrapper, api } = mountWithAudio()
    const bg = instances[0]
    api.startBackground()
    expect(bg.play).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('startBackground calls play() when musicEnabled is true', () => {
    const settings = useSettingsStore()
    settings.setMusicEnabled(true)
    const { wrapper, api } = mountWithAudio()
    const bg = instances[0]
    api.startBackground()
    expect(bg.play).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('startBackground is idempotent — play() only called once across multiple calls', () => {
    const settings = useSettingsStore()
    settings.setMusicEnabled(true)
    const { wrapper, api } = mountWithAudio()
    const bg = instances[0]
    api.startBackground()
    api.startBackground()
    api.startBackground()
    expect(bg.play).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('stopBackground pauses and resets background audio', () => {
    const settings = useSettingsStore()
    settings.setMusicEnabled(true)
    const { wrapper, api } = mountWithAudio()
    const bg = instances[0]
    api.startBackground()
    api.stopBackground()
    expect(bg.pause).toHaveBeenCalledTimes(1)
    expect(bg.currentTime).toBe(0)
    wrapper.unmount()
  })

  it('watch reactively starts music when musicEnabled toggled on', async () => {
    const settings = useSettingsStore()
    const { wrapper } = mountWithAudio()
    const bg = instances[0]
    expect(bg.play).not.toHaveBeenCalled()
    settings.setMusicEnabled(true)
    await nextTick()
    expect(bg.play).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('watch reactively stops music when musicEnabled toggled off', async () => {
    const settings = useSettingsStore()
    settings.setMusicEnabled(true)
    const { wrapper } = mountWithAudio()
    const bg = instances[0]
    settings.setMusicEnabled(false)
    await nextTick()
    expect(bg.pause).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('playBell resets currentTime to 0 and calls play()', () => {
    const { wrapper, api } = mountWithAudio()
    const bell = instances[1]
    bell.currentTime = 5
    api.playBell()
    expect(bell.currentTime).toBe(0)
    expect(bell.play).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('playBell can be called multiple times', () => {
    const { wrapper, api } = mountWithAudio()
    const bell = instances[1]
    api.playBell()
    api.playBell()
    expect(bell.play).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('playBell plays regardless of musicEnabled setting', () => {
    const { wrapper, api } = mountWithAudio()
    const bell = instances[1]
    api.playBell()
    expect(bell.play).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('pauses background and clears src on unmount', () => {
    const { wrapper } = mountWithAudio()
    const bg = instances[0]
    wrapper.unmount()
    expect(bg.pause).toHaveBeenCalledTimes(1)
    expect(bg.src).toBe('')
  })

  it('clears bell src on unmount', () => {
    const { wrapper } = mountWithAudio()
    const bell = instances[1]
    wrapper.unmount()
    expect(bell.src).toBe('')
  })
})
