import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchAirNow } from './connectors/airnow.ts'
import { fetchCensusHint } from './connectors/census.ts'
import { fetchNoaaHint } from './connectors/noaa.ts'
import { fetchForecast } from './connectors/nws.ts'
import { fetchFbiCde } from './connectors/fbiCde.ts'
import { fetchOpenJustice } from './connectors/openjustice.ts'
import { loadSwitrsCrashes } from './connectors/switrs.ts'
import { fetchEarthquakes } from './connectors/usgs.ts'
import { loadEnv } from './env.ts'

loadEnv()

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const rawDir = path.join(root, 'data', 'raw')

export type IngestResult = {
  sourceId: string
  ok: boolean
  message: string
  snapshotPath: string | null
}

export async function runIngest(): Promise<IngestResult[]> {
  const results: IngestResult[] = []
  results.push(await snapshot('usgs-earthquakes', () => fetchEarthquakes()))
  results.push(await snapshot('nws-forecast', () => fetchForecast()))
  results.push(await snapshot('census-acs', () => fetchCensusHint()))
  results.push(await snapshot('noaa-cdo', () => fetchNoaaHint()))
  results.push(await snapshot('aqi', () => fetchAirNow()))
  results.push(await snapshot('ca-doj-openjustice', () => fetchOpenJustice()))
  results.push(await snapshot('fbi-cde', () => fetchFbiCde()))
  results.push(await snapshot('switrs', () => Promise.resolve(loadSwitrsCrashes())))
  return results
}

function isAccessGap(value: unknown): value is { status: string; message: string } {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'status' in value &&
      'message' in value &&
      !Array.isArray(value),
  )
}

async function snapshot(sourceId: string, fn: () => Promise<unknown>): Promise<IngestResult> {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const dir = path.join(rawDir, sourceId)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const snapshotPath = path.join(dir, `${stamp}.json`)
  try {
    const body = await fn()
    if (isAccessGap(body)) {
      return { sourceId, ok: false, message: body.message, snapshotPath: null }
    }
    writeFileSync(snapshotPath, JSON.stringify(body, null, 2), 'utf8')
    return { sourceId, ok: true, message: 'Wrote immutable snapshot (prior files kept).', snapshotPath }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { sourceId, ok: false, message, snapshotPath: null }
  }
}

if (process.argv[1] && path.basename(process.argv[1]).startsWith('ingest')) {
  runIngest()
    .then((rows) => {
      for (const row of rows) {
        console.log(`${row.ok ? 'ok' : 'fail'} ${row.sourceId}: ${row.message}`)
      }
    })
    .catch((err) => {
      console.error(err)
      process.exitCode = 1
    })
}
