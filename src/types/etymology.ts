export interface EtymologyEntry {
  pos: string            // part of speech: "noun", "verb", "adjective"
  definition: string     // real definition (no placeholders)
  origin: string         // brief origin: e.g. "Old English dūstig"
  firstUsed?: string     // era of first recorded use: e.g. "13th century" or "circa 1823" (populated in Story B)
  evolution?: string     // how the word's form or meaning changed over time (populated in Story B)
  relatedWords?: string[]// cognates, derivatives, or siblings: e.g. ["DUSK", "DUST"] (populated in Story B)
  joke?: string          // one-liner involving the word (populated in Story B)
}

export type EtymologyMap = Record<string, EtymologyEntry>
