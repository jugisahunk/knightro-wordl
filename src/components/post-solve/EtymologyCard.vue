<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import type { EtymologyEntry } from '@/types/etymology'

const props = defineProps<{
  word: string
  entry: EtymologyEntry | null
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const cardRef = ref<HTMLElement | null>(null)

const ariaLabel = computed(() => `Etymology for ${props.word}`)

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape' || event.key === 'Enter') {
    emit('dismiss')
  }
}

onMounted(() => {
  cardRef.value?.focus()
})
</script>

<template>
  <div class="etymology-backdrop" @click.self="emit('dismiss')">
    <div
      ref="cardRef"
      class="etymology-card"
      role="article"
      :aria-label="ariaLabel"
      tabindex="0"
      @keydown="onKeyDown"
    >
      <h2 class="etymology-word">{{ word }}</h2>
      <p v-if="entry" class="etymology-pos">{{ entry.pos }}</p>
      <p v-if="entry" class="etymology-definition">{{ entry.definition }}</p>
      <p class="etymology-origin">
        {{ entry ? entry.origin : 'No etymology on record for this word.' }}
      </p>
      <p v-if="entry && entry.firstUsed" class="etymology-first-used">{{ entry.firstUsed }}</p>
      <p v-if="entry && entry.evolution" class="etymology-evolution">{{ entry.evolution }}</p>
      <p v-if="entry && entry.relatedWords && entry.relatedWords.length" class="etymology-related">Related: {{ entry.relatedWords.join(', ') }}</p>
      <p v-if="entry && entry.joke" class="etymology-joke">😄 {{ entry.joke }}</p>
    </div>
  </div>
</template>

<style scoped>
.etymology-backdrop {
  display: flex;
  align-items: center;
  justify-content: center;
}

.etymology-card {
  max-width: 480px;
  width: 100%;
  padding: 32px;
  background-color: var(--color-bg-surface);
  outline: none;
}

.etymology-word {
  font-family: 'Lora', serif;
  font-weight: 700;
  font-size: 1.75rem;
  text-transform: uppercase;
  color: var(--color-text-primary);
}

.etymology-pos {
  font-family: 'Lora', serif;
  font-weight: 400;
  font-style: italic;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.etymology-definition {
  font-family: 'Lora', serif;
  font-weight: 400;
  font-size: 1.0625rem;
  line-height: 1.65;
  color: var(--color-text-primary);
}

.etymology-origin {
  font-family: 'Lora', serif;
  font-weight: 400;
  font-style: italic;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--color-text-secondary);
}

.etymology-first-used {
  font-family: 'Lora', serif;
  font-weight: 400;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin-top: 8px;
}

.etymology-evolution {
  font-family: 'Lora', serif;
  font-weight: 400;
  font-style: italic;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--color-text-secondary);
  margin-top: 8px;
}

.etymology-related {
  font-family: 'Lora', serif;
  font-weight: 400;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  letter-spacing: 0.02em;
}

.etymology-joke {
  font-family: 'Lora', serif;
  font-weight: 400;
  font-style: italic;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--color-text-primary);
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-tile-border-empty);
}
</style>
