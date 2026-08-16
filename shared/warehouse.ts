import { ACCESS_GAPS } from './accessGaps.ts'
import { NEIGHBORHOODS } from './geo.ts'
import { CITY, type AgencyCrimeYear, type CensusSnapshot, type Warehouse } from './types.ts'

const SNAP = 'snapshot' as const

export function buildWarehouse(nowIso = '2026-08-15T08:00:00-07:00'): Warehouse {
  return {
    generatedAt: nowIso,
    neighborhoods: NEIGHBORHOODS,
    crime: [],
    crimeAnnual: openJusticeSnapshots(nowIso),
    businesses: [],
    permits: [],
    projects: [],
    expenditures: [],
    collisions: [],
    collisionsFile: null,
    fbiAnnual: [],
    census: censusSnapshots(),
    earthquakes: earthquakeSnapshot(),
    weather: weatherSnapshot(),
    airport: [],
    airQuality: [],
    climate: [],
    accessGaps: ACCESS_GAPS,
    populationForRates: 105165,
  }
}

function censusSnapshots(): CensusSnapshot[] {
  const retrieved = '2026-08-15T08:00:00-07:00'
  return [
    {
      year: '2020',
      vintage: '2020 Decennial Census',
      population: 107337,
      medianAge: null,
      medianHouseholdIncome: null,
      povertyRate: null,
      medianHomeValue: null,
      medianGrossRent: null,
      households: null,
      bachelorOrHigher: null,
      notes: ['April 1, 2020 count. Source: U.S. Census Bureau QuickFacts, Burbank city, California.'],
      provenance: {
        statisticId: 'census-2020-pop',
        label: '2020 Census population',
        value: 107337,
        sourceId: 'census-acs',
        sourceName: 'U.S. Census Bureau ACS / Decennial',
        dataset: 'Decennial Census 2020',
        retrievedAt: retrieved,
        query: { geography: 'Burbank city, CA', table: 'P1' },
        geographicFilter: 'Burbank city, California',
        timePeriod: { start: '2020-04-01', end: '2020-04-01' },
        transformation: 'Published count; no transformation',
        claimType: 'fact',
        dataClass: SNAP,
        limitations: ['Point-in-time census count; not a current estimate.'],
      },
    },
    {
      year: '2023',
      vintage: 'ACS 2019–2023 5-year',
      population: 105165,
      medianAge: 39.8,
      medianHouseholdIncome: 95816,
      povertyRate: 0.071,
      medianHomeValue: 1041100,
      medianGrossRent: 2089,
      households: null,
      bachelorOrHigher: null,
      notes: ['ACS 5-year estimates. Replaced by a live API row when CENSUS_API_KEY ingest succeeds.'],
      provenance: {
        statisticId: 'census-2023-acs5-pop',
        label: 'ACS 2023 5-year population',
        value: 105165,
        sourceId: 'census-acs',
        sourceName: 'U.S. Census Bureau ACS / Decennial',
        dataset: 'ACS 5-year 2019–2023',
        retrievedAt: retrieved,
        query: { geography: 'Burbank city, CA', vintage: 'acs5-2023' },
        geographicFilter: 'Burbank city, California',
        timePeriod: { start: '2019-01-01', end: '2023-12-31' },
        transformation: 'Published estimate; no transformation',
        claimType: 'fact',
        dataClass: SNAP,
        limitations: ['ACS 5-year estimates have margins of error.'],
      },
    },
    {
      year: '2024',
      vintage: 'ACS 2024 1-year (Census Reporter profile)',
      population: 103543,
      medianAge: 40.6,
      medianHouseholdIncome: 85517,
      povertyRate: 0.084,
      medianHomeValue: 1121000,
      medianGrossRent: null,
      households: 43890,
      bachelorOrHigher: 0.489,
      notes: ['ACS 1-year estimates have large margins of error. Prefer 5-year for comparisons.'],
      provenance: {
        statisticId: 'census-2024-acs1-pop',
        label: 'ACS 2024 1-year population',
        value: 103543,
        sourceId: 'census-acs',
        sourceName: 'U.S. Census Bureau ACS / Decennial',
        dataset: 'ACS 1-year 2024 via Census Reporter',
        retrievedAt: retrieved,
        query: { geography: '16000US0608954', vintage: 'acs1-2024' },
        geographicFilter: 'Burbank city, California',
        timePeriod: { start: '2024-01-01', end: '2024-12-31' },
        transformation: 'Published estimate copied from Census Reporter profile',
        claimType: 'fact',
        dataClass: SNAP,
        limitations: ['1-year ACS has wide margins of error.'],
      },
    },
    {
      year: '2025',
      vintage: 'Census Population Estimates (V2025)',
      population: 102988,
      medianAge: null,
      medianHouseholdIncome: 97082,
      povertyRate: 0.107,
      medianHomeValue: null,
      medianGrossRent: null,
      households: null,
      bachelorOrHigher: null,
      notes: ['July 1, 2025 estimate from QuickFacts. Income/poverty on that page are ACS 2020–2024, not 2025.'],
      provenance: {
        statisticId: 'census-2025-pep',
        label: 'July 1, 2025 population estimate',
        value: 102988,
        sourceId: 'census-acs',
        sourceName: 'U.S. Census Bureau ACS / Decennial',
        dataset: 'Vintage 2025 Population Estimates / QuickFacts',
        retrievedAt: retrieved,
        query: { geography: 'Burbank city, CA', series: 'PEPSV2025' },
        geographicFilter: 'Burbank city, California',
        timePeriod: { start: '2025-07-01', end: '2025-07-01' },
        transformation: 'Published estimate; no transformation',
        claimType: 'fact',
        dataClass: SNAP,
        limitations: ['Estimates, not a census count.', 'QuickFacts mixes vintages.'],
      },
    },
  ]
}

function earthquakeSnapshot() {
  return [
    {
      id: 'ci40671466',
      time: '2026-08-12T20:36:29.310Z',
      mag: 2.63,
      place: '9 km SW of Valencia, CA',
      lat: 34.3845,
      lng: -118.628666666667,
      depthKm: 4.22,
      url: 'https://earthquake.usgs.gov/earthquakes/eventpage/ci40671466',
      dataClass: SNAP,
    },
    {
      id: 'ci40665434',
      time: '2026-08-03T03:50:58.910Z',
      mag: 2.52,
      place: '3 km N of Gardena, CA',
      lat: 33.918,
      lng: -118.314,
      depthKm: 11.15,
      url: 'https://earthquake.usgs.gov/earthquakes/eventpage/ci40665434',
      dataClass: SNAP,
    },
    {
      id: 'ci41470432',
      time: '2026-05-19T19:42:29.270Z',
      mag: 2.66,
      place: '4 km W of Manhattan Beach, CA',
      lat: 33.8816666666667,
      lng: -118.450833333333,
      depthKm: 10.64,
      url: 'https://earthquake.usgs.gov/earthquakes/eventpage/ci41470432',
      dataClass: SNAP,
    },
    {
      id: 'ci41393840',
      time: '2026-02-08T07:19:47.850Z',
      mag: 2.8,
      place: '10 km SSW of Valencia, CA',
      lat: 34.3785,
      lng: -118.625833333333,
      depthKm: 10.82,
      url: 'https://earthquake.usgs.gov/earthquakes/eventpage/ci41393840',
      dataClass: SNAP,
    },
  ]
}

function weatherSnapshot() {
  return [
    {
      name: 'Saturday',
      startTime: '2026-08-15T06:00:00-07:00',
      temperatureF: 87,
      shortForecast: 'Mostly Sunny',
      wind: '0 to 10 mph S',
    },
    {
      name: 'Sunday',
      startTime: '2026-08-16T06:00:00-07:00',
      temperatureF: 90,
      shortForecast: 'Mostly Sunny',
      wind: '0 to 5 mph S',
    },
    {
      name: 'Monday',
      startTime: '2026-08-17T06:00:00-07:00',
      temperatureF: 91,
      shortForecast: 'Mostly Sunny',
      wind: '0 to 5 mph S',
    },
  ]
}

function openJusticeSnapshots(retrieved: string): AgencyCrimeYear[] {
  const rows: Omit<AgencyCrimeYear, 'dataClass' | 'provenance'>[] = [
    {
      year: 2022,
      county: 'Los Angeles County',
      agency: 'Burbank',
      violent: 321,
      homicide: 1,
      rape: 21,
      robbery: 83,
      aggravatedAssault: 216,
      property: 2819,
      burglary: 278,
      vehicleTheft: 295,
      larceny: 2246,
    },
    {
      year: 2023,
      county: 'Los Angeles County',
      agency: 'Burbank',
      violent: 377,
      homicide: 0,
      rape: 20,
      robbery: 110,
      aggravatedAssault: 247,
      property: 3264,
      burglary: 347,
      vehicleTheft: 312,
      larceny: 2605,
    },
    {
      year: 2024,
      county: 'Los Angeles County',
      agency: 'Burbank',
      violent: 396,
      homicide: 2,
      rape: 12,
      robbery: 96,
      aggravatedAssault: 286,
      property: 3114,
      burglary: 347,
      vehicleTheft: 297,
      larceny: 2470,
    },
  ]
  return rows.map((row) => ({
    ...row,
    dataClass: SNAP,
    provenance: {
      statisticId: `openjustice-${row.year}-violent`,
      label: `${row.year} reported violent offenses (Burbank PD)`,
      value: row.violent,
      sourceId: 'ca-doj-openjustice',
      sourceName: 'CA DOJ OpenJustice crimes and clearances',
      dataset: 'Crimes and Clearances with Arson 1985–2024',
      retrievedAt: retrieved,
      query: { agency: 'Burbank', county: 'Los Angeles County', year: String(row.year) },
      geographicFilter: 'Burbank PD / Los Angeles County (OpenJustice agency row)',
      timePeriod: { start: `${row.year}-01-01`, end: `${row.year}-12-31` },
      transformation: 'Direct annual UCR-style agency totals; not incident locations',
      claimType: 'fact',
      dataClass: SNAP,
      limitations: [
        'Annual reported offenses, not a live incident map.',
        '2021–2023 statewide files mix UCR summary and CIBRS/IBR.',
        'Correlation is not causation.',
      ],
    },
  }))
}

export function warehouseDisclaimer(wh: Warehouse): string {
  return `Warehouse generated ${wh.generatedAt} for ${CITY.name}, ${CITY.state}. Census, USGS, NWS, NOAA, AirNow, CA DOJ OpenJustice, FBI CDE annual totals, and SWITRS collisions may carry numbers. Incident-level crime and other city-operational series stay empty until a public feed is connected.`
}

let cached: Warehouse | null = null

export function getWarehouse(): Warehouse {
  if (!cached) cached = buildWarehouse()
  return cached
}
