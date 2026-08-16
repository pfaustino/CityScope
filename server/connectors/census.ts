import { GLENDALE } from '../../shared/peerCities.ts'
import type { CensusRaceEthnicity, CensusSnapshot } from '../../shared/types.ts'
import { keyPresent } from '../env.ts'

type PlaceGeo = {
  place: string
  name: string
  statisticId: string
}

const RACE_GROUPS = [
  { id: 'hispanic', label: 'Hispanic or Latino (any race)', estimate: 'B03002_012E', moe: 'B03002_012M' },
  { id: 'nh-white', label: 'White, not Hispanic', estimate: 'B03002_003E', moe: 'B03002_003M' },
  { id: 'nh-black', label: 'Black or African American, not Hispanic', estimate: 'B03002_004E', moe: 'B03002_004M' },
  { id: 'nh-asian', label: 'Asian, not Hispanic', estimate: 'B03002_006E', moe: 'B03002_006M' },
  { id: 'nh-aian', label: 'American Indian and Alaska Native, not Hispanic', estimate: 'B03002_005E', moe: 'B03002_005M' },
  { id: 'nh-nhpi', label: 'Native Hawaiian and Other Pacific Islander, not Hispanic', estimate: 'B03002_007E', moe: 'B03002_007M' },
  { id: 'nh-other', label: 'Some other race, not Hispanic', estimate: 'B03002_008E', moe: 'B03002_008M' },
  { id: 'nh-two', label: 'Two or more races, not Hispanic', estimate: 'B03002_009E', moe: 'B03002_009M' },
] as const

const VARS = [
  'NAME',
  'B01003_001E',
  'B19013_001E',
  'B25077_001E',
  'B25064_001E',
  'B17001_002E',
  'B17001_001E',
  'B01002_001E',
  'B11001_001E',
  'B15003_001E',
  'B15003_001M',
  'B15003_022E',
  'B15003_022M',
  'B15003_023E',
  'B15003_023M',
  'B15003_024E',
  'B15003_024M',
  'B15003_025E',
  'B15003_025M',
  'B03002_001E',
  'B03002_001M',
  ...RACE_GROUPS.flatMap((g) => [g.estimate, g.moe]),
] as const

export async function fetchCensusHint() {
  return fetchCensusAcs()
}

const BURBANK_PLACE: PlaceGeo = {
  place: '08954',
  name: 'Burbank city, California',
  statisticId: 'census-2023-acs5-live',
}

const GLENDALE_PLACE: PlaceGeo = {
  place: GLENDALE.censusPlace,
  name: GLENDALE.censusPlaceName,
  statisticId: 'census-2023-acs5-live-glendale',
}

export async function fetchCensusAcs(): Promise<CensusSnapshot[] | { status: string; message: string }> {
  return fetchCensusAcsPlace(BURBANK_PLACE)
}

export async function fetchCensusAcsGlendale(): Promise<CensusSnapshot[] | { status: string; message: string }> {
  return fetchCensusAcsPlace(GLENDALE_PLACE)
}

export async function fetchCensusAcsPlace(
  geo: PlaceGeo,
): Promise<CensusSnapshot[] | { status: string; message: string }> {
  if (!keyPresent('CENSUS_API_KEY')) {
    return {
      status: 'needs_api_key',
      message: 'Set CENSUS_API_KEY. Published ACS snapshots remain in the warehouse.',
    }
  }
  const key = process.env.CENSUS_API_KEY
  if (!key) throw new Error('CENSUS_API_KEY missing')
  const params = new URLSearchParams({
    get: VARS.join(','),
    for: `place:${geo.place}`,
    in: 'state:06',
    key,
  })
  const url = `https://api.census.gov/data/2023/acs/acs5?${params.toString()}`
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'CityScope/0.1 (Burbank public-data research)' },
    signal: AbortSignal.timeout(20_000),
  })
  const text = await res.text()
  if (text.includes('Invalid Key') || text.includes('Missing Key')) {
    return {
      status: 'key_invalid',
      message:
        'Census API rejected the key (Invalid Key). Activate it from the Census email, and confirm CENSUS_API_KEY is the Census key rather than the NOAA token or AirNow key.',
    }
  }
  let body: unknown
  try {
    body = JSON.parse(text) as unknown
  } catch {
    throw new Error(`Census HTTP ${res.status}: response was not JSON`)
  }
  return [parseAcsTable(body, new Date().toISOString(), geo)]
}

export function parseAcsTable(
  body: unknown,
  retrievedAt: string,
  geo: PlaceGeo = BURBANK_PLACE,
): CensusSnapshot {
  if (!Array.isArray(body) || body.length < 2) throw new Error('Census ACS: unexpected payload')
  const header = body[0]
  const row = body[1]
  if (!Array.isArray(header) || !Array.isArray(row)) throw new Error('Census ACS: unexpected rows')
  const idx = (name: string) => header.indexOf(name)
  const num = (name: string): number | null => {
    const i = idx(name)
    if (i < 0) return null
    const raw = row[i]
    const n = typeof raw === 'string' || typeof raw === 'number' ? Number(raw) : NaN
    return Number.isFinite(n) ? n : null
  }
  const population = num('B01003_001E')
  if (population === null) throw new Error('Census ACS: missing population')
  const povertyNum = num('B17001_002E')
  const povertyDen = num('B17001_001E')
  const povertyRate = povertyNum !== null && povertyDen && povertyDen > 0 ? povertyNum / povertyDen : null
  return {
    year: '2023',
    vintage: 'ACS 2019–2023 5-year (live API)',
    population,
    medianAge: num('B01002_001E'),
    medianHouseholdIncome: num('B19013_001E'),
    povertyRate,
    medianHomeValue: num('B25077_001E'),
    medianGrossRent: num('B25064_001E'),
    households: num('B11001_001E'),
    bachelorOrHigher: bachelorShare(num),
    raceEthnicity: raceEthnicityShares(num),
    notes: [
      `Live Census Data API pull for ${geo.name} (place ${geo.place}). ACS estimates have 90% margins of error.`,
    ],
    provenance: {
      statisticId: geo.statisticId,
      label: `ACS 2023 5-year population (live) — ${geo.name}`,
      value: population,
      sourceId: 'census-acs',
      sourceName: 'U.S. Census Bureau ACS / Decennial',
      dataset: 'ACS 5-year 2019–2023',
      retrievedAt,
      query: { geography: `place:${geo.place}`, state: '06', vintage: 'acs5-2023' },
      geographicFilter: geo.name,
      timePeriod: { start: '2019-01-01', end: '2023-12-31' },
      transformation:
        'Direct ACS estimates; poverty rate = B17001_002E / B17001_001E; bachelor’s+ = B15003_022–025 / B15003_001; race/ethnicity shares = B03002 group / B03002_001',
      claimType: 'fact',
      dataClass: 'live',
      limitations: [
        'ACS 5-year estimates have 90% margins of error.',
        'Not a 2026 population count.',
        'Race/ethnicity groups are mutually exclusive (Hispanic origin table B03002).',
      ],
    },
  }
}

function bachelorShare(num: (name: string) => number | null): number | null {
  const den = num('B15003_001E')
  if (!den || den <= 0) return null
  const parts = ['B15003_022E', 'B15003_023E', 'B15003_024E', 'B15003_025E'].map(num)
  if (parts.some((n) => n === null)) return null
  return (parts as number[]).reduce((sum, n) => sum + n, 0) / den
}

function raceEthnicityShares(num: (name: string) => number | null): CensusRaceEthnicity[] | null {
  const total = num('B03002_001E')
  const totalMoe = num('B03002_001M')
  if (!total || total <= 0) return null
  const groups: CensusRaceEthnicity[] = []
  for (const g of RACE_GROUPS) {
    const estimate = num(g.estimate)
    if (estimate === null) return null
    const moe = num(g.moe)
    groups.push({
      id: g.id,
      label: g.label,
      estimate,
      moe,
      share: estimate / total,
      shareMoe: proportionMoe(estimate, moe, total, totalMoe),
    })
  }
  return groups
}

/** ACS 90% MOE for a derived proportion. See Census ACS Accuracy of the Data. */
export function proportionMoe(
  numerator: number,
  numeratorMoe: number | null,
  denominator: number,
  denominatorMoe: number | null,
): number | null {
  if (!denominator || denominator <= 0 || numeratorMoe === null || denominatorMoe === null) return null
  const p = numerator / denominator
  const inner = numeratorMoe ** 2 - p ** 2 * denominatorMoe ** 2
  const se = Math.sqrt(inner >= 0 ? inner : numeratorMoe ** 2 + p ** 2 * denominatorMoe ** 2)
  return se / denominator
}
