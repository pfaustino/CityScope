import type { GeoRef, Neighborhood } from './types.ts'

export const NEIGHBORHOODS: Neighborhood[] = [
  { id: 'downtown', name: 'Downtown', lat: 34.1808, lng: -118.3089, zipPrimary: '91502' },
  { id: 'magnolia-park', name: 'Magnolia Park', lat: 34.1752, lng: -118.3418, zipPrimary: '91505' },
  { id: 'media-district', name: 'Media District', lat: 34.1536, lng: -118.3369, zipPrimary: '91505' },
  { id: 'rancho', name: 'Rancho', lat: 34.1864, lng: -118.3302, zipPrimary: '91505' },
  { id: 'hillside', name: 'Hillside', lat: 34.1981, lng: -118.3076, zipPrimary: '91501' },
  { id: 'airport', name: 'Airport / Northwest', lat: 34.2006, lng: -118.3587, zipPrimary: '91504' },
  { id: 'chandler', name: 'Chandler Park', lat: 34.1684, lng: -118.3251, zipPrimary: '91506' },
  { id: 'empire', name: 'Empire Center', lat: 34.1879, lng: -118.3488, zipPrimary: '91504' },
]

const TRACT_BY_NEIGHBORHOOD: Record<string, string> = {
  downtown: '3104.01',
  'magnolia-park': '3114.00',
  'media-district': '3116.02',
  rancho: '3107.01',
  hillside: '3101.00',
  airport: '3105.02',
  chandler: '3115.00',
  empire: '3106.01',
}

const SECTOR_BY_NEIGHBORHOOD: Record<string, string> = {
  downtown: 'Sector 1',
  'magnolia-park': 'Sector 2',
  'media-district': 'Sector 2',
  rancho: 'Sector 3',
  hillside: 'Sector 3',
  airport: 'Sector 4',
  chandler: 'Sector 1',
  empire: 'Sector 4',
}

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const r = 6371
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * r * Math.asin(Math.sqrt(s))
}

function toRad(d: number): number {
  return (d * Math.PI) / 180
}

export function nearestNeighborhood(lat: number, lng: number): Neighborhood {
  let best = NEIGHBORHOODS[0]
  let bestD = Number.POSITIVE_INFINITY
  for (const n of NEIGHBORHOODS) {
    const d = haversineKm(lat, lng, n.lat, n.lng)
    if (d < bestD) {
      bestD = d
      best = n
    }
  }
  if (!best) {
    const fallback = NEIGHBORHOODS[0]
    if (!fallback) throw new Error('NEIGHBORHOODS is empty')
    return fallback
  }
  return best
}

export function joinGeo(input: {
  addressOriginal?: string | null
  lat: number
  lng: number
  parcel?: string | null
}): GeoRef {
  const n = nearestNeighborhood(input.lat, input.lng)
  return {
    addressOriginal: input.addressOriginal ?? null,
    addressNormalized: input.addressOriginal ? normalizeAddress(input.addressOriginal) : null,
    lat: input.lat,
    lng: input.lng,
    zip: n.zipPrimary,
    censusTract: TRACT_BY_NEIGHBORHOOD[n.id] ?? null,
    neighborhood: n.name,
    policeSector: SECTOR_BY_NEIGHBORHOOD[n.id] ?? null,
    parcel: input.parcel ?? null,
  }
}

export function normalizeAddress(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\bSt\b/gi, 'Street')
    .replace(/\bAve\b/gi, 'Avenue')
    .replace(/\bBlvd\b/gi, 'Boulevard')
    .replace(/\bDr\b/gi, 'Drive')
    .replace(/\bRd\b/gi, 'Road')
    .replace(/\bN\b/g, 'North')
    .replace(/\bS\b/g, 'South')
    .replace(/\bE\b/g, 'East')
    .replace(/\bW\b/g, 'West')
}

export function jitter(lat: number, lng: number, rng: () => number, meters = 420): { lat: number; lng: number } {
  const dLat = ((rng() - 0.5) * meters) / 111_000
  const dLng = ((rng() - 0.5) * meters) / (111_000 * Math.cos(toRad(lat)))
  return { lat: lat + dLat, lng: lng + dLng }
}
