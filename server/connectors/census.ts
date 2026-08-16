import { GLENDALE } from '../../shared/peerCities.ts'
import type { CensusSnapshot } from '../../shared/types.ts'
import { keyPresent } from '../env.ts'

type PlaceGeo = {
  place: string
  name: string
  statisticId: string
}

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
  'B25003_001E',
  'B25003_002E',
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
    bachelorOrHigher: null,
    notes: [`Live Census Data API pull for ${geo.name} (place ${geo.place}). ACS estimates have margins of error.`],
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
      transformation: 'Direct ACS estimates; poverty rate = B17001_002E / B17001_001E',
      claimType: 'fact',
      dataClass: 'live',
      limitations: ['ACS 5-year estimates have margins of error.', 'Not a 2026 population count.'],
    },
  }
}
