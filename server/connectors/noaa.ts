import { keyPresent } from '../env.ts'
import { fetchJson } from '../http.ts'
import type { ClimateDay } from '../../shared/types.ts'

const STATION = 'GHCND:USW00023152'

export async function fetchNoaaHint() {
  return fetchNoaaClimate()
}

export async function fetchNoaaClimate(): Promise<ClimateDay[] | { status: string; message: string }> {
  if (!keyPresent('NOAA_CDO_TOKEN')) {
    return {
      status: 'needs_api_key',
      message: 'Set NOAA_CDO_TOKEN. NWS forecast remains available without this token.',
    }
  }
  const token = process.env.NOAA_CDO_TOKEN
  if (!token) throw new Error('NOAA_CDO_TOKEN missing')
  const end = new Date()
  const start = new Date(end.getTime() - 14 * 24 * 60 * 60 * 1000)
  const startdate = start.toISOString().slice(0, 10)
  const enddate = end.toISOString().slice(0, 10)
  const params = new URLSearchParams({
    datasetid: 'GHCND',
    stationid: STATION,
    startdate,
    enddate,
    units: 'standard',
    limit: '1000',
  })
  const url = `https://www.ncei.noaa.gov/cdo-web/api/v2/data?${params.toString()}`
  const body = await fetchJson(url, { headers: { token } })
  return parseNoaa(body, STATION)
}

export function parseNoaa(body: unknown, station: string): ClimateDay[] {
  if (!body || typeof body !== 'object') throw new Error('NOAA: unexpected payload')
  const results = (body as { results?: unknown }).results
  if (!Array.isArray(results)) return []
  const byDate = new Map<string, ClimateDay>()
  for (const raw of results) {
    if (!raw || typeof raw !== 'object') continue
    const row = raw as { date?: string; datatype?: string; value?: number }
    const day = (row.date ?? '').slice(0, 10)
    if (!day) continue
    const rec = byDate.get(day) ?? {
      date: day,
      tmaxF: null,
      tminF: null,
      prcpIn: null,
      station,
      dataClass: 'live' as const,
    }
    if (row.datatype === 'TMAX') rec.tmaxF = Number(row.value)
    if (row.datatype === 'TMIN') rec.tminF = Number(row.value)
    if (row.datatype === 'PRCP') rec.prcpIn = Number(row.value)
    byDate.set(day, rec)
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}
