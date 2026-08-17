import { parseCsv } from './csv.ts'
import { joinGeo } from './geo.ts'
import { countBy } from './stats.ts'
import type { Collision, GeoRef, Provenance, Warehouse } from './types.ts'

export const SWITRS_DEFAULT_FILE = 'Crashes.csv'
export const SWITRS_GLENDALE_FILE = 'Crashes-Glendale.csv'

const LIMITATIONS = [
  'Official SWITRS/TIMS collision rows from the local extract — not demonstration data.',
  'This extract is not a live CAD or 911 feed.',
  'Rows without usable coordinates are counted and not mapped.',
  'These extracts have no property-damage-only (PDO, severity 0) rows. That is the file, not a missing zero invented by CityScope.',
  'Correlation is not causation. Counts without traffic volume are not a dangerous-intersection finding.',
]

/** TIMS COLLISION_SEVERITY. Only codes present in the codebook are labeled. */
export const TIMS_SEVERITY: Record<string, string> = {
  '0': 'Property damage only (PDO)',
  '1': 'Fatal',
  '2': 'Severe injury',
  '3': 'Other visible injury',
  '4': 'Complaint of pain',
}

/** TIMS DAY_OF_WEEK: 1 = Monday … 7 = Sunday. */
export const TIMS_DAY_OF_WEEK: Record<string, string> = {
  '1': 'Monday',
  '2': 'Tuesday',
  '3': 'Wednesday',
  '4': 'Thursday',
  '5': 'Friday',
  '6': 'Saturday',
  '7': 'Sunday',
}

export const TIMS_LIGHTING: Record<string, string> = {
  A: 'Daylight',
  B: 'Dusk / dawn',
  C: 'Dark — street lights',
  D: 'Dark — no street lights',
  E: 'Dark — street lights not functioning',
}

export const TIMS_WEATHER: Record<string, string> = {
  A: 'Clear',
  B: 'Cloudy',
  C: 'Raining',
  D: 'Snowing',
  E: 'Fog',
  F: 'Other',
  G: 'Wind',
}

export const TIMS_COLLISION_TYPE: Record<string, string> = {
  A: 'Head-on',
  B: 'Sideswipe',
  C: 'Rear end',
  D: 'Broadside',
  E: 'Hit object',
  F: 'Overturned',
  G: 'Vehicle / pedestrian',
  H: 'Other',
}

export const TIMS_HIT_AND_RUN: Record<string, string> = {
  F: 'Felony hit-and-run',
  M: 'Misdemeanor hit-and-run',
  N: 'Not hit-and-run',
}

/** TIMS PCF_VIOL_CATEGORY. Unlisted codes are shown as the raw code. */
export const TIMS_PCF_CATEGORY: Record<string, string> = {
  '00': 'Unknown',
  '01': 'Driving or bicycling under the influence',
  '02': 'Impeding traffic',
  '03': 'Unsafe speed',
  '04': 'Following too closely',
  '05': 'Wrong side of road',
  '06': 'Improper passing',
  '07': 'Unsafe lane change',
  '08': 'Improper turning',
  '09': 'Automobile right of way',
  '10': 'Pedestrian right of way',
  '11': 'Pedestrian violation',
  '12': 'Traffic signals and signs',
  '13': 'Hazardous parking',
  '17': 'Other hazardous violation',
  '18': 'Other than driver (or pedestrian)',
  '21': 'Unsafe starting or backing',
  '22': 'Other improper driving',
}

export const SWITRS_COLUMNS_USED = [
  'CASE_ID',
  'ACCIDENT_YEAR',
  'COLLISION_DATE',
  'COLLISION_TIME',
  'DAY_OF_WEEK',
  'PRIMARY_RD',
  'SECONDARY_RD',
  'INTERSECTION',
  'WEATHER_1',
  'TOW_AWAY',
  'COLLISION_SEVERITY',
  'NUMBER_KILLED',
  'NUMBER_INJURED',
  'HIT_AND_RUN',
  'TYPE_OF_COLLISION',
  'LIGHTING',
  'PEDESTRIAN_ACCIDENT',
  'BICYCLE_ACCIDENT',
  'MOTORCYCLE_ACCIDENT',
  'TRUCK_ACCIDENT',
  'ALCOHOL_INVOLVED',
  'PCF_VIOL_CATEGORY',
  'LATITUDE',
  'LONGITUDE',
  'POINT_X',
  'POINT_Y',
  'CITY',
] as const

export type SwitrsCity = 'BURBANK' | 'GLENDALE'

export type CollisionRollup = {
  n: number
  mapped: number
  unmapped: number
  killed: number
  injured: number
  alcohol: number
  pedestrian: number
  bicycle: number
  motorcycle: number
  truck: number
  hitAndRun: number
  atIntersection: number
  towAway: number
  bySeverityCode: Record<string, number>
  byYear: Record<string, number>
  byHour: Record<string, number>
  hourUnknown: number
  byDayOfWeek: Record<string, number>
  byIntersection: Record<string, number>
  byLighting: Record<string, number>
  byWeather: Record<string, number>
  byCollisionType: Record<string, number>
  byHitAndRun: Record<string, number>
  byPcf: Record<string, number>
  dates: { start: string; end: string } | null
}

export function parseSwitrsCsv(
  text: string,
  fileName: string,
  cityFilter: SwitrsCity = 'BURBANK',
): Collision[] {
  const rows = parseCsv(text)
  const header = rows[0]
  if (!header) throw new Error('SWITRS: empty file')
  const idx = (name: string) => header.indexOf(name)
  const col = {
    id: idx('CASE_ID'),
    year: idx('ACCIDENT_YEAR'),
    date: idx('COLLISION_DATE'),
    time: idx('COLLISION_TIME'),
    dayOfWeek: idx('DAY_OF_WEEK'),
    severity: idx('COLLISION_SEVERITY'),
    killed: idx('NUMBER_KILLED'),
    injured: idx('NUMBER_INJURED'),
    primary: idx('PRIMARY_RD'),
    secondary: idx('SECONDARY_RD'),
    intersection: idx('INTERSECTION'),
    weather: idx('WEATHER_1'),
    towAway: idx('TOW_AWAY'),
    hitAndRun: idx('HIT_AND_RUN'),
    collisionType: idx('TYPE_OF_COLLISION'),
    lighting: idx('LIGHTING'),
    pedestrian: idx('PEDESTRIAN_ACCIDENT'),
    bicycle: idx('BICYCLE_ACCIDENT'),
    motorcycle: idx('MOTORCYCLE_ACCIDENT'),
    truck: idx('TRUCK_ACCIDENT'),
    alcohol: idx('ALCOHOL_INVOLVED'),
    pcf: idx('PCF_VIOL_CATEGORY'),
    lat: idx('LATITUDE'),
    lng: idx('LONGITUDE'),
    pointX: idx('POINT_X'),
    pointY: idx('POINT_Y'),
    city: idx('CITY'),
  }
  if (col.id < 0 || col.date < 0 || col.severity < 0) {
    throw new Error(`SWITRS: unexpected header in ${fileName}`)
  }
  const want = cityFilter.toUpperCase()
  const out: Collision[] = []
  for (const parts of rows.slice(1)) {
    const city = (parts[col.city] ?? '').trim().toUpperCase()
    if (city && city !== want) continue
    const id = (parts[col.id] ?? '').trim()
    const date = (parts[col.date] ?? '').trim()
    if (!id || !date) continue
    const primary = cell(parts, col.primary)
    const secondary = cell(parts, col.secondary)
    const intersection = secondary ? `${primary} & ${secondary}` : primary || 'Unknown location'
    const killed = finiteNumber(parts[col.killed])
    const injured = finiteNumber(parts[col.injured])
    const severityCode = cell(parts, col.severity)
    out.push({
      id,
      date,
      hour: parseCollisionHour(parts[col.time] ?? ''),
      severity: collisionSeverity(severityCode, killed, injured),
      intersection,
      geo: collisionGeo(parts, col, intersection),
      dataClass: 'snapshot',
      city: city || want,
      year: parseYear(cell(parts, col.year), date),
      dayOfWeek: parseDayOfWeek(cell(parts, col.dayOfWeek)),
      severityCode,
      killed,
      injured,
      primaryRd: primary,
      secondaryRd: secondary,
      alcoholInvolved: flagY(parts, col.alcohol),
      pedestrian: flagY(parts, col.pedestrian),
      bicycle: flagY(parts, col.bicycle),
      motorcycle: flagY(parts, col.motorcycle),
      truck: flagY(parts, col.truck),
      hitAndRun: cell(parts, col.hitAndRun),
      lighting: cell(parts, col.lighting),
      weather: cell(parts, col.weather),
      collisionType: cell(parts, col.collisionType),
      atIntersection: cell(parts, col.intersection),
      towAway: cell(parts, col.towAway),
      pcfViolCategory: cell(parts, col.pcf),
    })
  }
  if (out.length === 0) throw new Error(`SWITRS: no ${want} rows in ${fileName}`)
  return out
}

export function rollupCollisions(rows: Collision[]): CollisionRollup {
  const mapped = rows.filter((c) => c.geo.lat != null && c.geo.lng != null).length
  const dates = rows.map((c) => c.date).filter(Boolean).sort()
  const start = dates[0]
  const end = dates[dates.length - 1]
  const hourKnown = rows.filter((c) => c.hour != null)
  return {
    n: rows.length,
    mapped,
    unmapped: rows.length - mapped,
    killed: rows.reduce((sum, c) => sum + c.killed, 0),
    injured: rows.reduce((sum, c) => sum + c.injured, 0),
    alcohol: rows.filter((c) => c.alcoholInvolved).length,
    pedestrian: rows.filter((c) => c.pedestrian).length,
    bicycle: rows.filter((c) => c.bicycle).length,
    motorcycle: rows.filter((c) => c.motorcycle).length,
    truck: rows.filter((c) => c.truck).length,
    hitAndRun: rows.filter((c) => c.hitAndRun === 'F' || c.hitAndRun === 'M').length,
    atIntersection: rows.filter((c) => c.atIntersection === 'Y').length,
    towAway: rows.filter((c) => c.towAway === 'Y').length,
    bySeverityCode: countBy(rows, (c) => c.severityCode || '(blank)'),
    byYear: countBy(
      rows.filter((c) => c.year != null),
      (c) => String(c.year),
    ),
    byHour: countBy(hourKnown, (c) => String(c.hour)),
    hourUnknown: rows.length - hourKnown.length,
    byDayOfWeek: countBy(
      rows.filter((c) => c.dayOfWeek != null),
      (c) => String(c.dayOfWeek),
    ),
    byIntersection: countBy(rows, (c) => c.intersection),
    byLighting: countBy(rows, (c) => c.lighting || '(blank)'),
    byWeather: countBy(rows, (c) => c.weather || '(blank)'),
    byCollisionType: countBy(rows, (c) => c.collisionType || '(blank)'),
    byHitAndRun: countBy(rows, (c) => c.hitAndRun || '(blank)'),
    byPcf: countBy(rows, (c) => c.pcfViolCategory || '(blank)'),
    dates: start && end ? { start, end } : null,
  }
}

export function collisionsProvenance(wh: Warehouse, fileName = SWITRS_DEFAULT_FILE): Provenance {
  return collisionsProvenanceFor(wh.collisions, {
    fileName,
    generatedAt: wh.generatedAt,
    cityLabel: 'Burbank',
    statisticId: 'switrs-crashes-count',
  })
}

export function glendaleCollisionsProvenance(
  wh: Warehouse,
  fileName = SWITRS_GLENDALE_FILE,
): Provenance {
  return collisionsProvenanceFor(wh.collisionsGlendale, {
    fileName,
    generatedAt: wh.generatedAt,
    cityLabel: 'Glendale',
    statisticId: 'switrs-crashes-glendale-count',
  })
}

export function collisionsProvenanceFor(
  rows: Collision[],
  args: { fileName: string; generatedAt: string; cityLabel: string; statisticId: string },
): Provenance {
  const geo = rows.filter((c) => c.geo.lat != null && c.geo.lng != null).length
  const dates = rows.map((c) => c.date).filter(Boolean).sort()
  const years = [...new Set(rows.map((c) => c.year).filter((y): y is number => y != null))].sort(
    (a, b) => a - b,
  )
  return {
    statisticId: args.statisticId,
    label: `${args.cityLabel} collision records (${args.fileName})`,
    value: rows.length,
    sourceId: 'switrs',
    sourceName: 'SWITRS / TIMS traffic collisions',
    dataset: args.fileName,
    retrievedAt: args.generatedAt,
    query: {
      file: args.fileName,
      city: args.cityLabel,
      rows: String(rows.length),
      geocoded: String(geo),
    },
    geographicFilter: `CITY=${args.cityLabel.toUpperCase()} in ${args.fileName}`,
    timePeriod: {
      start: dates[0] ?? 'unknown',
      end: dates[dates.length - 1] ?? 'unknown',
    },
    transformation: `Parsed ${SWITRS_COLUMNS_USED.join(', ')}. Filtered to CITY=${args.cityLabel.toUpperCase()}. Not mixed with the other city’s extract.`,
    claimType: 'fact',
    dataClass: 'snapshot',
    limitations: [
      ...LIMITATIONS,
      `${rows.length - geo} of ${rows.length} ${args.cityLabel} rows have no usable coordinates.`,
      years.length > 0 ? `Accident years in this file: ${years.join(', ')}.` : 'Accident year not present on every row.',
    ],
  }
}

export function timsLabel(table: Record<string, string>, code: string): string {
  const key = code.trim()
  if (!key || key === '-') return 'Not stated'
  return table[key] ?? `Code ${key} (no TIMS label in CityScope)`
}

export function hourBars(byHour: Record<string, number>): { label: string; value: number }[] {
  return Array.from({ length: 24 }, (_, hour) => ({
    label: String(hour).padStart(2, '0'),
    value: byHour[String(hour)] ?? 0,
  }))
}

export function weekdayBars(byDayOfWeek: Record<string, number>): { label: string; value: number }[] {
  return ['1', '2', '3', '4', '5', '6', '7'].map((code) => ({
    label: TIMS_DAY_OF_WEEK[code] ?? code,
    value: byDayOfWeek[code] ?? 0,
  }))
}

export function yearBars(byYear: Record<string, number>): { label: string; value: number }[] {
  return Object.keys(byYear)
    .sort()
    .map((year) => ({ label: year, value: byYear[year] ?? 0 }))
}

export function shareOf(part: number, whole: number): string | null {
  if (whole <= 0) return null
  return `${((part / whole) * 100).toFixed(1)}%`
}

function cell(parts: string[], index: number): string {
  if (index < 0) return ''
  return (parts[index] ?? '').trim()
}

function flagY(parts: string[], index: number): boolean {
  return cell(parts, index).toUpperCase() === 'Y'
}

function finiteNumber(raw: string | undefined): number {
  const n = Number(raw ?? 0)
  return Number.isFinite(n) ? n : 0
}

function parseYear(accidentYear: string, date: string): number | null {
  const fromCol = Number(accidentYear)
  if (Number.isFinite(fromCol) && fromCol >= 1900 && fromCol <= 2100) return fromCol
  const fromDate = Number(date.slice(0, 4))
  if (Number.isFinite(fromDate) && fromDate >= 1900 && fromDate <= 2100) return fromDate
  return null
}

function parseDayOfWeek(raw: string): number | null {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 1 || n > 7) return null
  return n
}

function parseCollisionHour(raw: string): number | null {
  const digits = raw.trim().replace(/\D/g, '')
  if (!digits) return null
  const n = Number(digits)
  if (!Number.isFinite(n)) return null
  if (digits.length <= 2) return Math.min(23, n)
  return Math.min(23, Math.floor(n / 100))
}

function collisionSeverity(code: string, killed: number, injured: number): Collision['severity'] {
  if (code.trim() === '1' || killed > 0) return 'fatal'
  if (code.trim() === '2' || code.trim() === '3' || code.trim() === '4' || injured > 0) return 'injury'
  return 'property'
}

function collisionGeo(
  parts: string[],
  col: { lat: number; lng: number; pointX: number; pointY: number },
  intersection: string,
): GeoRef {
  const lat = firstCoord(parts[col.lat], parts[col.pointY])
  const lng = firstCoord(parts[col.lng], parts[col.pointX])
  if (lat != null && lng != null) {
    return joinGeo({ lat, lng, addressOriginal: intersection })
  }
  return {
    addressOriginal: intersection,
    addressNormalized: intersection,
    lat: null,
    lng: null,
    zip: null,
    censusTract: null,
    neighborhood: null,
    policeSector: null,
    parcel: null,
  }
}

function firstCoord(...raw: (string | undefined)[]): number | null {
  for (const value of raw) {
    const n = Number(value)
    if (Number.isFinite(n) && n !== 0) return n
  }
  return null
}
