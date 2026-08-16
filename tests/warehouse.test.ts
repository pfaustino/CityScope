import { describe, expect, it } from 'vitest'
import { analyzeWarehouse } from '../shared/analysis.ts'
import { joinGeo, nearestNeighborhood, normalizeAddress } from '../shared/geo.ts'
import { applyOverlay } from '../shared/overlay.ts'
import { buildWarehouse } from '../shared/warehouse.ts'

describe('warehouse and analysis', () => {
  const wh = buildWarehouse()
  const analysis = analyzeWarehouse(wh)

  it('does not invent crime incidents', () => {
    expect(wh.crime).toHaveLength(0)
    expect(analysis.overview.crimeAvailable).toBe(false)
    expect(analysis.overview.crimeThisMonth).toBeNull()
    expect(analysis.anomalies.filter((a) => a.id.includes('crime'))).toHaveLength(0)
    expect(wh.crimeAnnual.some((r) => r.year === 2024 && r.violent === 396)).toBe(true)
    expect(wh.crimeAnnual.every((r) => r.dataClass !== 'demonstration')).toBe(true)
  })

  it('keeps census and earthquake rows as snapshots until overlay', () => {
    expect(wh.census.every((c) => c.provenance.dataClass === 'snapshot')).toBe(true)
    expect(wh.earthquakes.every((e) => e.dataClass === 'snapshot')).toBe(true)
  })

  it('joins geography to neighborhood, zip, tract, and sector', () => {
    const geo = joinGeo({ lat: 34.1752, lng: -118.3418, addressOriginal: '100 Magnolia Ave' })
    expect(geo.neighborhood).toBe('Magnolia Park')
    expect(geo.zip).toBe('91505')
    expect(geo.censusTract).toBeTruthy()
    expect(geo.policeSector).toBeTruthy()
    expect(geo.addressNormalized).toContain('Avenue')
  })

  it('normalizes street abbreviations', () => {
    expect(normalizeAddress('100 N Olive Ave')).toContain('Avenue')
    expect(nearestNeighborhood(34.1808, -118.3089).name).toBe('Downtown')
  })

  it('does not emit demonstration discoveries', () => {
    expect(analysis.discoveries).toHaveLength(0)
    expect(analysis.correlations).toHaveLength(0)
  })

  it('merges a live overlay without adding crime points', () => {
    const merged = applyOverlay(wh, {
      retrievedAt: '2026-08-15T12:00:00Z',
      census: [
        {
          ...wh.census[1]!,
          year: '2023',
          population: 105165,
          provenance: { ...wh.census[1]!.provenance, dataClass: 'live' },
        },
      ],
      weather: null,
      earthquakes: null,
      climate: [{ date: '2026-08-14', tmaxF: 90, tminF: 64, prcpIn: 0, station: 'GHCND:USW00023152', dataClass: 'live' }],
      airQuality: [
        {
          dateObserved: '2026-08-15',
          hourObserved: 8,
          reportingArea: 'Burbank',
          parameter: 'PM2.5',
          aqi: 42,
          category: 'Good',
          dataClass: 'live',
        },
      ],
      crimeAnnual: null,
      fbiAnnual: null,
      collisions: null,
      collisionsFile: null,
      errors: [],
    })
    expect(merged.crime).toHaveLength(0)
    expect(merged.census[0]?.provenance.dataClass).toBe('live')
    expect(merged.airQuality[0]?.aqi).toBe(42)
    expect(merged.climate).toHaveLength(1)
  })

  it('overlays SWITRS collisions as snapshots, not demonstration rows', () => {
    const merged = applyOverlay(wh, {
      retrievedAt: '2026-08-15T12:00:00Z',
      census: null,
      weather: null,
      earthquakes: null,
      climate: null,
      airQuality: null,
      crimeAnnual: null,
      fbiAnnual: null,
      collisions: [
        {
          id: '82189740',
          date: '2023-01-05',
          hour: 20,
          severity: 'injury',
          intersection: 'ALAMEDA AVENUE & GATEWAY',
          geo: {
            addressOriginal: 'ALAMEDA AVENUE & GATEWAY',
            addressNormalized: 'ALAMEDA AVENUE & GATEWAY',
            lat: 34.1735,
            lng: -118.3007,
            zip: null,
            censusTract: null,
            neighborhood: null,
            policeSector: null,
            parcel: null,
          },
          dataClass: 'snapshot',
        },
      ],
      collisionsFile: 'Crashes.csv',
      errors: [],
    })
    expect(merged.collisions).toHaveLength(1)
    expect(merged.collisions[0]?.dataClass).toBe('snapshot')
    expect(merged.collisionsFile).toBe('Crashes.csv')
  })
})
