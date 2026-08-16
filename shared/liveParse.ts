import type { Earthquake, WeatherPeriod } from './types.ts'

export function parseForecast(body: unknown): WeatherPeriod[] {
  if (!body || typeof body !== 'object') return []
  const periods = (body as { properties?: { periods?: unknown } }).properties?.periods
  if (!Array.isArray(periods)) return []
  const out: WeatherPeriod[] = []
  for (const raw of periods) {
    if (!raw || typeof raw !== 'object') continue
    const p = raw as {
      name?: string
      startTime?: string
      temperature?: number
      shortForecast?: string
      windSpeed?: string
      windDirection?: string
      isDaytime?: boolean
    }
    if (!p.isDaytime) continue
    out.push({
      name: String(p.name ?? ''),
      startTime: String(p.startTime ?? ''),
      temperatureF: Number(p.temperature ?? 0),
      shortForecast: String(p.shortForecast ?? ''),
      wind: `${p.windSpeed ?? ''} ${p.windDirection ?? ''}`.trim(),
    })
    if (out.length >= 7) break
  }
  return out
}

export function parseQuakes(body: unknown, dataClass: Earthquake['dataClass'] = 'live'): Earthquake[] {
  if (!body || typeof body !== 'object') return []
  const features = (body as { features?: unknown }).features
  if (!Array.isArray(features)) return []
  const out: Earthquake[] = []
  for (const f of features) {
    if (!f || typeof f !== 'object') continue
    const feat = f as {
      id?: string
      properties?: { mag?: number; place?: string; time?: number; url?: string }
      geometry?: { coordinates?: number[] }
    }
    const coords = feat.geometry?.coordinates
    if (!coords || coords.length < 2) continue
    const lng = coords[0]
    const lat = coords[1]
    const depth = coords[2]
    if (lat === undefined || lng === undefined) continue
    out.push({
      id: String(feat.id ?? ''),
      time: new Date(feat.properties?.time ?? 0).toISOString(),
      mag: Number(feat.properties?.mag ?? 0),
      place: String(feat.properties?.place ?? ''),
      lat,
      lng,
      depthKm: depth ?? 0,
      url: String(feat.properties?.url ?? ''),
      dataClass,
    })
  }
  return out
}
