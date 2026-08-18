import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { bakeStaticOverlay } from '../scripts/bake-static.ts'

const SECRET = /(?:api[_-]?key|token|CENSUS_API_KEY|NOAA_CDO_TOKEN|AIRNOW_API_KEY|DATA_GOV_API_KEY)\s*[=:]\s*[^\s"]+/i

describe('static Pages bake', () => {
  it('writes overlay JSON without API keys and with SWITRS collisions', () => {
    const overlay = bakeStaticOverlay()
    expect(overlay.collisions?.length ?? 0).toBeGreaterThan(0)
    expect(overlay.collisions?.every((c) => c.city === 'BURBANK')).toBe(true)
    expect((overlay.collisionsGlendale ?? []).every((c) => c.city === 'GLENDALE')).toBe(true)
    expect(overlay.crimeAnnual?.length ?? 0).toBeGreaterThan(0)
    expect(overlay.hateCrimeEvents?.length ?? 0).toBeGreaterThan(0)
    expect(overlay.hateCrimeEvents?.every((e) => e.ncic === '1912')).toBe(true)
    expect(overlay.hateCrimeEvents?.some((e) => e.month >= 1 && e.month <= 12)).toBe(true)
    expect(overlay.hateCrimeEvents?.some((e) => e.mostSeriousLocation.length > 0)).toBe(true)
    expect(overlay.hateCrimeEvents?.some((e) => e.weaponType.length > 0)).toBe(true)
    expect(overlay.hateCrimeEvents?.some((e) => e.offensiveAct.length > 0)).toBe(true)
    expect(overlay.budgetAnnual?.departments.some((d) => d.department === 'Police')).toBe(true)
    expect(overlay.budgetAnnual?.dataClass).toBe('snapshot')
    expect(overlay.payments?.count).toBe(17034)
    expect(overlay.payments?.dataClass).toBe('snapshot')
    expect(overlay.permitListing?.count).toBe(11192)
    expect(overlay.permitListing?.dataClass).toBe('snapshot')
    expect(overlay.permitListing?.rows.length).toBeLessThanOrEqual(200)
    expect(overlay.campaigns?.committees).toHaveLength(5)
    expect(overlay.campaigns?.dataClass).toBe('snapshot')
    expect(
      overlay.campaigns?.committees.some(
        (c) => c.stateId === '1466605' && c.yearEnd460.totalContributionsReceived === 82429,
      ),
    ).toBe(true)
    expect(
      overlay.campaigns?.committees.some(
        (c) => c.stateId === '1470392' && c.yearEnd460.totalContributionsReceived === 25583.48,
      ),
    ).toBe(true)
    expect(
      overlay.campaigns?.committees.some(
        (c) => c.stateId === '1450408' && c.yearEnd460.totalContributionsReceived === 80772.35,
      ),
    ).toBe(true)
    expect(
      overlay.campaigns?.committees.some(
        (c) => c.stateId === '1448423' && c.yearEnd460.totalContributionsReceived === 44975.58,
      ),
    ).toBe(true)
    expect(
      overlay.campaigns?.committees.some(
        (c) => c.stateId === '1448296' && c.yearEnd460.totalContributionsReceived === 17902,
      ),
    ).toBe(true)
    expect(
      overlay.campaigns?.committees.some(
        (c) => c.stateId === '1466605' && c.scheduleA.itemized.some((row) => row.name === 'Rennie Gabriel'),
      ),
    ).toBe(true)
    const text = readFileSync(path.join(process.cwd(), 'public', 'overlay.json'), 'utf8')
    expect(text).not.toMatch(SECRET)
    expect(JSON.stringify(overlay)).not.toMatch(SECRET)
  })
})
