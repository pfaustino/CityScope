import { useEffect, useMemo, useState } from 'react'
import { analyzeWarehouse } from '@shared/analysis.ts'
import { applyOverlay } from '@shared/overlay.ts'
import {
  mergePublicFeeds,
  NWS_DWML_URL,
  pendingFeed,
  USGS_QUAKEML_URL,
  type PublicFeedState,
} from '@shared/publicFeeds.ts'
import type { Earthquake, LiveOverlay, Warehouse, WeatherPeriod } from '@shared/types.ts'
import { getWarehouse } from '@shared/warehouse.ts'
import { fetchLiveEarthquakes, fetchLiveWeather } from './fetchPublicFeeds.ts'
import { fetchLiveOrBaked } from './staticFiles.ts'

export type PublicFeeds = {
  weather: PublicFeedState<WeatherPeriod[]>
  earthquakes: PublicFeedState<Earthquake[]>
}

export function useCityData() {
  const base = useMemo(() => getWarehouse(), [])
  const [warehouse, setWarehouse] = useState<Warehouse>(base)
  const [overlayErrors, setOverlayErrors] = useState<{ sourceId: string; message: string }[]>([])
  const [publicFeeds, setPublicFeeds] = useState<PublicFeeds>({
    weather: pendingFeed(NWS_DWML_URL),
    earthquakes: pendingFeed(USGS_QUAKEML_URL),
  })

  useEffect(() => {
    let cancelled = false
    void Promise.all([
      fetchLiveOrBaked<LiveOverlay>('/api/overlay', 'overlay.json'),
      fetchLiveWeather(),
      fetchLiveEarthquakes(),
    ]).then(([overlay, weather, earthquakes]) => {
      if (cancelled) return
      const withOverlay = overlay ? applyOverlay(base, overlay) : base
      setWarehouse(mergePublicFeeds(withOverlay, weather, earthquakes))
      const errors = [...(overlay?.errors ?? [])].filter(
        (e) => e.sourceId !== 'nws-forecast' && e.sourceId !== 'usgs-earthquakes',
      )
      if (weather.error) errors.push({ sourceId: 'nws-forecast', message: weather.error })
      if (earthquakes.error) errors.push({ sourceId: 'usgs-earthquakes', message: earthquakes.error })
      setOverlayErrors(errors)
      setPublicFeeds({ weather, earthquakes })
    })
    return () => {
      cancelled = true
    }
  }, [base])

  const analysis = useMemo(() => analyzeWarehouse(warehouse), [warehouse])
  return { warehouse, analysis, overlayErrors, publicFeeds }
}

export function usd(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export function pct(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return 'n/a'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

export function num(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}
