import { parseForecast, parseQuakes } from '../shared/liveParse.ts'
import type { LiveOverlay } from '../shared/types.ts'
import { fetchAirNow } from './connectors/airnow.ts'
import { fetchCensusAcs } from './connectors/census.ts'
import { fetchFbiCde } from './connectors/fbiCde.ts'
import { fetchNoaaClimate } from './connectors/noaa.ts'
import { fetchForecast } from './connectors/nws.ts'
import { fetchOpenJustice } from './connectors/openjustice.ts'
import { loadSwitrsCrashes } from './connectors/switrs.ts'
import { fetchEarthquakes } from './connectors/usgs.ts'
import { redact } from './http.ts'

function isGap(value: unknown): value is { status: string; message: string } {
  return Boolean(value && typeof value === 'object' && 'status' in value && 'message' in value && !Array.isArray(value))
}

export async function buildLiveOverlay(): Promise<LiveOverlay> {
  const errors: { sourceId: string; message: string }[] = []
  const overlay: LiveOverlay = {
    retrievedAt: new Date().toISOString(),
    census: null,
    weather: null,
    earthquakes: null,
    climate: null,
    airQuality: null,
    crimeAnnual: null,
    fbiAnnual: null,
    collisions: null,
    collisionsFile: null,
    errors,
  }

  const tasks: { sourceId: string; run: () => Promise<void> }[] = [
    {
      sourceId: 'census-acs',
      run: async () => {
        const result = await fetchCensusAcs()
        if (isGap(result)) errors.push({ sourceId: 'census-acs', message: result.message })
        else overlay.census = result
      },
    },
    {
      sourceId: 'nws-forecast',
      run: async () => {
        overlay.weather = parseForecast(await fetchForecast())
      },
    },
    {
      sourceId: 'usgs-earthquakes',
      run: async () => {
        overlay.earthquakes = parseQuakes(await fetchEarthquakes())
      },
    },
    {
      sourceId: 'noaa-cdo',
      run: async () => {
        const result = await fetchNoaaClimate()
        if (isGap(result)) errors.push({ sourceId: 'noaa-cdo', message: result.message })
        else overlay.climate = result
      },
    },
    {
      sourceId: 'aqi',
      run: async () => {
        const result = await fetchAirNow()
        if (isGap(result)) errors.push({ sourceId: 'aqi', message: result.message })
        else overlay.airQuality = result
      },
    },
    {
      sourceId: 'ca-doj-openjustice',
      run: async () => {
        overlay.crimeAnnual = await fetchOpenJustice()
      },
    },
    {
      sourceId: 'fbi-cde',
      run: async () => {
        const result = await fetchFbiCde()
        if (isGap(result)) errors.push({ sourceId: 'fbi-cde', message: result.message })
        else overlay.fbiAnnual = result
      },
    },
    {
      sourceId: 'switrs',
      run: async () => {
        const result = loadSwitrsCrashes()
        if (isGap(result)) errors.push({ sourceId: 'switrs', message: result.message })
        else {
          overlay.collisions = result.collisions
          overlay.collisionsFile = result.fileName
        }
      },
    },
  ]

  const settled = await Promise.allSettled(tasks.map((t) => t.run()))
  settled.forEach((result, i) => {
    const task = tasks[i]
    if (!task || result.status !== 'rejected') return
    const message = result.reason instanceof Error ? result.reason.message : String(result.reason)
    errors.push({ sourceId: task.sourceId, message: redact(message) })
  })
  return overlay
}
