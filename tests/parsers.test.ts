import { describe, expect, it } from 'vitest'
import { parseAcsTable } from '../server/connectors/census.ts'
import { parseAirNow } from '../server/connectors/airnow.ts'
import { parseNoaa } from '../server/connectors/noaa.ts'
import { parseFbiCdeActualsByYear } from '../server/connectors/fbiCde.ts'
import { parseOpenJusticeCsv } from '../server/connectors/openjustice.ts'
import { parseForecast, parseQuakes } from '../shared/liveParse.ts'
import { parseSwitrsCsv } from '../shared/switrs.ts'

describe('live parsers', () => {
  it('parses a Census ACS table into a live snapshot', () => {
    const snap = parseAcsTable(
      [
        ['NAME', 'B01003_001E', 'B19013_001E', 'B17001_002E', 'B17001_001E'],
        ['Burbank city, California', '105165', '95816', '7467', '105165'],
      ],
      '2026-08-15T00:00:00Z',
    )
    expect(snap.population).toBe(105165)
    expect(snap.provenance.dataClass).toBe('live')
    expect(snap.povertyRate).toBeCloseTo(7467 / 105165, 5)
  })

  it('parses AirNow observations', () => {
    const rows = parseAirNow([
      {
        DateObserved: '2026-08-15',
        HourObserved: 8,
        ReportingArea: 'Burbank',
        ParameterName: 'PM2.5',
        AQI: 41,
        Category: { Name: 'Good' },
      },
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0]?.aqi).toBe(41)
    expect(rows[0]?.dataClass).toBe('live')
  })

  it('pivots NOAA GHCND rows by date', () => {
    const days = parseNoaa(
      {
        results: [
          { date: '2026-08-14T00:00:00', datatype: 'TMAX', value: 91 },
          { date: '2026-08-14T00:00:00', datatype: 'TMIN', value: 65 },
          { date: '2026-08-14T00:00:00', datatype: 'PRCP', value: 0 },
        ],
      },
      'GHCND:USW00023152',
    )
    expect(days).toHaveLength(1)
    expect(days[0]?.tmaxF).toBe(91)
    expect(days[0]?.tminF).toBe(65)
  })

  it('filters OpenJustice CSV to Burbank PD annual totals', () => {
    const rows = parseOpenJusticeCsv(
      [
        'Year,County,NCICCode,Violent_sum,Homicide_sum,ForRape_sum,Robbery_sum,AggAssault_sum,Property_sum,Burglary_sum,VehicleTheft_sum,LTtotal_sum',
        '2024,Los Angeles County,Burbank,396,2,12,96,286,3114,347,297,2470',
        '2024,Orange County,Anaheim,1,0,0,0,1,2,0,0,2',
      ].join('\n'),
      '2026-08-15T00:00:00Z',
      'live',
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]?.violent).toBe(396)
    expect(rows[0]?.property).toBe(3114)
    expect(rows[0]?.dataClass).toBe('live')
  })

  it('parses SWITRS Crashes.csv rows as snapshot collisions', () => {
    const rows = parseSwitrsCsv(
      [
        'CASE_ID,COLLISION_DATE,COLLISION_TIME,COLLISION_SEVERITY,NUMBER_KILLED,NUMBER_INJURED,PRIMARY_RD,SECONDARY_RD,LATITUDE,LONGITUDE,POINT_X,POINT_Y,CITY',
        '82189740,2023-01-05,2010,3,0,1,ALAMEDA AVENUE,GATEWAY,34.1735,-118.3007,-118.3008,34.1734,BURBANK',
        '82189767,2023-01-03,1313,4,0,1,GLENOAKS BOULEVARD,MAGNOLIA BOULEVARD,,, -118.3086,34.1850,BURBANK',
        '999,2023-01-01,800,4,0,1,MAIN,FIRST,34.1,-118.2,-118.2,34.1,GLENDALE',
      ].join('\n'),
      'Crashes.csv',
    )
    expect(rows).toHaveLength(2)
    expect(rows[0]?.id).toBe('82189740')
    expect(rows[0]?.severity).toBe('injury')
    expect(rows[0]?.hour).toBe(20)
    expect(rows[0]?.dataClass).toBe('snapshot')
    expect(rows[0]?.geo.lat).toBeCloseTo(34.1735)
    expect(rows[1]?.geo.lat).toBeCloseTo(34.185)
    expect(rows.every((r) => r.dataClass !== 'demonstration')).toBe(true)
  })

  it('parses NWS daytime forecast periods', () => {
    const rows = parseForecast({
      properties: {
        periods: [
          { name: 'Saturday', startTime: '2026-08-15T06:00:00-07:00', temperature: 87, shortForecast: 'Sunny', windSpeed: '5 mph', windDirection: 'S', isDaytime: true },
          { name: 'Saturday Night', startTime: '2026-08-15T18:00:00-07:00', temperature: 64, shortForecast: 'Clear', windSpeed: '0 mph', windDirection: 'S', isDaytime: false },
        ],
      },
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]?.temperatureF).toBe(87)
  })

  it('parses USGS GeoJSON features', () => {
    const rows = parseQuakes(
      {
        features: [
          {
            id: 'ci1',
            properties: { mag: 2.6, place: 'Burbank', time: Date.parse('2026-08-12T20:36:29.310Z'), url: 'https://example.test' },
            geometry: { coordinates: [-118.3, 34.18, 5] },
          },
        ],
      },
      'snapshot',
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]?.dataClass).toBe('snapshot')
    expect(rows[0]?.lat).toBeCloseTo(34.18)
  })

  it('sums FBI CDE monthly actuals to calendar years', () => {
    const years = parseFbiCdeActualsByYear({
      offenses: {
        actuals: {
          'Burbank Police Department Offenses': { '01-2023': 20, '02-2023': 10, '01-2024': 5 },
          'Burbank Police Department Clearances': { '01-2023': 1 },
        },
      },
    })
    expect(years[2023]).toBe(30)
    expect(years[2024]).toBe(5)
  })
})
