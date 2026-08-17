import type { DataClass, Earthquake, Warehouse, WeatherPeriod } from './types.ts'

/** Burbank city center used by NWS MapClick and USGS FDSN. */
export const BURBANK_LAT = '34.1808'
export const BURBANK_LNG = '-118.3090'

/** USGS filter: 40 km from city center, M≥2.5, calendar 2026 YTD. */
export const USGS_QUAKE_RADIUS_KM = '40'
export const USGS_MIN_MAG = '2.5'
export const USGS_STARTTIME = '2026-01-01'

export const USGS_QUAKEML_URL =
  `https://earthquake.usgs.gov/fdsnws/event/1/query?format=xml&latitude=${BURBANK_LAT}&longitude=${BURBANK_LNG}&maxradiuskm=${USGS_QUAKE_RADIUS_KM}&starttime=${USGS_STARTTIME}&minmagnitude=${USGS_MIN_MAG}`

export const NWS_DWML_URL =
  `https://forecast.weather.gov/MapClick.php?lat=${BURBANK_LAT}&lon=${BURBANK_LNG}&FcstType=dwml`

/** JSON only if DWML XML cannot be read in the browser (CORS/parse). */
export const NWS_JSON_FALLBACK_URL = 'https://api.weather.gov/gridpoints/LOX/154,51/forecast'

export type PublicFeedState<T> = {
  items: T | null
  dataClass: DataClass
  retrievedAt: string | null
  sourceUrl: string
  format: 'xml' | 'json' | null
  error: string | null
  note: string | null
  loading: boolean
}

export function pendingFeed<T>(sourceUrl: string): PublicFeedState<T> {
  return {
    items: null,
    dataClass: 'snapshot',
    retrievedAt: null,
    sourceUrl,
    format: null,
    error: null,
    note: null,
    loading: true,
  }
}

export function mergePublicFeeds(
  warehouse: Warehouse,
  weather: PublicFeedState<WeatherPeriod[]>,
  earthquakes: PublicFeedState<Earthquake[]>,
): Warehouse {
  const next: Warehouse = { ...warehouse }
  if (weather.items && weather.items.length > 0) next.weather = weather.items
  if (earthquakes.items) next.earthquakes = earthquakes.items
  else next.earthquakes = next.earthquakes.map((e) => ({ ...e, dataClass: 'snapshot' }))
  return next
}
