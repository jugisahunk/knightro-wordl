import { onUnmounted } from 'vue'
import bellUrl from '@/assets/audio/bell.wav'
import riverManUrl from '@/assets/audio/river-man.wav'

export function useAudio() {
  const bg = new Audio(riverManUrl)
  bg.loop = true
  bg.volume = 0.4

  const bell = new Audio(bellUrl)

  let bgStarted = false

  function startBackground(): void {
    if (bgStarted) return
    bgStarted = true
    bg.play().catch(() => {
      // autoplay blocked — silently ignore
    })
  }

  function playBell(): void {
    bell.currentTime = 0
    bell.play().catch(() => {})
  }

  onUnmounted(() => {
    bg.pause()
    bg.src = ''
    bell.src = ''
  })

  return { startBackground, playBell }
}
