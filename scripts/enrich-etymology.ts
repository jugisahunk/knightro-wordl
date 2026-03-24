/**
 * enrich-etymology.ts — One-time offline enrichment script
 * Calls the Claude API to populate firstUsed, evolution, relatedWords, and joke
 * for all stub entries in src/data/etymology.json.
 *
 * Run: ANTHROPIC_API_KEY=<key> npx tsx scripts/enrich-etymology.ts
 *
 * Resume-safe: progress is saved to scripts/enrich-progress.json after each batch.
 * Re-running skips already-enriched words.
 */

import { readFileSync, writeFileSync, renameSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import Anthropic from '@anthropic-ai/sdk'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ─── Configuration ────────────────────────────────────────────────────────────

const BATCH_SIZE = 20           // words per Claude API call
const DELAY_MS = 500            // ms between batches (rate-limit buffer)
const MODEL = 'claude-haiku-4-5-20251001'  // cheapest model; adequate for structured data
const PROGRESS_FILE = resolve(__dirname, 'enrich-progress.json')
const ETYMOLOGY_FILE = resolve(__dirname, '..', 'src', 'data', 'etymology.json')

// ─── Types ────────────────────────────────────────────────────────────────────

interface EtymologyEntry {
  pos: string
  definition: string
  origin: string
  firstUsed?: string
  evolution?: string
  relatedWords?: string[]
  joke?: string
}

interface EnrichedEntry extends EtymologyEntry {
  firstUsed: string
  evolution: string
  relatedWords: string[]
  joke: string
}

interface ProgressCache {
  enriched: Record<string, EnrichedEntry>  // word → enriched entry (already done)
  failed: string[]                          // words that errored after retries
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadProgress(): ProgressCache {
  if (existsSync(PROGRESS_FILE)) {
    const raw = readFileSync(PROGRESS_FILE, 'utf8')
    try {
      return JSON.parse(raw) as ProgressCache
    } catch {
      console.error('[enrich-etymology] ERROR: Progress file is corrupt. Delete scripts/enrich-progress.json and retry.')
      process.exit(1)
    }
  }
  return { enriched: {}, failed: [] }
}

function saveProgress(cache: ProgressCache): void {
  const tmp = PROGRESS_FILE + '.tmp'
  writeFileSync(tmp, JSON.stringify(cache, null, 2), 'utf8')
  renameSync(tmp, PROGRESS_FILE)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function buildPrompt(words: string[]): string {
  return `You are a linguistics expert. For each word below, return a JSON object with exactly these fields:
- pos: part of speech (noun, verb, adjective, adverb, etc.)
- definition: a clear, accurate 1–2 sentence definition (not a placeholder)
- origin: brief etymology — root language and root word/phrase (e.g. "Old English 'screpan'")
- firstUsed: era of first recorded use (e.g. "14th century", "circa 1823", "Old English period")
- evolution: 1–2 sentences on how the word's form or meaning changed over time
- relatedWords: array of 2–4 related 5-letter English words (cognates, derivatives, or siblings — all UPPERCASE, all must be real English words, do NOT include the target word itself)
- joke: a short, clever one-liner that uses or plays on the word

IMPORTANT: relatedWords must contain only real, common English words of exactly 5 letters, all uppercase. Do NOT include the target word in its own relatedWords array.

Return ONLY a JSON object mapping each word to its entry. No markdown, no preamble, no trailing text.

Words: ${words.join(', ')}`
}

function isValidEntry(entry: unknown, word: string): entry is EnrichedEntry {
  if (typeof entry !== 'object' || entry === null) return false
  const e = entry as Record<string, unknown>
  if (
    typeof e.pos !== 'string' || e.pos.trim() === '' ||
    typeof e.definition !== 'string' || e.definition.trim() === '' ||
    typeof e.origin !== 'string' || e.origin.trim() === '' ||
    typeof e.firstUsed !== 'string' || e.firstUsed.trim() === '' ||
    typeof e.evolution !== 'string' || e.evolution.trim() === '' ||
    typeof e.joke !== 'string' || e.joke.trim() === ''
  ) return false
  if (!Array.isArray(e.relatedWords) || (e.relatedWords as unknown[]).length === 0) return false
  // Each relatedWords element must be a non-empty string that is not the word itself
  const related = e.relatedWords as unknown[]
  return related.every(w => typeof w === 'string' && (w as string).trim() !== '' && w !== word)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[enrich-etymology] ERROR: ANTHROPIC_API_KEY environment variable is not set')
    process.exit(1)
  }

  const client = new Anthropic({ apiKey })

  // Load existing etymology data
  const rawEtymology = readFileSync(ETYMOLOGY_FILE, 'utf8')
  const etymology = JSON.parse(rawEtymology) as Record<string, EtymologyEntry>
  const allWords = Object.keys(etymology).sort()

  console.log(`[enrich-etymology] Total words in etymology.json: ${allWords.length}`)

  // Load progress cache
  const progressCache = loadProgress()
  const alreadyEnriched = new Set(Object.keys(progressCache.enriched))
  const alreadyFailed = new Set(progressCache.failed)

  // Determine words still needing enrichment
  const toEnrich = allWords.filter(w => !alreadyEnriched.has(w) && !alreadyFailed.has(w))

  console.log(`[enrich-etymology] Already enriched: ${alreadyEnriched.size}`)
  console.log(`[enrich-etymology] Previously failed: ${alreadyFailed.size}`)
  console.log(`[enrich-etymology] Remaining to enrich: ${toEnrich.length}`)

  if (toEnrich.length === 0) {
    console.log('[enrich-etymology] Nothing to do — all words are enriched or marked failed.')
    return
  }

  // Process in batches
  let processedCount = 0

  for (let i = 0; i < toEnrich.length; i += BATCH_SIZE) {
    const batch = toEnrich.slice(i, i + BATCH_SIZE)

    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 8192,
        messages: [{ role: 'user', content: buildPrompt(batch) }],
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        console.warn(`[enrich-etymology] Unexpected response type for batch at index ${i}; adding to failed`)
        for (const w of batch) progressCache.failed.push(w)
        saveProgress(progressCache)
        continue
      }

      let parsed: Record<string, unknown>
      try {
        // Strip any accidental markdown fences
        const text = content.text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '')
        parsed = JSON.parse(text) as Record<string, unknown>
      } catch {
        console.warn(`[enrich-etymology] JSON parse failed for batch at index ${i}; adding batch to failed`)
        for (const w of batch) progressCache.failed.push(w)
        saveProgress(progressCache)
        continue
      }

      // Validate and store each word in batch
      let batchSuccessCount = 0
      for (const word of batch) {
        const entry = parsed[word]
        if (isValidEntry(entry, word)) {
          progressCache.enriched[word] = entry
          batchSuccessCount++
        } else {
          console.warn(`[enrich-etymology] Invalid/incomplete entry for ${word}; adding to failed`)
          progressCache.failed.push(word)
        }
      }

      processedCount += batchSuccessCount
      saveProgress(progressCache)

      const totalDone = alreadyEnriched.size + processedCount
      const pct = ((totalDone / allWords.length) * 100).toFixed(1)
      console.log(`[enrich-etymology] ${totalDone}/${allWords.length} enriched (${pct}%)`)

    } catch (err) {
      console.warn(`[enrich-etymology] API error for batch at index ${i}:`, err)
      for (const w of batch) progressCache.failed.push(w)
      saveProgress(progressCache)
    }

    // Rate-limit buffer between batches
    if (i + BATCH_SIZE < toEnrich.length) {
      await sleep(DELAY_MS)
    }
  }

  // ─── Final output: merge enriched entries back into etymology.json ───────────

  console.log('\n[enrich-etymology] Merging enriched entries into etymology.json...')

  const merged: Record<string, EtymologyEntry> = { ...etymology }
  for (const [word, entry] of Object.entries(progressCache.enriched)) {
    merged[word] = entry
  }

  // Sort by key for stable diffs
  const sorted: Record<string, EtymologyEntry> = {}
  for (const key of Object.keys(merged).sort()) {
    sorted[key] = merged[key]
  }

  writeFileSync(ETYMOLOGY_FILE, JSON.stringify(sorted, null, 2), 'utf8')

  // ─── Summary ─────────────────────────────────────────────────────────────────

  const enrichedCount = Object.keys(progressCache.enriched).length
  const failedCount = progressCache.failed.length
  const stubsRemaining = allWords.filter(w => {
    const e = sorted[w]
    return !e.firstUsed || !e.evolution || !e.joke || !e.relatedWords?.length
  }).length

  console.log('\n[enrich-etymology] ─── Summary ───────────────────────────────')
  console.log(`  Total entries:    ${allWords.length}`)
  console.log(`  Enriched:         ${enrichedCount}`)
  console.log(`  Failed:           ${failedCount}`)
  console.log(`  Stubs remaining:  ${stubsRemaining}`)

  if (failedCount > 0) {
    console.warn(`\n[enrich-etymology] ⚠️  Run again to retry ${failedCount} failed words`)
    console.warn(`  Failed words: ${progressCache.failed.slice(0, 20).join(', ')}${failedCount > 20 ? '...' : ''}`)
  }

  if (stubsRemaining === 0) {
    console.log('\n[enrich-etymology] ✅ All entries fully enriched!')
  } else {
    console.warn(`\n[enrich-etymology] ⚠️  ${stubsRemaining} entries still have stub/empty fields`)
  }
}

main().catch(err => {
  console.error('[enrich-etymology] Fatal error:', err)
  process.exit(1)
})
