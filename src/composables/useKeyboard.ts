import { onMounted, onUnmounted } from 'vue'

export function useKeyboard(onKey: (key: string) => void): void {
  function handleKeydown(event: KeyboardEvent): void {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return
    const { key } = event
    if (/^[a-zA-Z]$/.test(key)) {
      onKey(key.toLowerCase())
    } else if (key === 'Enter' || key === 'Backspace') {
      event.preventDefault()
      onKey(key)
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
}
