import { describe, expect, it } from 'vitest'
import { analyzeWarehouse } from '../shared/analysis.ts'
import { joinGeo, nearestNeighborhood, normalizeAddress } from '../shared/geo.ts'
import { applyOverlay } from '../shared/overlay.ts'
import { mergePublicFeeds } from '../shared/publicFeeds.ts'
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
    expect(wh.hateCrimeEvents).toHaveLength(0)
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
      crimeAnnualGlendale: null,
      fbiAnnualGlendale: null,
      censusGlendale: null,
      collisions: null,
      collisionsFile: null,
      collisionsGlendale: null,
      collisionsGlendaleFile: null,
      hateCrimeEvents: null,
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
      crimeAnnualGlendale: null,
      fbiAnnualGlendale: null,
      censusGlendale: null,
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
          city: 'BURBANK',
          year: 2023,
          dayOfWeek: 4,
          severityCode: '3',
          killed: 0,
          injured: 1,
          primaryRd: 'ALAMEDA AVENUE',
          secondaryRd: 'GATEWAY',
          alcoholInvolved: false,
          pedestrian: false,
          bicycle: false,
          motorcycle: false,
          truck: false,
          hitAndRun: 'N',
          lighting: 'A',
          weather: 'B',
          collisionType: 'E',
          atIntersection: 'N',
          towAway: 'N',
          pcfViolCategory: '01',
        },
      ],
      collisionsFile: 'Crashes.csv',
      collisionsGlendale: null,
      collisionsGlendaleFile: null,
      hateCrimeEvents: null,
      errors: [],
    })
    expect(merged.collisions).toHaveLength(1)
    expect(merged.collisions[0]?.dataClass).toBe('snapshot')
    expect(merged.collisionsFile).toBe('Crashes.csv')
    expect(merged.collisionsGlendale).toHaveLength(0)
    expect(merged.collisions[0]?.city).toBe('BURBANK')
  })

  it('overlays OpenJustice hate-crime events for NCIC 1912', () => {
    const merged = applyOverlay(wh, {
      retrievedAt: '2026-08-16T12:00:00Z',
      census: null,
      weather: null,
      earthquakes: null,
      climate: null,
      airQuality: null,
      crimeAnnual: null,
      fbiAnnual: null,
      crimeAnnualGlendale: null,
      fbiAnnualGlendale: null,
      censusGlendale: null,
      collisions: null,
      collisionsFile: null,
      collisionsGlendale: null,
      collisionsGlendaleFile: null,
      hateCrimeEvents: [
        {
          id: 'CA24-1',
          year: 2024,
          month: 1,
          ncic: '1912',
          county: '19',
          mostSeriousBias: 'Anti-Black or African American',
          mostSeriousBiasType: 'Race/Ethnicity/Ancestry',
          mostSeriousUcr: 'Intimidation',
          mostSeriousLocation: 'Residence/Home/Driveway',
          weaponType: '',
          offensiveAct: 'Verbal slurs',
          victims: 1,
          suspects: 0,
          dataClass: 'snapshot',
        },
      ],
      errors: [],
    })
    expect(merged.hateCrimeEvents).toHaveLength(1)
    expect(merged.hateCrimeEvents[0]?.ncic).toBe('1912')
    expect(merged.hateCrimeEvents[0]?.dataClass).toBe('snapshot')
    expect(merged.crime).toHaveLength(0)
  })

  it('overlays an OpenGov Annual Departments snapshot', () => {
    const merged = applyOverlay(wh, {
      retrievedAt: '2026-08-17T12:00:00Z',
      census: null,
      weather: null,
      earthquakes: null,
      climate: null,
      airQuality: null,
      crimeAnnual: null,
      fbiAnnual: null,
      crimeAnnualGlendale: null,
      fbiAnnualGlendale: null,
      censusGlendale: null,
      collisions: null,
      collisionsFile: null,
      collisionsGlendale: null,
      collisionsGlendaleFile: null,
      hateCrimeEvents: null,
      budgetAnnual: {
        city: 'Burbank',
        report: 'Annual - Departments',
        generatedOn: '2026-08-17',
        fileName: 'Burbank Data Snapshot.csv',
        periods: [
          {
            label: '2026-27 Budget',
            fiscalYear: '2026-27',
            kind: 'budget',
            asOfMonth: null,
            audited: false,
          },
        ],
        departments: [
          { department: 'Police', amounts: { '2026-27 Budget': 79592692 }, isTotal: false },
          { department: 'Total', amounts: { '2026-27 Budget': 1011663440 }, isTotal: true },
        ],
        dataClass: 'snapshot',
      },
      errors: [],
    })
    expect(merged.budgetAnnual?.departments).toHaveLength(2)
    expect(merged.budgetAnnual?.dataClass).toBe('snapshot')
    expect(merged.expenditures).toHaveLength(0)
  })

  it('merges transcribed Form 460 campaign totals without inventing committees', () => {
    expect(wh.campaigns).toBeNull()
    const merged = applyOverlay(wh, {
      retrievedAt: '2026-08-18T12:00:00Z',
      census: null,
      weather: null,
      earthquakes: null,
      climate: null,
      airQuality: null,
      crimeAnnual: null,
      fbiAnnual: null,
      crimeAnnualGlendale: null,
      fbiAnnualGlendale: null,
      censusGlendale: null,
      collisions: null,
      collisionsFile: null,
      collisionsGlendale: null,
      collisionsGlendaleFile: null,
      hateCrimeEvents: null,
      campaigns: {
        sourceUrl: 'https://efile.burbankca.gov/public/search/campaign',
        retrievedAt: '2026-08-18T09:30:00-07:00',
        election: 'Burbank City Council 2024',
        electionDate: '2024-11-05',
        dataClass: 'snapshot',
        committees: [
          {
            candidateName: 'Christopher Rizzotti',
            office: 'City of Burbank Council Member',
            committeeName: 'Elect Rizzotti to Burbank City Council 2024',
            stateId: '1466605',
            electionYear: 2024,
            electionDate: '2024-11-05',
            yearEnd460: {
              calendarYear: 2024,
              coversFrom: '2024-10-31',
              coversThrough: '2024-12-31',
              filedOn: '2025-01-26',
              filingId: '212948293',
              pdfUrl: 'https://efile.burbankca.gov/pdfview?doc_public=Ext_0dfe976d-fbf4-a946-f265-07133b2fb208',
              monetaryContributions: 81575,
              loansReceived: 0,
              nonmonetaryContributions: 854,
              totalContributionsReceived: 82429,
              totalExpendituresMade: 82429,
              endingCashBalance: 0,
              terminated: true,
            },
            officeholder470: [],
            scheduleA: { itemized: [], itemizedTotal: 0, unitemized: 81575 },
          },
        ],
      },
      errors: [],
    })
    expect(merged.campaigns?.committees).toHaveLength(1)
    expect(merged.campaigns?.committees[0]?.yearEnd460.totalContributionsReceived).toBe(82429)
    expect(merged.campaigns?.dataClass).toBe('snapshot')
  })

  it('replaces baked quakes with a live empty catalog and stamps snapshot on fetch failure', () => {
    const liveEmpty = mergePublicFeeds(
      wh,
      {
        items: [{ name: 'Today', startTime: '2026-08-17T08:00:00-07:00', temperatureF: 93, shortForecast: 'Sunny', wind: '5 mph S' }],
        dataClass: 'live',
        retrievedAt: '2026-08-17T15:00:00Z',
        sourceUrl: 'https://forecast.weather.gov/MapClick.php?lat=34.1808&lon=-118.3090&FcstType=dwml',
        format: 'xml',
        error: null,
        note: null,
        loading: false,
      },
      {
        items: [],
        dataClass: 'live',
        retrievedAt: '2026-08-17T15:00:00Z',
        sourceUrl: 'https://earthquake.usgs.gov/fdsnws/event/1/query',
        format: 'xml',
        error: null,
        note: null,
        loading: false,
      },
    )
    expect(liveEmpty.weather[0]?.temperatureF).toBe(93)
    expect(liveEmpty.earthquakes).toHaveLength(0)

    const failed = mergePublicFeeds(
      wh,
      {
        items: null,
        dataClass: 'snapshot',
        retrievedAt: null,
        sourceUrl: 'https://forecast.weather.gov/MapClick.php?lat=34.1808&lon=-118.3090&FcstType=dwml',
        format: null,
        error: 'DWML HTTP 500',
        note: null,
        loading: false,
      },
      {
        items: null,
        dataClass: 'snapshot',
        retrievedAt: null,
        sourceUrl: 'https://earthquake.usgs.gov/fdsnws/event/1/query',
        format: null,
        error: 'QuakeML HTTP 500',
        note: null,
        loading: false,
      },
    )
    expect(failed.weather[0]?.shortForecast).toBe(wh.weather[0]?.shortForecast)
    expect(failed.earthquakes.length).toBe(wh.earthquakes.length)
    expect(failed.earthquakes.every((e) => e.dataClass === 'snapshot')).toBe(true)
  })
})
