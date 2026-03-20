/**
 * validate-data.ts — Build-time data validation script (prebuild hook)
 * Validates src/data/valid-words.json, src/data/answers.json, src/data/etymology.json
 * Exits 0 always; warns (does not fail) on missing etymology entries.
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')
const dataDir = resolve(projectRoot, 'src', 'data')

let hasError = false
let warningCount = 0

function error(msg: string): void {
  console.error(`[validate-data] ❌ ERROR: ${msg}`)
  hasError = true
}

function warn(msg: string): void {
  console.warn(`[validate-data] ⚠️  WARNING: ${msg}`)
  warningCount++
}

function info(msg: string): void {
  console.log(`[validate-data] ✅ ${msg}`)
}

// ─── Load JSON file safely ────────────────────────────────────────────────────

function loadJson<T>(filename: string): T | null {
  const filepath = resolve(dataDir, filename)
  if (!existsSync(filepath)) {
    error(`${filename} not found at ${filepath}. Run: npx tsx scripts/compile-data.ts`)
    return null
  }
  try {
    return JSON.parse(readFileSync(filepath, 'utf8')) as T
  } catch (e) {
    error(`${filename} is not valid JSON: ${e instanceof Error ? e.message : String(e)}`)
    return null
  }
}

// ─── Validate valid-words.json ────────────────────────────────────────────────

const validWords = loadJson<unknown>('valid-words.json')

if (validWords !== null) {
  if (!Array.isArray(validWords)) {
    error('valid-words.json must be a JSON array')
  } else {
    const words = validWords as unknown[]

    // All entries must be lowercase 5-letter strings
    const invalidEntries = words.filter(
      w => typeof w !== 'string' || w.length !== 5 || !/^[a-z]+$/.test(w),
    )
    if (invalidEntries.length > 0) {
      error(
        `valid-words.json has ${invalidEntries.length} invalid entries (must be lowercase 5-letter strings): ` +
          `${invalidEntries.slice(0, 3).join(', ')}`,
      )
    }

    // No duplicates
    const unique = new Set(words)
    if (unique.size !== words.length) {
      error(`valid-words.json has ${words.length - unique.size} duplicate entries`)
    }

    // Minimum count
    if (words.length < 10000) {
      error(`valid-words.json has only ${words.length} entries (minimum 10,000 required)`)
    } else {
      info(`valid-words.json: ${words.length} entries — all valid`)
    }
  }
}

// ─── Validate answers.json ────────────────────────────────────────────────────

const answers = loadJson<unknown>('answers.json')

if (answers !== null && validWords !== null && Array.isArray(validWords)) {
  if (!Array.isArray(answers)) {
    error('answers.json must be a JSON array')
  } else {
    const answerList = answers as unknown[]
    const validSet = new Set(validWords as string[])

    // All entries must be lowercase 5-letter strings
    const invalidEntries = answerList.filter(
      w => typeof w !== 'string' || w.length !== 5 || !/^[a-z]+$/.test(w),
    )
    if (invalidEntries.length > 0) {
      error(
        `answers.json has ${invalidEntries.length} invalid entries: ${invalidEntries.slice(0, 3).join(', ')}`,
      )
    }

    // Every answer must be in valid-words (only check string entries to avoid misleading type-error duplicates)
    const missingFromValid = (answerList as unknown[]).filter(
      w => typeof w === 'string' && !validSet.has(w),
    ) as string[]
    if (missingFromValid.length > 0) {
      error(
        `answers.json has ${missingFromValid.length} words not in valid-words.json: ` +
          `${missingFromValid.slice(0, 5).join(', ')}`,
      )
    }

    // Minimum count
    if (answerList.length < 2000) {
      error(`answers.json has only ${answerList.length} entries (minimum 2,000 required)`)
    } else {
      info(`answers.json: ${answerList.length} entries — all valid and in valid-words`)
    }
  }
}

// ─── Validate etymology.json ──────────────────────────────────────────────────

const etymology = loadJson<unknown>('etymology.json')

if (etymology !== null) {
  if (typeof etymology !== 'object' || Array.isArray(etymology)) {
    error('etymology.json must be a JSON object (not an array)')
  } else {
    const etymObj = etymology as Record<string, unknown>
    const keys = Object.keys(etymObj)

    // Validate shape of each entry
    let malformedCount = 0
    for (const [key, value] of Object.entries(etymObj)) {
      if (
        typeof value !== 'object' ||
        value === null ||
        Array.isArray(value) ||
        typeof (value as Record<string, unknown>).pos !== 'string' ||
        typeof (value as Record<string, unknown>).definition !== 'string' ||
        typeof (value as Record<string, unknown>).origin !== 'string'
      ) {
        malformedCount++
        if (malformedCount <= 3) {
          error(`etymology.json entry "${key}" must have { pos: string, definition: string, origin: string }`)
        }
      }

      // Keys must be uppercase
      if (key !== key.toUpperCase()) {
        error(`etymology.json key "${key}" must be uppercase`)
      }
    }

    if (malformedCount > 3) {
      error(`...and ${malformedCount - 3} more malformed etymology entries`)
    }

    if (malformedCount === 0) {
      info(`etymology.json: ${keys.length} entries — all correctly shaped`)
    }
  }
}

// ─── Check etymology coverage against answers ─────────────────────────────────

if (answers !== null && etymology !== null && Array.isArray(answers) && typeof etymology === 'object') {
  const etymObj = etymology as Record<string, unknown>
  const answerList = answers as string[]

  const missingEtymology = answerList.filter(w => !etymObj[w.toUpperCase()])
  if (missingEtymology.length > 0) {
    for (const word of missingEtymology) {
      warn(`"${word.toUpperCase()}" in answers.json has no etymology entry`)
    }
  } else {
    info('etymology coverage: all answer words have etymology entries ✓')
  }
}

// ─── Final summary ────────────────────────────────────────────────────────────

console.log('')
if (hasError) {
  console.error('[validate-data] ❌ Validation FAILED — fix errors above before building')
  process.exit(1)
} else if (warningCount > 0) {
  console.log(`[validate-data] ✅ Validation passed with ${warningCount} warning(s) — see above`)
} else {
  console.log('[validate-data] ✅ Validation passed — all data files are correct')
}
