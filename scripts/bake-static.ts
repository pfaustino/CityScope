import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { liveSourceView, SOURCES } from '../shared/catalog.ts'
import { parseForecast, parseQuakes } from '../shared/liveParse.ts'
import { parseHateCrimeCsv } from '../shared/hateCrime.ts'
import { parseSwitrsCsv, SWITRS_DEFAULT_FILE, SWITRS_GLENDALE_FILE } from '../shared/switrs.ts'
import type {
  AgencyCrimeYear,
  AirQualityObs,
  CensusSnapshot,
  ClimateDay,
  HateCrimeEvent,
  LiveOverlay,
} from '../shared/types.ts'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC_DIR = path.join(ROOT, 'public')
const OVERLAY_FILE = path.join(PUBLIC_DIR, 'overlay.json')
const SOURCES_FILE = path.join(PUBLIC_DIR, 'sources.json')

const KEYS_OFF = {
  CENSUS_API_KEY: false,
  NOAA_CDO_TOKEN: false,
  AIRNOW_API_KEY: false,
  DATA_GOV_API_KEY: false,
}

function isGap(value: unknown): boolean {
  return Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      'status' in value &&
      'message' in value,
  )
}

function latestRaw(sourceId: string): unknown | null {
  const dir = path.join(ROOT, 'data', 'raw', sourceId)
  if (!existsSync(dir)) return null
  const files = readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
  const last = files.at(-1)
  if (!last) return null
  const body = JSON.parse(readFileSync(path.join(dir, last), 'utf8')) as unknown
  return isGap(body) ? null : body
}

function readExistingOverlay(): LiveOverlay | null {
  if (!existsSync(OVERLAY_FILE)) return null
  try {
    return JSON.parse(readFileSync(OVERLAY_FILE, 'utf8')) as LiveOverlay
  } catch {
    return null
  }
}

function asArray<T>(value: unknown): T[] | null {
  return Array.isArray(value) && value.length > 0 ? (value as T[]) : null
}

function snapshotize<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => snapshotize(item)) as T
  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {}
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      next[key] = key === 'dataClass' && nested === 'live' ? 'snapshot' : snapshotize(nested)
    }
    return next as T
  }
  return value
}

function loadCollisions(): {
  collisions: LiveOverlay['collisions']
  collisionsFile: string | null
  collisionsGlendale: LiveOverlay['collisionsGlendale']
  collisionsGlendaleFile: string | null
} {
  const burbankCandidates = [
    path.join(ROOT, SWITRS_DEFAULT_FILE),
    path.join(ROOT, 'crashes.csv'),
    path.join(ROOT, 'data', SWITRS_DEFAULT_FILE),
    path.join(ROOT, 'data', 'crashes.csv'),
  ]
  const glendaleCandidates = [
    path.join(ROOT, SWITRS_GLENDALE_FILE),
    path.join(ROOT, 'crashes-glendale.csv'),
    path.join(ROOT, 'data', SWITRS_GLENDALE_FILE),
    path.join(ROOT, 'data', 'crashes-glendale.csv'),
  ]
  let collisions: LiveOverlay['collisions'] = null
  let collisionsFile: string | null = null
  for (const file of burbankCandidates) {
    if (!existsSync(file)) continue
    collisions = parseSwitrsCsv(readFileSync(file, 'utf8'), path.basename(file), 'BURBANK')
    collisionsFile = path.basename(file)
    break
  }
  let collisionsGlendale: LiveOverlay['collisionsGlendale'] = null
  let collisionsGlendaleFile: string | null = null
  for (const file of glendaleCandidates) {
    if (!existsSync(file)) continue
    collisionsGlendale = parseSwitrsCsv(readFileSync(file, 'utf8'), path.basename(file), 'GLENDALE')
    collisionsGlendaleFile = path.basename(file)
    break
  }
  return { collisions, collisionsFile, collisionsGlendale, collisionsGlendaleFile }
}

function loadHateCrimeEvents(): HateCrimeEvent[] | null {
  const dir = path.join(ROOT, 'data', 'raw', 'ca-doj-openjustice-hate-crime')
  if (existsSync(dir)) {
    const csvs = readdirSync(dir)
      .filter((name) => name.endsWith('.csv'))
      .sort()
    const lastCsv = csvs.at(-1)
    if (lastCsv) {
      return parseHateCrimeCsv(readFileSync(path.join(dir, lastCsv), 'utf8'), 'snapshot')
    }
  }
  return asArray<HateCrimeEvent>(latestRaw('ca-doj-openjustice-hate-crime'))
}

function emptyOverlay(retrievedAt: string): LiveOverlay {
  return {
    retrievedAt,
    census: null,
    weather: null,
    earthquakes: null,
    climate: null,
    airQuality: null,
    crimeAnnual: null,
    fbiAnnual: null,
    crimeAnnualGlendale: null,
    fbiAnnualGlendale: null,
    censusGlendale: null,
    collisions: null,
    collisionsFile: null,
    collisionsGlendale: null,
    collisionsGlendaleFile: null,
    hateCrimeEvents: null,
    errors: [],
  }
}

/** Bake public overlay JSON. Never reads `.env` or calls keyed APIs. */
export function bakeStaticOverlay(): LiveOverlay {
  const existing = readExistingOverlay()
  const overlay = emptyOverlay(new Date().toISOString())
  if (existing) {
    overlay.census = existing.census
    overlay.weather = existing.weather
    overlay.earthquakes = existing.earthquakes
    overlay.climate = existing.climate
    overlay.airQuality = existing.airQuality
    overlay.crimeAnnual = existing.crimeAnnual
    overlay.fbiAnnual = existing.fbiAnnual
    overlay.crimeAnnualGlendale = existing.crimeAnnualGlendale
    overlay.fbiAnnualGlendale = existing.fbiAnnualGlendale
    overlay.censusGlendale = existing.censusGlendale
    overlay.collisions = existing.collisions
    overlay.collisionsFile = existing.collisionsFile
    overlay.collisionsGlendale = existing.collisionsGlendale
    overlay.collisionsGlendaleFile = existing.collisionsGlendaleFile
    overlay.hateCrimeEvents = existing.hateCrimeEvents
    overlay.retrievedAt = existing.retrievedAt
  }

  const census = asArray<CensusSnapshot>(latestRaw('census-acs'))
  if (census) overlay.census = census
  const climate = asArray<ClimateDay>(latestRaw('noaa-cdo'))
  if (climate) overlay.climate = climate
  const airQuality = asArray<AirQualityObs>(latestRaw('aqi'))
  if (airQuality) overlay.airQuality = airQuality
  const crimeAnnual = asArray<AgencyCrimeYear>(latestRaw('ca-doj-openjustice'))
  if (crimeAnnual) overlay.crimeAnnual = crimeAnnual
  const fbiAnnual = asArray<AgencyCrimeYear>(latestRaw('fbi-cde'))
  if (fbiAnnual) overlay.fbiAnnual = fbiAnnual
  const crimeAnnualGlendale = asArray<AgencyCrimeYear>(latestRaw('ca-doj-openjustice-glendale'))
  if (crimeAnnualGlendale) overlay.crimeAnnualGlendale = crimeAnnualGlendale
  const fbiAnnualGlendale = asArray<AgencyCrimeYear>(latestRaw('fbi-cde-glendale'))
  if (fbiAnnualGlendale) overlay.fbiAnnualGlendale = fbiAnnualGlendale
  const censusGlendale = asArray<CensusSnapshot>(latestRaw('census-acs-glendale'))
  if (censusGlendale) overlay.censusGlendale = censusGlendale

  const nws = latestRaw('nws-forecast')
  if (nws) {
    const weather = parseForecast(nws)
    if (weather.length > 0) overlay.weather = weather
  }
  const usgs = latestRaw('usgs-earthquakes')
  if (usgs) {
    const earthquakes = parseQuakes(usgs, 'snapshot')
    if (earthquakes.length > 0) overlay.earthquakes = earthquakes
  }

  const switrs = loadCollisions()
  if (switrs.collisions && switrs.collisions.length > 0) {
    overlay.collisions = switrs.collisions
    overlay.collisionsFile = switrs.collisionsFile
  }
  if (switrs.collisionsGlendale && switrs.collisionsGlendale.length > 0) {
    overlay.collisionsGlendale = switrs.collisionsGlendale
    overlay.collisionsGlendaleFile = switrs.collisionsGlendaleFile
  }

  const hateCrimeEvents = loadHateCrimeEvents()
  if (hateCrimeEvents && hateCrimeEvents.length > 0) overlay.hateCrimeEvents = hateCrimeEvents

  overlay.retrievedAt = new Date().toISOString()
  overlay.errors = []
  const baked = snapshotize(overlay)

  if (!existsSync(PUBLIC_DIR)) mkdirSync(PUBLIC_DIR, { recursive: true })
  writeFileSync(OVERLAY_FILE, `${JSON.stringify(baked, null, 2)}\n`, 'utf8')
  const sources = SOURCES.map((source) => liveSourceView(source, KEYS_OFF, baked))
  writeFileSync(SOURCES_FILE, `${JSON.stringify(sources, null, 2)}\n`, 'utf8')
  return baked
}

const invoked = process.argv[1] && path.basename(process.argv[1]).startsWith('bake-static')
if (invoked) {
  const overlay = bakeStaticOverlay()
  console.log(
    `baked overlay ${overlay.retrievedAt} collisions=${overlay.collisions?.length ?? 0} glendaleCrashes=${overlay.collisionsGlendale?.length ?? 0} openjustice=${overlay.crimeAnnual?.length ?? 0} hatecrime=${overlay.hateCrimeEvents?.length ?? 0} glendale=${overlay.crimeAnnualGlendale?.length ?? 0}`,
  )
}
