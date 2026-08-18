import { makeProvenance } from './provenance.ts'
import { countBy, groupByMonth, ratePerPopulation, rollingAverage, sortedEntries, sumBy } from './stats.ts'
import type { Provenance, Warehouse } from './types.ts'

export type Anomaly = {
  id: string
  metric: string
  baseline: number
  current: number
  percentChange: number | null
  z: number | null
  strength: 'moderate' | 'strong'
  comparison: string
  possibleExplanations: string[]
  limitations: string[]
  language: string
  provenance: Provenance
}

export type CorrelationFinding = {
  id: string
  title: string
  seriesA: string
  seriesB: string
  r: number | null
  months: number
  interpretation: string
  provenance: Provenance
}

export type Discovery = {
  id: string
  headline: string
  body: string
  investigate: { type: string; id: string }
  anomalyId?: string
}

export type Overview = {
  asOfMonth: string
  crimeThisMonth: number | null
  crimeMom: number | null
  crimeYoy: number | null
  crimeRatePer1000Ytd: number | null
  crimeAvailable: boolean
  newBusinessesThisMonth: number | null
  possibleClosures: number | null
  permitsThisMonth: number | null
  permitValueThisMonth: number | null
  spendingThisMonth: number | null
  collisionsThisMonth: number | null
  weatherToday: string
  quakesNearby: number
  aqiSummary: string | null
  population: number
  stats: Provenance[]
}

const CURRENT_MONTH = '2026-07'
const PERIOD = { start: '2024-01-01', end: '2026-07-31' }

export function analyzeWarehouse(wh: Warehouse) {
  const crimeAvailable = wh.crime.length > 0
  const crimeByMonth = groupByMonth(wh.crime, (c) => c.date)
  const latestCensus = wh.census.find((c) => c.year === '2023') ?? wh.census[wh.census.length - 1]
  const population = latestCensus?.population ?? wh.populationForRates
  const topAqi = [...wh.airQuality].sort((a, b) => b.aqi - a.aqi)[0]

  const overview: Overview = {
    asOfMonth: CURRENT_MONTH,
    crimeAvailable,
    crimeThisMonth: crimeAvailable ? (crimeByMonth[CURRENT_MONTH] ?? 0) : null,
    crimeMom: null,
    crimeYoy: null,
    crimeRatePer1000Ytd: crimeAvailable
      ? ratePerPopulation(
          Object.entries(crimeByMonth)
            .filter(([m]) => m.startsWith('2026'))
            .reduce((s, [, n]) => s + n, 0),
          population,
          1000,
        )
      : null,
    newBusinessesThisMonth: wh.businesses.length > 0 ? 0 : null,
    possibleClosures: wh.businesses.length > 0 ? wh.businesses.filter((b) => b.status === 'possible_closure').length : null,
    permitsThisMonth: wh.permits.length > 0 ? 0 : null,
    permitValueThisMonth: wh.permits.length > 0 ? 0 : null,
    spendingThisMonth: wh.expenditures.length > 0 ? 0 : null,
    collisionsThisMonth: wh.collisions.length > 0 ? 0 : null,
    weatherToday: wh.weather[0] ? `${wh.weather[0].shortForecast}, ${wh.weather[0].temperatureF}°F` : 'Unavailable',
    quakesNearby: wh.earthquakes.length,
    aqiSummary: topAqi ? `${topAqi.parameter} AQI ${topAqi.aqi} (${topAqi.category})` : null,
    population,
    stats: [],
  }

  overview.stats = [
    prov(wh, {
      label: 'ACS 2023 5-year population (rate denominator)',
      value: population,
      sourceId: 'census-acs',
      dataset: latestCensus?.provenance.dataset ?? 'ACS 5-year 2019–2023',
      transformation: 'Published or live ACS estimate used as rate denominator',
      claimType: 'fact',
      dataClass: latestCensus?.provenance.dataClass ?? 'snapshot',
      limitations: latestCensus?.provenance.limitations ?? [],
    }),
  ]

  return {
    overview,
    anomalies: [] as Anomaly[],
    correlations: [] as CorrelationFinding[],
    discoveries: [] as Discovery[],
    crimeByMonth,
    bizOpenedByMonth: groupByMonth(wh.businesses, (b) => b.openedOn),
    permitsByMonth: groupByMonth(wh.permits, (p) => p.submittedOn),
    collisionsByMonth: groupByMonth(wh.collisions, (c) => c.date),
    spendByMonth: sumBy(wh.expenditures, (e) => e.date.slice(0, 7), (e) => e.amount),
    crimeByNeighborhood: countBy(wh.crime, (c) => c.geo.neighborhood ?? 'Unknown'),
    crimeByCategory: countBy(wh.crime, (c) => c.category),
    crimeByHour: countBy(wh.crime, (c) => String(c.hour)),
    crimeByWeekday: countBy(wh.crime, (c) => String(c.weekday)),
    bizByCategory: countBy(wh.businesses, (b) => b.category),
    bizByNeighborhood: countBy(wh.businesses, (b) => b.geo.neighborhood ?? 'Unknown'),
    closuresByNeighborhood: countBy(
      wh.businesses.filter((b) => b.status === 'possible_closure' || b.status === 'closed'),
      (b) => b.geo.neighborhood ?? 'Unknown',
    ),
    permitValueByNeighborhood: sumBy(wh.permits, (p) => p.geo.neighborhood ?? 'Unknown', (p) => p.estimatedValue),
    spendByVendor: sumBy(wh.expenditures, (e) => e.vendor, (e) => e.amount),
    spendByDepartment: sumBy(wh.expenditures, (e) => e.department, (e) => e.amount),
    spendByVendorYear: {} as Record<string, { y2025: number; y2026: number }>,
    collisionsByIntersection: countBy(wh.collisions, (c) => c.intersection),
    rollingCrime3: crimeAvailable
      ? rollingAverage(Object.keys(crimeByMonth).sort().map((m) => crimeByMonth[m] ?? 0), 3)
      : null,
    dataHealth: dataHealth(wh),
  }
}

export type Analysis = ReturnType<typeof analyzeWarehouse>

export function dataHealth(wh: Warehouse) {
  return {
    warehouseGeneratedAt: wh.generatedAt,
    liveOrSnapshot: [
      'census-acs',
      'usgs-earthquakes',
      'nws-forecast',
      'noaa-cdo',
      'aqi',
      'ca-doj-openjustice',
      ...(wh.hateCrimeEvents.length > 0 ? ['ca-doj-openjustice-hate-crime'] : []),
      ...(wh.fbiAnnual.length > 0 ? ['fbi-cde'] : []),
      ...(wh.collisions.length > 0 || wh.collisionsGlendale.length > 0 ? ['switrs'] : []),
      ...(wh.budgetAnnual ? ['burbank-opengov'] : []),
      ...(wh.campaigns ? ['burbank-efile-campaign'] : []),
    ],
    demonstration: [] as string[],
    restricted: ['burbank-pd', 'flock-alpr', 'bpd-uof'],
    unavailable: [
      'burbank-business',
      ...(wh.permitListing ? [] : ['burbank-permits']),
      ...(wh.budgetAnnual ? [] : ['burbank-opengov']),
      ...(wh.campaigns ? [] : ['burbank-efile-campaign']),
      'bur-airport',
      ...(wh.collisions.length > 0 || wh.collisionsGlendale.length > 0 ? [] : ['switrs']),
      ...(wh.fbiAnnual.length > 0 ? [] : ['fbi-cde']),
    ],
    population: wh.populationForRates,
    recordCounts: {
      crime: wh.crime.length,
      businesses: wh.businesses.length,
      permits: wh.permitListing?.count ?? wh.permits.length,
      expenditures: wh.expenditures.length,
      budgetDepartments: wh.budgetAnnual ? wh.budgetAnnual.departments.filter((d) => !d.isTotal).length : 0,
      campaignCommittees: wh.campaigns?.committees.length ?? 0,
      collisions: wh.collisions.length,
      collisionsGlendale: wh.collisionsGlendale.length,
      payments: wh.payments?.count ?? 0,
      hateCrimeEvents: wh.hateCrimeEvents.length,
      fbiAnnual: wh.fbiAnnual.length,
      earthquakes: wh.earthquakes.length,
      airQuality: wh.airQuality.length,
      climate: wh.climate.length,
    },
  }
}

function prov(
  wh: Warehouse,
  input: Omit<Parameters<typeof makeProvenance>[0], 'timePeriod' | 'retrievedAt'> & {
    timePeriod?: { start: string; end: string }
  },
): Provenance {
  return makeProvenance({
    ...input,
    timePeriod: input.timePeriod ?? PERIOD,
    retrievedAt: wh.generatedAt,
    geographicFilter: input.geographicFilter ?? 'City of Burbank, California',
    limitations: input.limitations ?? ['See source catalog for access class and coverage.'],
  })
}

export function topN(record: Record<string, number>, n = 8): [string, number][] {
  return sortedEntries(record).slice(0, n)
}
