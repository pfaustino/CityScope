import { parseDwmlForecast, parseForecast, parseQuakeMl, isDwmlDocument, isQuakeMlDocument } from '@shared/liveParse.ts'
import { makeProvenance } from '@shared/provenance.ts'
import {
  NWS_DWML_URL,
  NWS_JSON_FALLBACK_URL,
  USGS_QUAKEML_URL,
  USGS_MIN_MAG,
  USGS_QUAKE_RADIUS_KM,
  USGS_STARTTIME,
  BURBANK_LAT,
  BURBANK_LNG,
  type PublicFeedState,
} from '@shared/publicFeeds.ts'
import type { Earthquake, Provenance, WeatherPeriod } from '@shared/types.ts'

let weatherOnce: Promise<PublicFeedState<WeatherPeriod[]>> | null = null
let quakesOnce: Promise<PublicFeedState<Earthquake[]>> | null = null

export function fetchLiveWeather(): Promise<PublicFeedState<WeatherPeriod[]>> {
  if (!weatherOnce) weatherOnce = loadWeather()
  return weatherOnce
}

export function fetchLiveEarthquakes(): Promise<PublicFeedState<Earthquake[]>> {
  if (!quakesOnce) quakesOnce = loadEarthquakes()
  return quakesOnce
}

export function feedStatLabel(base: string, feed: PublicFeedState<unknown>): string {
  if (feed.loading) return base
  return `${base} (${feed.dataClass})`
}

export function feedMetaLine(feed: PublicFeedState<unknown>): string {
  if (feed.loading) return 'Retrieving public XML…'
  if (feed.format === 'json') return `live · JSON fallback · ${feed.retrievedAt ?? ''}`
  if (feed.dataClass === 'live') return `live · ${feed.retrievedAt ?? ''}`
  return feed.error ? `snapshot · ${feed.error}` : 'snapshot'
}

export function weatherProvenance(
  feed: PublicFeedState<WeatherPeriod[]>,
  period: WeatherPeriod | undefined,
  snapshotAt: string,
): Provenance {
  const live = feed.dataClass === 'live' && feed.items && feed.items.length > 0
  return makeProvenance({
    label: 'NWS Burbank forecast',
    value: period ? `${period.shortForecast}, ${period.temperatureF}°F` : 'Unavailable',
    sourceId: 'nws-forecast',
    dataset:
      feed.format === 'json'
        ? 'api.weather.gov GeoJSON (DWML XML fallback)'
        : feed.format === 'xml'
          ? 'NWS DWML MapClick'
          : 'Baked NWS snapshot',
    query: {
      url: feed.sourceUrl,
      lat: BURBANK_LAT,
      lon: BURBANK_LNG,
      FcstType: feed.format === 'xml' ? 'dwml' : 'json',
    },
    geographicFilter: `Burbank (~${BURBANK_LAT}, ${BURBANK_LNG})`,
    timePeriod: { start: period?.startTime || snapshotAt, end: period?.startTime || snapshotAt },
    transformation:
      feed.format === 'xml'
        ? 'DWML daytime periods: maximum temperature, weather-summary, wind phrase from wordedForecast'
        : feed.format === 'json'
          ? 'api.weather.gov daytime forecast periods'
          : 'Published snapshot retained after live fetch failed',
    claimType: 'fact',
    dataClass: live ? 'live' : 'snapshot',
    retrievedAt: feed.retrievedAt ?? snapshotAt,
    limitations: [
      'Forecast, not a climate archive. NOAA CDO is a separate keyed source and is not fetched in the browser.',
      ...(feed.note ? [feed.note] : []),
      ...(feed.error ? [`Live fetch failed: ${feed.error}`] : []),
    ],
  })
}

export function quakeProvenance(
  feed: PublicFeedState<Earthquake[]>,
  count: number,
  snapshotAt: string,
): Provenance {
  const live = feed.dataClass === 'live' && feed.items !== null
  return makeProvenance({
    label: 'USGS events M≥2.5 within 40 km',
    value: count,
    sourceId: 'usgs-earthquakes',
    dataset: feed.format === 'xml' ? 'USGS FDSN QuakeML' : 'Baked USGS snapshot',
    query: {
      url: feed.sourceUrl,
      format: 'xml',
      latitude: BURBANK_LAT,
      longitude: BURBANK_LNG,
      maxradiuskm: USGS_QUAKE_RADIUS_KM,
      minmagnitude: USGS_MIN_MAG,
      starttime: USGS_STARTTIME,
    },
    geographicFilter: `${USGS_QUAKE_RADIUS_KM} km radius from Burbank center`,
    timePeriod: { start: USGS_STARTTIME, end: feed.retrievedAt?.slice(0, 10) || snapshotAt.slice(0, 10) },
    transformation: 'Count of QuakeML event elements after the FDSN radius/magnitude/starttime filter',
    claimType: 'fact',
    dataClass: live ? 'live' : 'snapshot',
    retrievedAt: feed.retrievedAt ?? snapshotAt,
    limitations: [
      'Radius includes epicenters outside Burbank city limits. Window is 2026 YTD (starttime=2026-01-01).',
      ...(feed.note ? [feed.note] : []),
      ...(feed.error ? [`Live fetch failed: ${feed.error}`] : []),
    ],
  })
}

async function loadWeather(): Promise<PublicFeedState<WeatherPeriod[]>> {
  try {
    const xml = await getText(NWS_DWML_URL, 'application/xml, text/xml')
    if (!isDwmlDocument(xml)) throw new Error('Response was not NWS DWML')
    const items = parseDwmlForecast(xml)
    if (items.length === 0) throw new Error('DWML had no daytime forecast periods')
    return liveState(items, NWS_DWML_URL, 'xml')
  } catch (xmlErr) {
    const xmlMessage = explain(xmlErr, NWS_DWML_URL)
    try {
      const body: unknown = await getJson(NWS_JSON_FALLBACK_URL, 'application/geo+json')
      const items = parseForecast(body)
      if (items.length === 0) throw new Error('JSON forecast had no daytime periods')
      return {
        ...liveState(items, NWS_JSON_FALLBACK_URL, 'json'),
        note: `NWS DWML XML failed (${xmlMessage}). Showing api.weather.gov JSON as a fallback — live, not a snapshot.`,
      }
    } catch (jsonErr) {
      return failState(NWS_DWML_URL, `DWML: ${xmlMessage}. JSON fallback: ${explain(jsonErr, NWS_JSON_FALLBACK_URL)}`)
    }
  }
}

async function loadEarthquakes(): Promise<PublicFeedState<Earthquake[]>> {
  try {
    const xml = await getText(USGS_QUAKEML_URL, 'application/xml, text/xml')
    if (!isQuakeMlDocument(xml)) throw new Error('Response was not USGS QuakeML')
    return liveState(parseQuakeMl(xml, 'live'), USGS_QUAKEML_URL, 'xml')
  } catch (err) {
    return failState(USGS_QUAKEML_URL, explain(err, USGS_QUAKEML_URL))
  }
}

function liveState<T>(items: T, sourceUrl: string, format: 'xml' | 'json'): PublicFeedState<T> {
  return {
    items,
    dataClass: 'live',
    retrievedAt: new Date().toISOString(),
    sourceUrl,
    format,
    error: null,
    note: null,
    loading: false,
  }
}

function failState<T>(sourceUrl: string, error: string): PublicFeedState<T> {
  return {
    items: null,
    dataClass: 'snapshot',
    retrievedAt: null,
    sourceUrl,
    format: null,
    error,
    note: null,
    loading: false,
  }
}

async function getText(url: string, accept: string): Promise<string> {
  const res = await fetch(url, { headers: { Accept: accept } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

async function getJson(url: string, accept: string): Promise<unknown> {
  const res = await fetch(url, { headers: { Accept: accept } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function explain(err: unknown, url: string): string {
  const message = err instanceof Error ? err.message : String(err)
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return `Browser could not GET ${url} (${message}). This is often CORS or a network block.`
  }
  return `${message} from ${url}`
}
