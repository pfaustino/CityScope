import { parseCsv } from './csv.ts'
import type { DataClass, HateCrimeEvent, Provenance } from './types.ts'

export const OPENJUSTICE_HATE_CRIME_URL =
  'https://data-openjustice.doj.ca.gov/sites/default/files/dataset/2026-07/Hate%20Crimes_2001-2025.csv'

export const OPENJUSTICE_HATE_CRIME_CATALOG = 'https://data-openjustice.doj.ca.gov/data/hate-crime'

export const BURBANK_HATE_CRIME_NCIC = '1912'

export const HATE_CRIME_DATASET = 'Hate Crimes 2001–2025'

export const HATE_CRIME_SOURCE_ID = 'ca-doj-openjustice-hate-crime'

export const HATE_CRIME_SMALL_N_LIMITATION =
  'Annual counts for this agency are small (for example 9 events in 2024). Percentages of bias type on small n are noisy; CityScope shows counts, not percentages.'

export const HATE_CRIME_2023_LIMITATION =
  'ClosedYear 2023: this OpenJustice CSV has 22 events for NCIC 1912. CA DOJ Hate Crime in California 2024, Table 6, lists 18 events for Burbank. CityScope shows the CSV count and does not silently choose one.'

const LIMITATIONS = [
  'One row per reported hate-crime event for Burbank PD (NCIC 1912). The CSV has no city name.',
  'These are reported events, not geocoded incidents, and not a finding about a group or about BPD.',
  'Do not treat statewide OpenJustice totals as Burbank.',
  HATE_CRIME_SMALL_N_LIMITATION,
  HATE_CRIME_2023_LIMITATION,
  'The 2001–2025 file includes ClosedYear 2025 rows; that year may be incomplete relative to a published annual report.',
  'Correlation is not causation.',
]

export type HateCrimeYearRow = {
  year: number
  events: number
  victims: number
  suspects: number
}

export type HateCrimeBiasTypeRow = {
  biasType: string
  events: number
}

function numAt(parts: string[], i: number): number {
  const n = Number(parts[i])
  return Number.isFinite(n) ? n : 0
}

export function parseHateCrimeCsv(
  text: string,
  dataClass: DataClass,
  ncic = BURBANK_HATE_CRIME_NCIC,
): HateCrimeEvent[] {
  const rows = parseCsv(text)
  const header = rows[0]
  if (!header) throw new Error('OpenJustice hate crime: empty file')
  const idx = (name: string) => header.indexOf(name)
  const col = {
    id: idx('RecordId'),
    year: idx('ClosedYear'),
    month: idx('MonthOccurrence'),
    county: idx('County'),
    ncic: idx('NCIC'),
    victims: idx('TotalNumberOfVictims'),
    suspects: idx('TotalNumberOfSuspects'),
    ucr: idx('MostSeriousUcr'),
    location: idx('MostSeriousLocation'),
    bias: idx('MostSeriousBias'),
    biasType: idx('MostSeriousBiasType'),
  }
  if (col.id < 0 || col.year < 0 || col.ncic < 0 || col.biasType < 0 || col.victims < 0) {
    throw new Error('OpenJustice hate crime: unexpected header')
  }
  const wanted = ncic.trim()
  const out: HateCrimeEvent[] = []
  for (const parts of rows.slice(1)) {
    const code = (parts[col.ncic] ?? '').trim()
    if (code !== wanted) continue
    const id = (parts[col.id] ?? '').trim()
    const year = Number(parts[col.year])
    if (!id || !Number.isFinite(year)) continue
    out.push({
      id,
      year,
      month: numAt(parts, col.month),
      ncic: code,
      county: (parts[col.county] ?? '').trim(),
      mostSeriousBias: (parts[col.bias] ?? '').trim(),
      mostSeriousBiasType: (parts[col.biasType] ?? '').trim(),
      mostSeriousUcr: (parts[col.ucr] ?? '').trim(),
      mostSeriousLocation: (parts[col.location] ?? '').trim(),
      victims: numAt(parts, col.victims),
      suspects: numAt(parts, col.suspects),
      dataClass,
    })
  }
  if (out.length === 0) throw new Error(`OpenJustice hate crime: no NCIC ${wanted} rows`)
  return out.sort((a, b) => a.year - b.year || a.month - b.month || a.id.localeCompare(b.id))
}

export function hateCrimeAnnual(events: HateCrimeEvent[]): HateCrimeYearRow[] {
  const byYear = new Map<number, HateCrimeYearRow>()
  for (const event of events) {
    const row = byYear.get(event.year) ?? { year: event.year, events: 0, victims: 0, suspects: 0 }
    row.events += 1
    row.victims += event.victims
    row.suspects += event.suspects
    byYear.set(event.year, row)
  }
  return [...byYear.values()].sort((a, b) => b.year - a.year)
}

export function hateCrimeBiasTypeCounts(events: HateCrimeEvent[], year: number): HateCrimeBiasTypeRow[] {
  const counts = new Map<string, number>()
  for (const event of events) {
    if (event.year !== year) continue
    const key = event.mostSeriousBiasType || 'Unspecified'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([biasType, n]) => ({ biasType, events: n }))
    .sort((a, b) => b.events - a.events || a.biasType.localeCompare(b.biasType))
}

export function hateCrimeEventProvenance(
  events: HateCrimeEvent[],
  retrievedAt: string,
  year?: number,
): Provenance {
  const subset = year == null ? events : events.filter((e) => e.year === year)
  const years = subset.map((e) => e.year)
  const startYear = years.length > 0 ? Math.min(...years) : year
  const endYear = years.length > 0 ? Math.max(...years) : year
  return {
    statisticId: year == null ? 'openjustice-hate-crime-events' : `openjustice-hate-crime-${year}-events`,
    label:
      year == null
        ? `Reported hate-crime events (Burbank PD, NCIC ${BURBANK_HATE_CRIME_NCIC})`
        : `${year} reported hate-crime events (Burbank PD, NCIC ${BURBANK_HATE_CRIME_NCIC})`,
    value: subset.length,
    sourceId: HATE_CRIME_SOURCE_ID,
    sourceName: 'CA DOJ OpenJustice hate crime',
    dataset: HATE_CRIME_DATASET,
    retrievedAt,
    query: {
      NCIC: BURBANK_HATE_CRIME_NCIC,
      ClosedYear: year == null ? 'all' : String(year),
      url: OPENJUSTICE_HATE_CRIME_URL,
      catalog: OPENJUSTICE_HATE_CRIME_CATALOG,
      rows: String(subset.length),
    },
    geographicFilter: `Burbank PD / Los Angeles County 19 (OpenJustice NCIC ${BURBANK_HATE_CRIME_NCIC}; no city name in the CSV)`,
    timePeriod: {
      start: startYear != null ? `${startYear}-01-01` : '2001-01-01',
      end: endYear != null ? `${endYear}-12-31` : '2025-12-31',
    },
    transformation: `Count CSV rows after filter NCIC=${BURBANK_HATE_CRIME_NCIC}. One row is one reported event.`,
    claimType: 'fact',
    dataClass: subset[0]?.dataClass ?? 'snapshot',
    limitations: LIMITATIONS,
  }
}

export function hateCrimeSumProvenance(
  events: HateCrimeEvent[],
  retrievedAt: string,
  year: number,
  field: 'victims' | 'suspects',
  value: number,
): Provenance {
  const base = hateCrimeEventProvenance(events, retrievedAt, year)
  return {
    ...base,
    statisticId: `openjustice-hate-crime-${year}-${field}`,
    label: `${year} hate-crime ${field} (sum of event fields, Burbank PD NCIC ${BURBANK_HATE_CRIME_NCIC})`,
    value,
    transformation: `Sum TotalNumberOf${field === 'victims' ? 'Victims' : 'Suspects'} on NCIC ${BURBANK_HATE_CRIME_NCIC} rows with ClosedYear=${year}.`,
    claimType: 'calculation',
  }
}
