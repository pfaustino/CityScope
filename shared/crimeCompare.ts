import { ratePerPopulation } from './stats.ts'
import type { AgencyCrimeYear, CensusSnapshot, Provenance } from './types.ts'

export const ACS_2023_RATE_VINTAGE = 'ACS 2019–2023 5-year'

export type CityCompareRow = {
  year: number
  burbankViolent: number
  glendaleViolent: number
  burbankProperty: number
  glendaleProperty: number
  burbankViolentPer1000: number | null
  glendaleViolentPer1000: number | null
  burbankPropertyPer1000: number | null
  glendalePropertyPer1000: number | null
}

/** 2021 CDE is the NIBRS-transition year; do not treat a partial or all-zero year as a full-year total. */
export function isFbiCdeFullYear(row: AgencyCrimeYear): boolean {
  if (row.year === 2021) return false
  if (row.monthsReported != null && row.monthsReported < 12) return false
  if (row.violent === 0 && row.property === 0) return false
  return true
}

export function acs5Population(census: CensusSnapshot[]): CensusSnapshot | undefined {
  return census.find((c) => c.year === '2023') ?? census[census.length - 1]
}

export function compareAgencyYears(
  burbank: AgencyCrimeYear[],
  glendale: AgencyCrimeYear[],
  burbankPop: number,
  glendalePop: number,
): CityCompareRow[] {
  const glenByYear = new Map(glendale.map((row) => [row.year, row]))
  const years = [...new Set(burbank.map((row) => row.year))]
    .filter((year) => glenByYear.has(year))
    .sort((a, b) => b - a)
  return years.map((year) => {
    const b = burbank.find((row) => row.year === year)
    const g = glenByYear.get(year)
    if (!b || !g) {
      return {
        year,
        burbankViolent: 0,
        glendaleViolent: 0,
        burbankProperty: 0,
        glendaleProperty: 0,
        burbankViolentPer1000: null,
        glendaleViolentPer1000: null,
        burbankPropertyPer1000: null,
        glendalePropertyPer1000: null,
      }
    }
    return {
      year,
      burbankViolent: b.violent,
      glendaleViolent: g.violent,
      burbankProperty: b.property,
      glendaleProperty: g.property,
      burbankViolentPer1000: ratePerPopulation(b.violent, burbankPop),
      glendaleViolentPer1000: ratePerPopulation(g.violent, glendalePop),
      burbankPropertyPer1000: ratePerPopulation(b.property, burbankPop),
      glendalePropertyPer1000: ratePerPopulation(g.property, glendalePop),
    }
  })
}

export function rateProvenance(
  label: string,
  value: number,
  city: string,
  year: number,
  count: number,
  population: number,
  sourceYear: AgencyCrimeYear,
  popVintage: string,
): Provenance {
  return {
    statisticId: `rate-${city.toLowerCase()}-${year}-${label.includes('violent') ? 'violent' : 'property'}-per-1000`,
    label,
    value,
    unit: 'per 1,000 residents',
    sourceId: sourceYear.provenance.sourceId,
    sourceName: sourceYear.provenance.sourceName,
    dataset: sourceYear.provenance.dataset,
    retrievedAt: sourceYear.provenance.retrievedAt,
    query: {
      ...sourceYear.provenance.query,
      populationVintage: popVintage,
      population: String(population),
      offenses: String(count),
    },
    geographicFilter: sourceYear.provenance.geographicFilter,
    timePeriod: sourceYear.provenance.timePeriod,
    transformation: `(${count} reported offenses / ${population} ${popVintage} population) × 1,000`,
    claimType: 'calculation',
    dataClass: sourceYear.dataClass,
    limitations: [
      'Rate uses a published Census/ACS population vintage, not a same-year resident count for every crime year.',
      'Agency totals are not incidents and are not neighborhood rates.',
      'Correlation is not causation. A lower rate is not a finding that one city is safer because of a policy.',
      ...sourceYear.provenance.limitations,
    ],
  }
}

export function formatRate(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return 'n/a'
  return n.toFixed(1)
}
