<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DailyGameRecord } from '@/types/persistence'
import type { EtymologyEntry } from '@/types/etymology'
import type { GuessResult } from '@/types/game'
import { useGameEngine } from '@/composables/useGameEngine'
import etymologyJson from '@/data/etymology.json'

const props = defineProps<{
  records: DailyGameRecord[]
}>()

const { getAnswerForDate, getTileStates } = useGameEngine()

const selectedDate = ref<string | null>(null)

const reversedRecords = computed(() => [...props.records].reverse())

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function resultLabel(record: DailyGameRecord): string {
  if (record.solved) {
    return `✓ ${record.guesses.length}/6`
  }
  return '✗ 6/6'
}

function cardAriaLabel(record: DailyGameRecord): string {
  const date = formatDate(record.date)
  const answer = getAnswerForDate(record.date).toUpperCase()
  if (record.solved) {
    return `${date} — ${answer} — Solved in ${record.guesses.length} guesses`
  }
  return `${date} — ${answer} — Failed`
}

function getDetailTileStates(record: DailyGameRecord): GuessResult[] {
  const answer = getAnswerForDate(record.date)
  return record.guesses.map((guess) => getTileStates(guess, answer))
}

function getEtymology(date: string): EtymologyEntry | null {
  const answer = getAnswerForDate(date)
  const data = etymologyJson as Record<string, EtymologyEntry>
  return data[answer.toUpperCase()] ?? null
}

function tileAriaLabel(letter: string, state: string): string {
  return `${letter.toUpperCase()} ${state}`
}

function selectCard(date: string): void {
  selectedDate.value = date
}

function goBack(): void {
  selectedDate.value = null
}

const selectedRecord = computed(() => {
  if (!selectedDate.value) return null
  return props.records.find((r) => r.date === selectedDate.value) ?? null
})

const selectedAnswer = computed(() => {
  if (!selectedDate.value) return ''
  return getAnswerForDate(selectedDate.value).toUpperCase()
})

const selectedTileStates = computed(() => {
  if (!selectedRecord.value) return []
  return getDetailTileStates(selectedRecord.value)
})

const selectedEtymology = computed(() => {
  if (!selectedDate.value) return null
  return getEtymology(selectedDate.value)
})
</script>

<template>
  <section
    role="region"
    aria-label="Past Puzzles"
    class="past-puzzles"
    data-testid="past-puzzles-section"
  >
    <h2 class="section-heading">Past Puzzles</h2>

    <p
      v-if="records.length === 0"
      role="status"
      class="empty-message"
      data-testid="past-puzzles-empty"
    >
      Play your first puzzle to start browsing your history.
    </p>

    <template v-else>
      <!-- Detail view -->
      <div v-if="selectedRecord" data-testid="past-puzzle-detail">
        <button
          type="button"
          class="back-button"
          data-testid="past-puzzle-back"
          @click="goBack"
        >← Past Puzzles</button>

        <div class="detail-header">
          <span class="detail-date">{{ formatDate(selectedRecord.date) }}</span>
          <span
            class="card-result"
            :class="selectedRecord.solved ? 'card-result--solved' : 'card-result--failed'"
          >{{ resultLabel(selectedRecord) }}</span>
        </div>

        <div class="detail-answer">{{ selectedAnswer }}</div>

        <!-- Mini-board -->
        <div class="mini-board" data-testid="past-puzzle-detail-board">
          <div
            v-for="(row, rowIdx) in selectedTileStates"
            :key="rowIdx"
            class="mini-board-row"
          >
            <span
              v-for="(state, colIdx) in row"
              :key="colIdx"
              class="mini-tile"
              :class="`mini-tile--${state}`"
              :aria-label="tileAriaLabel(selectedRecord.guesses[rowIdx]?.[colIdx] ?? '?', state)"
              data-testid="past-puzzle-tile"
            >{{ (selectedRecord.guesses[rowIdx]?.[colIdx] ?? '?').toUpperCase() }}</span>
          </div>
        </div>

        <!-- Etymology inline -->
        <div class="etymology-inline" data-testid="past-puzzle-etymology">
          <h3 class="etymology-word">{{ selectedAnswer }}</h3>
          <p v-if="selectedEtymology" class="etymology-pos">{{ selectedEtymology.pos }}</p>
          <p v-if="selectedEtymology" class="etymology-definition">{{ selectedEtymology.definition }}</p>
          <p class="etymology-origin">
            {{ selectedEtymology ? selectedEtymology.origin : 'No etymology on record for this word.' }}
          </p>
          <p v-if="selectedEtymology && selectedEtymology.firstUsed" class="etymology-first-used">{{ selectedEtymology.firstUsed }}</p>
          <p v-if="selectedEtymology && selectedEtymology.evolution" class="etymology-evolution">{{ selectedEtymology.evolution }}</p>
          <p v-if="selectedEtymology && selectedEtymology.relatedWords && selectedEtymology.relatedWords.length" class="etymology-related">Related: {{ selectedEtymology.relatedWords.join(', ') }}</p>
          <p v-if="selectedEtymology && selectedEtymology.joke" class="etymology-joke">😄 {{ selectedEtymology.joke }}</p>
        </div>
      </div>

      <!-- List view -->
      <div v-else class="puzzle-list">
        <button
          v-for="record in reversedRecords"
          :key="record.date"
          type="button"
          class="puzzle-card"
          data-testid="past-puzzle-card"
          :aria-label="cardAriaLabel(record)"
          @click="selectCard(record.date)"
        >
          <div class="card-header">
            <span class="card-date" data-testid="past-puzzle-date">{{ formatDate(record.date) }}</span>
            <span
              class="card-result"
              data-testid="past-puzzle-result"
              :class="record.solved ? 'card-result--solved' : 'card-result--failed'"
            >{{ resultLabel(record) }}</span>
          </div>
          <span class="card-answer" data-testid="past-puzzle-answer">{{ getAnswerForDate(record.date).toUpperCase() }}</span>
        </button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.past-puzzles {
  margin-top: 16px;
}

.section-heading {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 12px;
}

.empty-message {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  text-align: center;
  margin-top: 24px;
}

.puzzle-list {
  display: flex;
  flex-direction: column;
}

.puzzle-card {
  display: block;
  width: 100%;
  text-align: left;
  background-color: var(--color-bg-surface);
  border: none;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
}

.puzzle-card:hover {
  filter: brightness(1.1);
}

.puzzle-card:focus-visible {
  outline: 2px solid var(--color-text-primary);
  outline-offset: 2px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.card-date {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.card-answer {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text-primary);
}

.card-result {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
}

.card-result--solved {
  color: var(--color-accent-streak);
}

.card-result--failed {
  color: var(--color-text-secondary);
}

/* Detail view */
.back-button {
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  padding: 4px 0;
  margin-bottom: 12px;
}

.back-button:hover {
  color: var(--color-text-primary);
}

.back-button:focus-visible {
  outline: 2px solid var(--color-text-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.detail-date {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.detail-answer {
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--color-text-primary);
  text-transform: uppercase;
  margin-bottom: 12px;
}

/* Mini-board */
.mini-board {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 16px;
}

.mini-board-row {
  display: flex;
  gap: 2px;
}

.mini-tile {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 0.875rem;
  color: #fff;
  border-radius: 2px;
}

.mini-tile--correct {
  background-color: var(--color-tile-correct);
}

.mini-tile--present {
  background-color: var(--color-tile-present);
}

.mini-tile--absent {
  background-color: var(--color-tile-absent);
}

/* Etymology inline */
.etymology-inline {
  background-color: var(--color-bg-surface);
  border-radius: 8px;
  padding: 24px;
  margin-top: 8px;
}

.etymology-word {
  font-family: 'Lora', serif;
  font-weight: 700;
  font-size: 1.75rem;
  text-transform: uppercase;
  color: var(--color-text-primary);
  margin: 0 0 8px;
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

@media (prefers-reduced-motion: reduce) {
  .past-puzzles * {
    animation: none !important;
    transition: none !important;
  }
}
</style>
