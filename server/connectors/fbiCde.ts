import type { AgencyCrimeYear, DataClass } from '../../shared/types.ts'
import { keyPresent } from '../env.ts'
import { fetchJson, redact } from '../http.ts'

export const FBI_CDE_ORI = 'CA0191200'
export const FBI_CDE_BASE = 'https://api.usa.gov/crime/fbi/cde'
const FROM = '01-2018'
const TO = '12-2025'

const OFFENSES = [
  ['violent-crime', 'violent'],
  ['property-crime', 'property'],
  ['homicide', 'homicide'],
  ['rape', 'rape'],
  ['robbery', 'robbery'],
  ['aggravated-assault', 'aggravatedAssault'],
  ['burglary', 'burglary'],
  ['larceny', 'larceny'],
  ['motor-vehicle-theft', 'vehicleTheft'],
] as const

type OffenseField = (typeof OFFENSES)[number][1]

const LIMITATIONS = [
  'FBI CDE summarized agency actuals, rolled up from monthly counts to calendar years.',
  'These are official annual/API totals, not geocoded incidents or a live CAD feed.',
  'CDE figures can differ from CA DOJ OpenJustice because of reporting systems and revisions.',
  'Correlation is not causation.',
]

export async function fetchFbiCde(): Promise<AgencyCrimeYear[] | { status: string; message: string }> {
  if (!keyPresent('DATA_GOV_API_KEY')) {
    return {
      status: 'needs_api_key',
      message: 'Set DATA_GOV_API_KEY from https://api.data.gov/signup/ to query FBI CDE.',
    }
  }
  const apiKey = process.env.DATA_GOV_API_KEY
  if (!apiKey) {
    return { status: 'needs_api_key', message: 'DATA_GOV_API_KEY missing' }
  }
  const retrievedAt = new Date().toISOString()
  const byOffense: Partial<Record<OffenseField, Record<number, number>>> = {}
  const errors: string[] = []
  const settled = await Promise.all(
    OFFENSES.map(async ([offense, field]) => {
      try {
        const body = await fetchOffense(offense, apiKey)
        return { field, years: parseFbiCdeActualsByYear(body) }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        errors.push(`${offense}: ${redact(message)}`)
        return null
      }
    }),
  )
  for (const row of settled) {
    if (row) byOffense[row.field] = row.years
  }
  if (!byOffense.violent || !byOffense.property) {
    return {
      status: 'key_invalid',
      message: errors[0] ?? 'FBI CDE did not return violent and property actuals for Burbank PD.',
    }
  }
  return assembleFbiYears(byOffense, retrievedAt, 'live')
}

export function parseFbiCdeActualsByYear(body: unknown): Record<number, number> {
  if (!body || typeof body !== 'object') throw new Error('FBI CDE: unexpected payload')
  const actuals = (body as { offenses?: { actuals?: Record<string, Record<string, number>> } }).offenses
    ?.actuals
  if (!actuals || typeof actuals !== 'object') throw new Error('FBI CDE: missing offenses.actuals')
  const key = Object.keys(actuals).find(
    (name) => /offenses/i.test(name) && !/clearance/i.test(name) && !/united states|california/i.test(name),
  )
  if (!key) throw new Error('FBI CDE: no agency Offenses series')
  const months = actuals[key]
  if (!months) throw new Error('FBI CDE: empty agency Offenses series')
  const years: Record<number, number> = {}
  for (const [monthKey, raw] of Object.entries(months)) {
    const match = /^(\d{2})-(\d{4})$/.exec(monthKey)
    if (!match) continue
    const year = Number(match[2])
    const n = Number(raw)
    if (!Number.isFinite(year) || !Number.isFinite(n)) continue
    years[year] = (years[year] ?? 0) + n
  }
  return years
}

function assembleFbiYears(
  byOffense: Partial<Record<OffenseField, Record<number, number>>>,
  retrievedAt: string,
  dataClass: DataClass,
): AgencyCrimeYear[] {
  const yearSet = new Set<number>()
  for (const series of Object.values(byOffense)) {
    if (!series) continue
    for (const year of Object.keys(series)) yearSet.add(Number(year))
  }
  const out: AgencyCrimeYear[] = []
  for (const year of [...yearSet].sort((a, b) => a - b)) {
    const violent = byOffense.violent?.[year]
    const property = byOffense.property?.[year]
    if (violent == null || property == null) continue
    out.push({
      year,
      county: 'Los Angeles County',
      agency: 'Burbank Police Department',
      violent,
      homicide: byOffense.homicide?.[year] ?? 0,
      rape: byOffense.rape?.[year] ?? 0,
      robbery: byOffense.robbery?.[year] ?? 0,
      aggravatedAssault: byOffense.aggravatedAssault?.[year] ?? 0,
      property,
      burglary: byOffense.burglary?.[year] ?? 0,
      vehicleTheft: byOffense.vehicleTheft?.[year] ?? 0,
      larceny: byOffense.larceny?.[year] ?? 0,
      dataClass,
      provenance: {
        statisticId: `fbi-cde-${year}-violent`,
        label: `${year} FBI CDE violent offenses (Burbank PD)`,
        value: violent,
        sourceId: 'fbi-cde',
        sourceName: 'FBI Crime Data Explorer (agency summaries)',
        dataset: `CDE summarized agency actuals ORI ${FBI_CDE_ORI}`,
        retrievedAt,
        query: { ori: FBI_CDE_ORI, from: FROM, to: TO, offense: 'violent-crime+components' },
        geographicFilter: `Burbank PD (ORI ${FBI_CDE_ORI})`,
        timePeriod: { start: `${year}-01-01`, end: `${year}-12-31` },
        transformation: 'Sum monthly CDE actuals to calendar year; not incident locations',
        claimType: 'fact',
        dataClass,
        limitations: LIMITATIONS,
      },
    })
  }
  if (out.length === 0) throw new Error('FBI CDE: no complete annual rows')
  return out
}

async function fetchOffense(offense: string, apiKey: string): Promise<unknown> {
  const url = new URL(`${FBI_CDE_BASE}/summarized/agency/${FBI_CDE_ORI}/${offense}`)
  url.searchParams.set('from', FROM)
  url.searchParams.set('to', TO)
  url.searchParams.set('api_key', apiKey)
  return fetchJson(url.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'CityScope/0.1 (Burbank public-data research)',
    },
  })
}
