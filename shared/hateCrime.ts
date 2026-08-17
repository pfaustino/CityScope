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

export type HateCrimeCountRow = {
  label: string
  events: number
}

export type HateCrimeMonthRow = {
  month: number
  label: string
  events: number
}

/** CSV MonthOccurrence 1–12. Not a calendar invented by CityScope. */
export const MONTH_OCCURRENCE_NAMES = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

export const HATE_CRIME_COLUMNS_USED = [
  'RecordId',
  'ClosedYear',
  'MonthOccurrence',
  'County',
  'NCIC',
  'TotalNumberOfVictims',
  'TotalNumberOfSuspects',
  'MostSeriousUcr',
  'MostSeriousLocation',
  'MostSeriousBias',
  'MostSeriousBiasType',
  'WeaponType',
  'Offensive_Act',
] as const

export const HATE_CRIME_BLANK_CELL = 'Blank in CSV'

function numAt(parts: string[], i: number): number {
  if (i < 0) return 0
  const n = Number(parts[i])
  return Number.isFinite(n) ? n : 0
}

function cellAt(parts: string[], i: number): string {
  if (i < 0) return ''
  return (parts[i] ?? '').trim()
}

export function monthOccurrenceLabel(month: number): string {
  const name = month >= 1 && month <= 12 ? MONTH_OCCURRENCE_NAMES[month] : ''
  return name ? `${name} (${month})` : String(month)
}

export function hateCrimeBlankLabel(value: string): string {
  return value.trim() ? value : HATE_CRIME_BLANK_CELL
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
    weapon: idx('WeaponType'),
    offensiveAct: idx('Offensive_Act'),
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
      weaponType: cellAt(parts, col.weapon),
      offensiveAct: cellAt(parts, col.offensiveAct),
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

export function hateCrimeValueCounts(
  events: HateCrimeEvent[],
  valueOf: (event: HateCrimeEvent) => string,
  year?: number,
): HateCrimeCountRow[] {
  const counts = new Map<string, number>()
  for (const event of events) {
    if (year != null && event.year !== year) continue
    const key = valueOf(event)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([label, n]) => ({ label, events: n }))
    .sort((a, b) => b.events - a.events || a.label.localeCompare(b.label))
}

export function hateCrimeMonthCounts(events: HateCrimeEvent[], year?: number): HateCrimeMonthRow[] {
  const byMonth = new Map<number, number>()
  for (const event of events) {
    if (year != null && event.year !== year) continue
    byMonth.set(event.month, (byMonth.get(event.month) ?? 0) + 1)
  }
  return [...byMonth.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([month, n]) => ({ month, label: monthOccurrenceLabel(month), events: n }))
}

export function hateCrimeLocationCounts(events: HateCrimeEvent[], year?: number): HateCrimeCountRow[] {
  return hateCrimeValueCounts(events, (event) => hateCrimeBlankLabel(event.mostSeriousLocation), year)
}

export function hateCrimeWeaponCounts(events: HateCrimeEvent[], year?: number): HateCrimeCountRow[] {
  return hateCrimeValueCounts(events, (event) => hateCrimeBlankLabel(event.weaponType), year)
}

export function hateCrimeUcrCounts(events: HateCrimeEvent[], year?: number): HateCrimeCountRow[] {
  return hateCrimeValueCounts(events, (event) => hateCrimeBlankLabel(event.mostSeriousUcr), year)
}

export function hateCrimeOffensiveActCounts(events: HateCrimeEvent[], year?: number): HateCrimeCountRow[] {
  return hateCrimeValueCounts(events, (event) => hateCrimeBlankLabel(event.offensiveAct), year)
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
