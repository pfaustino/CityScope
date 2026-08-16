import { BURBANK_FBI_ORI, GLENDALE } from '../../shared/peerCities.ts'
import type { AgencyCrimeYear, DataClass } from '../../shared/types.ts'
import { keyPresent } from '../env.ts'
import { fetchJson, redact } from '../http.ts'

export const FBI_CDE_ORI = BURBANK_FBI_ORI
export const FBI_CDE_GLENDALE_ORI = GLENDALE.fbiOri
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
  '2021 CDE may be incomplete for agencies in the NIBRS transition and is not used as a full-year comparison.',
  'Correlation is not causation.',
]

export async function fetchFbiCde(): Promise<AgencyCrimeYear[] | { status: string; message: string }> {
  return fetchFbiCdeAgency(FBI_CDE_ORI, 'Burbank Police Department')
}

export async function fetchFbiCdeAgency(
  ori: string,
  agencyName: string,
): Promise<AgencyCrimeYear[] | { status: string; message: string }> {
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
  const monthsByOffense: Partial<Record<OffenseField, Record<number, number>>> = {}
  const errors: string[] = []
  const settled = await Promise.all(
    OFFENSES.map(async ([offense, field]) => {
      try {
        const body = await fetchOffense(offense, apiKey, ori)
        const parsed = parseFbiCdeYearCoverage(body)
        return { field, years: parsed.totals, months: parsed.months }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        errors.push(`${offense}: ${redact(message)}`)
        return null
      }
    }),
  )
  for (const row of settled) {
    if (!row) continue
    byOffense[row.field] = row.years
    monthsByOffense[row.field] = row.months
  }
  if (!byOffense.violent || !byOffense.property) {
    return {
      status: 'key_invalid',
      message: errors[0] ?? `FBI CDE did not return violent and property actuals for ${agencyName}.`,
    }
  }
  return assembleFbiYears(byOffense, monthsByOffense, retrievedAt, 'live', ori, agencyName)
}

export function parseFbiCdeActualsByYear(body: unknown): Record<number, number> {
  return parseFbiCdeYearCoverage(body).totals
}

export function parseFbiCdeYearCoverage(body: unknown): {
  totals: Record<number, number>
  months: Record<number, number>
} {
  if (!body || typeof body !== 'object') throw new Error('FBI CDE: unexpected payload')
  const actuals = (body as { offenses?: { actuals?: Record<string, Record<string, number>> } }).offenses
    ?.actuals
  if (!actuals || typeof actuals !== 'object') throw new Error('FBI CDE: missing offenses.actuals')
  const key = Object.keys(actuals).find(
    (name) => /offenses/i.test(name) && !/clearance/i.test(name) && !/united states|california/i.test(name),
  )
  if (!key) throw new Error('FBI CDE: no agency Offenses series')
  const monthMap = actuals[key]
  if (!monthMap) throw new Error('FBI CDE: empty agency Offenses series')
  const totals: Record<number, number> = {}
  const months: Record<number, number> = {}
  for (const [monthKey, raw] of Object.entries(monthMap)) {
    const match = /^(\d{2})-(\d{4})$/.exec(monthKey)
    if (!match) continue
    const year = Number(match[2])
    const n = Number(raw)
    if (!Number.isFinite(year) || !Number.isFinite(n)) continue
    totals[year] = (totals[year] ?? 0) + n
    months[year] = (months[year] ?? 0) + 1
  }
  return { totals, months }
}

function assembleFbiYears(
  byOffense: Partial<Record<OffenseField, Record<number, number>>>,
  monthsByOffense: Partial<Record<OffenseField, Record<number, number>>>,
  retrievedAt: string,
  dataClass: DataClass,
  ori: string,
  agencyName: string,
): AgencyCrimeYear[] {
  const yearSet = new Set<number>()
  for (const series of Object.values(byOffense)) {
    if (!series) continue
    for (const year of Object.keys(series)) yearSet.add(Number(year))
  }
  const shortName = agencyName.replace(/ Police Department$/i, ' PD')
  const slug = ori === FBI_CDE_ORI ? '' : `${agencyName.split(' ')[0]?.toLowerCase() ?? 'peer'}-`
  const out: AgencyCrimeYear[] = []
  for (const year of [...yearSet].sort((a, b) => a - b)) {
    const violent = byOffense.violent?.[year]
    const property = byOffense.property?.[year]
    if (violent == null || property == null) continue
    const monthsReported = Math.min(
      monthsByOffense.violent?.[year] ?? 0,
      monthsByOffense.property?.[year] ?? 0,
    )
    const yearLimitations =
      year === 2021 || monthsReported < 12 || (violent === 0 && property === 0)
        ? [
            ...LIMITATIONS,
            'This CDE year is not treated as a full-year total (NIBRS transition, incomplete months, or all-zero actuals).',
          ]
        : LIMITATIONS
    out.push({
      year,
      county: 'Los Angeles County',
      agency: agencyName,
      violent,
      homicide: byOffense.homicide?.[year] ?? 0,
      rape: byOffense.rape?.[year] ?? 0,
      robbery: byOffense.robbery?.[year] ?? 0,
      aggravatedAssault: byOffense.aggravatedAssault?.[year] ?? 0,
      property,
      burglary: byOffense.burglary?.[year] ?? 0,
      vehicleTheft: byOffense.vehicleTheft?.[year] ?? 0,
      larceny: byOffense.larceny?.[year] ?? 0,
      monthsReported,
      dataClass,
      provenance: {
        statisticId: `fbi-cde-${slug}${year}-violent`,
        label: `${year} FBI CDE violent offenses (${shortName})`,
        value: violent,
        sourceId: 'fbi-cde',
        sourceName: 'FBI Crime Data Explorer (agency summaries)',
        dataset: `CDE summarized agency actuals ORI ${ori}`,
        retrievedAt,
        query: { ori, from: FROM, to: TO, offense: 'violent-crime+components', monthsReported: String(monthsReported) },
        geographicFilter: `${shortName} (ORI ${ori})`,
        timePeriod: { start: `${year}-01-01`, end: `${year}-12-31` },
        transformation: 'Sum monthly CDE actuals to calendar year; not incident locations',
        claimType: 'fact',
        dataClass,
        limitations: yearLimitations,
      },
    })
  }
  if (out.length === 0) throw new Error('FBI CDE: no complete annual rows')
  return out
}

async function fetchOffense(offense: string, apiKey: string, ori: string): Promise<unknown> {
  const url = new URL(`${FBI_CDE_BASE}/summarized/agency/${ori}/${offense}`)
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
