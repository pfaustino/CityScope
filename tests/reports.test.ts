import { describe, expect, it } from 'vitest'
import { analyzeWarehouse } from '../shared/analysis.ts'
import { buildAllReports, buildReport, REPORT_DEFS, reportHasConnectedDataset } from '../shared/reports.ts'
import { SOURCES } from '../shared/catalog.ts'
import { investigate } from '../shared/investigate.ts'
import { buildWarehouse } from '../shared/warehouse.ts'

describe('reports and catalog', () => {
  const wh = buildWarehouse()
  const reports = buildAllReports(wh)

  it('builds every defined report with quality answers', () => {
    expect(reports).toHaveLength(REPORT_DEFS.length)
    for (const r of reports) {
      expect(Object.keys(r.qualityAnswers)).toHaveLength(9)
      expect(r.sections.some((s) => s.heading === 'What we don’t know')).toBe(true)
      expect(r.sections.some((s) => s.heading === 'Sources')).toBe(true)
    }
  })

  it('splits reports with warehouse data from access-gap reports', () => {
    expect(REPORT_DEFS.filter((r) => reportHasConnectedDataset(r.id)).map((r) => r.id)).toEqual([
      'crime-annual',
      'demographics',
      'environment',
    ])
    expect(reportHasConnectedDataset('crime-monthly')).toBe(false)
    expect(reportHasConnectedDataset('police')).toBe(false)
    expect(reportHasConnectedDataset('business')).toBe(false)
    expect(reportHasConnectedDataset('transport')).toBe(false)
    expect(reportHasConnectedDataset('transport', wh)).toBe(false)
  })

  it('builds a transport report from loaded SWITRS rows', () => {
    const loaded = {
      ...wh,
      collisionsFile: 'Crashes.csv',
      collisions: [
        {
          id: '82189740',
          date: '2023-01-05',
          hour: 20,
          severity: 'injury' as const,
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
          dataClass: 'snapshot' as const,
        },
      ],
    }
    expect(reportHasConnectedDataset('transport', loaded)).toBe(true)
    const report = buildReport('transport', loaded, analyzeWarehouse(loaded))
    expect(report.keyNumbers.length).toBeGreaterThan(0)
    expect(report.dataClassNote.toLowerCase()).toContain('snapshot')
    expect(report.dataClassNote.toLowerCase()).toContain('not demonstration')
  })

  it('does not invent police or crime incident counts', () => {
    const police = reports.find((r) => r.id === 'police')
    const crime = reports.find((r) => r.id === 'crime-monthly')
    const annual = reports.find((r) => r.id === 'crime-annual')
    expect(police?.keyNumbers).toHaveLength(0)
    expect(crime?.keyNumbers).toHaveLength(0)
    expect(crime?.dataClassNote.toLowerCase()).toContain('does not invent')
    expect(annual?.keyNumbers.length).toBeGreaterThan(0)
    expect(annual?.dataClassNote.toLowerCase()).not.toContain('demonstration')
  })

  it('catalogs flock as restricted', () => {
    const flock = SOURCES.find((s) => s.id === 'flock-alpr')
    expect(flock?.legalAccess).toBe('RESTRICTED')
    expect(flock?.howToObtain.toLowerCase()).toContain('restricted')
  })

  it('builds neighborhood investigations without fake businesses', () => {
    const n = investigate(wh, 'neighborhood', 'magnolia-park')
    expect(n?.title).toBe('Magnolia Park')
    expect(n?.summary.some((s) => s.includes('none until a public feed'))).toBe(true)
    expect(n?.caveats.join(' ').toLowerCase()).not.toContain('demonstration')
    expect(investigate(wh, 'vendor', 'v-apex')).toBeNull()
  })
})
