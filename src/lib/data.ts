import { useEffect, useMemo, useState } from 'react'
import { analyzeWarehouse } from '@shared/analysis.ts'
import { applyOverlay } from '@shared/overlay.ts'
import type { LiveOverlay, Warehouse } from '@shared/types.ts'
import { getWarehouse } from '@shared/warehouse.ts'
import { fetchLiveOrBaked } from './staticFiles.ts'

export function useCityData() {
  const base = useMemo(() => getWarehouse(), [])
  const [warehouse, setWarehouse] = useState<Warehouse>(base)
  const [overlayErrors, setOverlayErrors] = useState<{ sourceId: string; message: string }[]>([])

  useEffect(() => {
    let cancelled = false
    void fetchLiveOrBaked<LiveOverlay>('/api/overlay', 'overlay.json').then((overlay) => {
      if (cancelled || !overlay) return
      setWarehouse(applyOverlay(base, overlay))
      setOverlayErrors(overlay.errors ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [base])

  const analysis = useMemo(() => analyzeWarehouse(warehouse), [warehouse])
  return { warehouse, analysis, overlayErrors }
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
