export interface EtymologyEntry {
  pos: string
  definition: string
  origin: string
}

export type EtymologyMap = Record<string, EtymologyEntry>
