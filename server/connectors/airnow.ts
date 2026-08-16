import { keyPresent } from '../env.ts'
import { fetchJson } from '../http.ts'
import type { AirQualityObs } from '../../shared/types.ts'

export async function fetchAirNow(): Promise<AirQualityObs[] | { status: string; message: string }> {
  if (!keyPresent('AIRNOW_API_KEY')) {
    return {
      status: 'needs_api_key',
      message: 'Set AIRNOW_API_KEY. AirNow observations are preliminary and not for regulation.',
    }
  }
  const apiKey = process.env.AIRNOW_API_KEY
  if (!apiKey) throw new Error('AIRNOW_API_KEY missing')
  const params = new URLSearchParams({
    format: 'application/json',
    zipCode: '91502',
    distance: '25',
    API_KEY: apiKey,
  })
  const url = `https://www.airnowapi.org/aq/observation/zipCode/current/?${params.toString()}`
  const body = await fetchJson(url)
  return parseAirNow(body)
}

export function parseAirNow(body: unknown): AirQualityObs[] {
  if (!Array.isArray(body)) throw new Error('AirNow: unexpected payload')
  const out: AirQualityObs[] = []
  for (const raw of body) {
    if (!raw || typeof raw !== 'object') continue
    const row = raw as Record<string, unknown>
    const aqi = Number(row.AQI ?? row.nowcastAQI ?? row.aqi)
    if (!Number.isFinite(aqi)) continue
    const category =
      typeof row.Category === 'object' && row.Category
        ? String((row.Category as { Name?: string }).Name ?? 'Unknown')
        : String(row.categoryName ?? row.category ?? 'Unknown')
    out.push({
      dateObserved: String(row.DateObserved ?? row.dateObserved ?? ''),
      hourObserved: Number(row.HourObserved ?? row.hourObserved ?? 0),
      reportingArea: String(row.ReportingArea ?? row.reportingArea ?? 'Burbank area'),
      parameter: String(row.ParameterName ?? row.parameterName ?? row.parameter ?? 'AQI'),
      aqi,
      category,
      dataClass: 'live',
    })
  }
  return out
}
