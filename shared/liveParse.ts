import type { DataClass, Earthquake, WeatherPeriod } from './types.ts'

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

export function isQuakeMlDocument(xml: string): boolean {
  return /<(?:[\w-]+:)?(?:quakeml|eventParameters)\b/i.test(xml)
}

export function isDwmlDocument(xml: string): boolean {
  return /<dwml\b/i.test(xml) || /<data\s+type="forecast"/i.test(xml)
}

export function parseQuakeMl(xml: string, dataClass: DataClass = 'live'): Earthquake[] {
  if (!isQuakeMlDocument(xml)) return []
  const out: Earthquake[] = []
  const eventRe = /<event\b([^>]*)>([\s\S]*?)<\/event>/gi
  let match: RegExpExecArray | null
  while ((match = eventRe.exec(xml)) !== null) {
    const open = match[1] ?? ''
    const body = match[2] ?? ''
    const id = quakeEventId(open)
    const origin = firstElement(body, 'origin')?.inner ?? ''
    const lat = Number(firstValue(origin, 'latitude'))
    const lng = Number(firstValue(origin, 'longitude'))
    if (!id || !Number.isFinite(lat) || !Number.isFinite(lng)) continue
    const depthM = Number(firstValue(origin, 'depth'))
    const magBlock = firstElement(body, 'magnitude')?.inner ?? ''
    const mag = Number(firstValue(magBlock, 'mag') ?? firstValue(body, 'mag'))
    const place = firstElement(firstElement(body, 'description')?.inner ?? '', 'text')?.inner.trim() ?? ''
    const timeRaw = firstValue(origin, 'time') ?? ''
    out.push({
      id,
      time: isoTime(timeRaw),
      mag: Number.isFinite(mag) ? mag : 0,
      place,
      lat,
      lng,
      depthKm: Number.isFinite(depthM) ? depthM / 1000 : 0,
      url: `https://earthquake.usgs.gov/earthquakes/eventpage/${id}`,
      dataClass,
    })
  }
  return out
}

export function parseDwmlForecast(xml: string): WeatherPeriod[] {
  const forecast = xml.match(/<data\s+type="forecast">([\s\S]*?)<\/data>/i)?.[1] ?? xml
  const periods = twelveHourPeriods(forecast)
  if (periods.length === 0) return []
  const maxBlock = forecast.match(/<temperature\b[^>]*\btype="maximum"[^>]*>([\s\S]*?)<\/temperature>/i)?.[1] ?? ''
  const maxTemps = tagTexts(maxBlock, 'value').map((v) => Number(v))
  const weatherBlock = forecast.match(/<weather\b[^>]*>([\s\S]*?)<\/weather>/i)?.[1] ?? ''
  const summaries = [...weatherBlock.matchAll(/weather-summary="([^"]*)"/gi)].map((row) => row[1] ?? '')
  const wordedBlock = forecast.match(/<wordedForecast\b[^>]*>([\s\S]*?)<\/wordedForecast>/i)?.[1] ?? ''
  const worded = tagTexts(wordedBlock, 'text').map((t) => t.replace(/\s+/g, ' ').trim())
  const out: WeatherPeriod[] = []
  let dayIndex = 0
  for (let i = 0; i < periods.length; i += 1) {
    const period = periods[i]
    if (!period || /night/i.test(period.name)) continue
    const rawTemp = maxTemps[dayIndex]
    out.push({
      name: period.name,
      startTime: period.startTime,
      temperatureF: rawTemp !== undefined && Number.isFinite(rawTemp) ? rawTemp : 0,
      shortForecast: summaries[i] ?? '',
      wind: windFromWorded(worded[i] ?? ''),
    })
    dayIndex += 1
    if (out.length >= 7) break
  }
  return out
}

function twelveHourPeriods(forecast: string): { name: string; startTime: string }[] {
  const layouts = [...forecast.matchAll(/<time-layout\b[^>]*>([\s\S]*?)<\/time-layout>/gi)]
  let best: { name: string; startTime: string }[] = []
  for (const layout of layouts) {
    const inner = layout[1] ?? ''
    const periods = [...inner.matchAll(/<start-valid-time\s+period-name="([^"]+)">([^<]*)<\/start-valid-time>/gi)].map(
      (row) => ({ name: row[1] ?? '', startTime: (row[2] ?? '').trim() }),
    )
    const hasNight = periods.some((p) => /night/i.test(p.name))
    const hasDay = periods.some((p) => !/night/i.test(p.name))
    if (hasNight && hasDay && periods.length > best.length) best = periods
  }
  return best
}

function windFromWorded(text: string): string {
  const match = text.match(/([^.]{0,100}\bwind\b[^.]*\.?)/i)
  return match?.[1]?.trim() ?? ''
}

function quakeEventId(openAttrs: string): string {
  const source = openAttrs.match(/catalog:eventsource="([^"]+)"/i)?.[1]
  const eventId = openAttrs.match(/catalog:eventid="([^"]+)"/i)?.[1]
  if (source && eventId) return `${source}${eventId}`
  return openAttrs.match(/eventid=([a-z]{0,4}\d+)/i)?.[1] ?? ''
}

function firstElement(xml: string, localName: string): { inner: string } | null {
  const re = new RegExp(`<(?:[\\w-]+:)?${localName}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w-]+:)?${localName}>`, 'i')
  const match = xml.match(re)
  if (!match?.[1]) return null
  return { inner: match[1] }
}

function firstValue(xml: string, parent: string): string | null {
  const block = firstElement(xml, parent)
  if (!block) return null
  const value = firstElement(block.inner, 'value')
  if (value) return value.inner.trim()
  const text = block.inner.replace(/<[^>]+>/g, '').trim()
  return text || null
}

function tagTexts(xml: string, localName: string): string[] {
  const re = new RegExp(`<(?:[\\w-]+:)?${localName}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w-]+:)?${localName}>`, 'gi')
  return [...xml.matchAll(re)].map((row) => (row[1] ?? '').trim())
}

function isoTime(raw: string): string {
  const ms = Date.parse(raw)
  return Number.isFinite(ms) ? new Date(ms).toISOString() : raw
}
