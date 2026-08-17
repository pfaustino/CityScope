import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  BURBANK_HATE_CRIME_NCIC,
  OPENJUSTICE_HATE_CRIME_URL,
  parseHateCrimeCsv,
} from '../../shared/hateCrime.ts'
import type { HateCrimeEvent } from '../../shared/types.ts'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const HATE_CRIME_RAW_DIR = path.join(ROOT, 'data', 'raw', 'ca-doj-openjustice-hate-crime')

export function latestHateCrimeCsv(root = ROOT): string | null {
  const dir = path.join(root, 'data', 'raw', 'ca-doj-openjustice-hate-crime')
  if (!existsSync(dir)) return null
  const files = readdirSync(dir)
    .filter((name) => name.endsWith('.csv'))
    .sort()
  const last = files.at(-1)
  return last ? path.join(dir, last) : null
}

export function loadHateCrimeEvents(dataClass: HateCrimeEvent['dataClass'] = 'snapshot'):
  | HateCrimeEvent[]
  | { status: string; message: string } {
  const file = latestHateCrimeCsv()
  if (!file) {
    return {
      status: 'unavailable',
      message: `No Hate Crimes CSV snapshot under data/raw/ca-doj-openjustice-hate-crime. Download ${OPENJUSTICE_HATE_CRIME_URL} and filter NCIC=${BURBANK_HATE_CRIME_NCIC}.`,
    }
  }
  const text = readFileSync(file, 'utf8')
  return parseHateCrimeCsv(text, dataClass)
}

export async function fetchHateCrimeCsvText(): Promise<string> {
  const res = await fetch(OPENJUSTICE_HATE_CRIME_URL, {
    headers: {
      Accept: 'text/csv',
      'User-Agent': 'CityScope/0.1 (Burbank public-data research)',
    },
    signal: AbortSignal.timeout(60_000),
  })
  if (!res.ok) throw new Error(`OpenJustice hate crime HTTP ${res.status}`)
  return res.text()
}

export async function fetchHateCrimeEvents(): Promise<HateCrimeEvent[]> {
  const text = await fetchHateCrimeCsvText()
  return parseHateCrimeCsv(text, 'live')
}
