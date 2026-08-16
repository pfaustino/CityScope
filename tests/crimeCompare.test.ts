import { describe, expect, it } from 'vitest'
import { compareAgencyYears, isFbiCdeFullYear } from '../shared/crimeCompare.ts'
import { GLENDALE } from '../shared/peerCities.ts'
import { buildWarehouse } from '../shared/warehouse.ts'

describe('Burbank vs Glendale crime compare', () => {
  const wh = buildWarehouse()

  it('uses the verified Glendale OpenJustice agency and FBI ORI', () => {
    expect(GLENDALE.openJusticeAgency).toBe('Glendale')
    expect(GLENDALE.fbiOri).toBe('CA0192500')
    expect(wh.crimeAnnualGlendale.some((r) => r.year === 2024 && r.violent === 530 && r.property === 3733)).toBe(true)
    expect(wh.censusGlendale.find((c) => c.year === '2023')?.population).toBe(192270)
  })

  it('pairs OpenJustice years and computes rates per 1,000', () => {
    const rows = compareAgencyYears(
      wh.crimeAnnual,
      wh.crimeAnnualGlendale,
      wh.populationForRates,
      wh.populationGlendaleForRates,
    )
    const y2024 = rows.find((r) => r.year === 2024)
    expect(y2024?.burbankViolent).toBe(396)
    expect(y2024?.glendaleViolent).toBe(530)
    expect(y2024?.burbankViolentPer1000?.toFixed(1)).toBe('3.8')
    expect(y2024?.glendaleViolentPer1000?.toFixed(1)).toBe('2.8')
  })

  it('does not treat 2021 CDE or all-zero CDE years as full-year totals', () => {
    const incomplete = {
      ...wh.crimeAnnual[0]!,
      year: 2021,
      violent: 0,
      property: 0,
      monthsReported: 12,
    }
    const partial = { ...wh.crimeAnnual[0]!, year: 2024, monthsReported: 3 }
    const full = { ...wh.crimeAnnual[0]!, year: 2024, monthsReported: 12 }
    expect(isFbiCdeFullYear(incomplete)).toBe(false)
    expect(isFbiCdeFullYear(partial)).toBe(false)
    expect(isFbiCdeFullYear(full)).toBe(true)
  })
})
