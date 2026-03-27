import { onMounted, onUnmounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/useSettingsStore'
import bellUrl from '@/assets/audio/bell.wav'
import riverManUrl from '@/assets/audio/river-man.wav'

export function useAudio() {
  const settingsStore = useSettingsStore()

  const bg = new Audio(riverManUrl)
  bg.loop = true
  bg.volume = 0.4

  const bell = new Audio(bellUrl)

  let bgStarted = false

  function prefersReducedMotion(): boolean {
    return typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  function startBackground(): void {
    if (prefersReducedMotion()) return
    if (!settingsStore.musicEnabled) return
    if (bgStarted) return
    bgStarted = true
    bg.play().catch(() => {
      // autoplay blocked — reset so a future user-gesture call can retry
      bgStarted = false
    })
  }

  function stopBackground(): void {
    try {
      bg.pause()
      bg.currentTime = 0
    } catch {
      // DOMException if audio element is in HAVE_NOTHING state
    }
    bgStarted = false
  }

  onMounted(() => {
    if (settingsStore.musicEnabled) startBackground()
  })

  function playBell(): void {
    if (prefersReducedMotion()) return
    bell.currentTime = 0
    bell.play().catch(() => {})
  }

  watch(() => settingsStore.musicEnabled, (enabled) => {
    if (enabled) {
      startBackground()
    } else {
      stopBackground()
    }
  })

  onUnmounted(() => {
    bg.pause()
    bg.src = ''
    bell.src = ''
  })

  return { startBackground, stopBackground, playBell }
}
