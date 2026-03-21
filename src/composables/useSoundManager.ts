import bowlSolveUrl from '@/assets/audio/bowl-solve.mp3'
import bowlFailUrl from '@/assets/audio/bowl-fail.mp3'

export function useSoundManager() {
  const solve = new Audio(bowlSolveUrl)
  const fail = new Audio(bowlFailUrl)

  function trigger(outcome: 'won' | 'lost'): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const clip = outcome === 'won' ? solve : fail
    clip.currentTime = 0
    clip.play().catch(() => {})
  }

  return { trigger }
}
