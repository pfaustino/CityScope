import { parseCsv } from './csv.ts'
import { joinGeo } from './geo.ts'
import type { Collision, GeoRef, Provenance, Warehouse } from './types.ts'

export const SWITRS_DEFAULT_FILE = 'Crashes.csv'

const LIMITATIONS = [
  'Official SWITRS/TIMS collision rows from the local extract — not demonstration data.',
  'This extract is not a live CAD or 911 feed.',
  'Rows without usable coordinates are counted and not mapped.',
  'Correlation is not causation. Counts without traffic volume are not a dangerous-intersection finding.',
]

export function parseSwitrsCsv(text: string, fileName: string): Collision[] {
  const rows = parseCsv(text)
  const header = rows[0]
  if (!header) throw new Error('SWITRS: empty file')
  const idx = (name: string) => header.indexOf(name)
  const col = {
    id: idx('CASE_ID'),
    date: idx('COLLISION_DATE'),
    time: idx('COLLISION_TIME'),
    severity: idx('COLLISION_SEVERITY'),
    killed: idx('NUMBER_KILLED'),
    injured: idx('NUMBER_INJURED'),
    primary: idx('PRIMARY_RD'),
    secondary: idx('SECONDARY_RD'),
    lat: idx('LATITUDE'),
    lng: idx('LONGITUDE'),
    pointX: idx('POINT_X'),
    pointY: idx('POINT_Y'),
    city: idx('CITY'),
  }
  if (col.id < 0 || col.date < 0 || col.severity < 0) {
    throw new Error(`SWITRS: unexpected header in ${fileName}`)
  }
  const out: Collision[] = []
  for (const parts of rows.slice(1)) {
    const city = (parts[col.city] ?? '').trim()
    if (city && city.toUpperCase() !== 'BURBANK') continue
    const id = (parts[col.id] ?? '').trim()
    const date = (parts[col.date] ?? '').trim()
    if (!id || !date) continue
    const primary = (parts[col.primary] ?? '').trim()
    const secondary = (parts[col.secondary] ?? '').trim()
    const intersection = secondary ? `${primary} & ${secondary}` : primary || 'Unknown location'
    const killed = Number(parts[col.killed] ?? 0)
    const injured = Number(parts[col.injured] ?? 0)
    out.push({
      id,
      date,
      hour: parseCollisionHour(parts[col.time] ?? ''),
      severity: collisionSeverity(parts[col.severity] ?? '', killed, injured),
      intersection,
      geo: collisionGeo(parts, col, intersection),
      dataClass: 'snapshot',
    })
  }
  if (out.length === 0) throw new Error(`SWITRS: no Burbank rows in ${fileName}`)
  return out
}

export function collisionsProvenance(wh: Warehouse, fileName = SWITRS_DEFAULT_FILE): Provenance {
  const geo = wh.collisions.filter((c) => c.geo.lat != null && c.geo.lng != null).length
  const dates = wh.collisions.map((c) => c.date).filter(Boolean).sort()
  return {
    statisticId: 'switrs-crashes-count',
    label: `Collision records (${fileName})`,
    value: wh.collisions.length,
    sourceId: 'switrs',
    sourceName: 'SWITRS / TIMS traffic collisions',
    dataset: fileName,
    retrievedAt: wh.generatedAt,
    query: {
      file: fileName,
      rows: String(wh.collisions.length),
      geocoded: String(geo),
    },
    geographicFilter: 'CITY=BURBANK in the local SWITRS/TIMS extract',
    timePeriod: {
      start: dates[0] ?? 'unknown',
      end: dates[dates.length - 1] ?? 'unknown',
    },
    transformation:
      'Parsed CASE_ID, COLLISION_DATE, COLLISION_TIME, COLLISION_SEVERITY, PRIMARY_RD, SECONDARY_RD, LATITUDE/LONGITUDE (fallback POINT_Y/POINT_X). Filtered to CITY=BURBANK.',
    claimType: 'fact',
    dataClass: 'snapshot',
    limitations: [
      ...LIMITATIONS,
      `${wh.collisions.length - geo} of ${wh.collisions.length} rows have no usable coordinates.`,
    ],
  }
}

function parseCollisionHour(raw: string): number {
  const digits = raw.trim().replace(/\D/g, '')
  if (!digits) return 0
  const n = Number(digits)
  if (!Number.isFinite(n)) return 0
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
