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
    const text = readFileSync(path.join(process.cwd(), 'public', 'overlay.json'), 'utf8')
    expect(text).not.toMatch(SECRET)
    expect(JSON.stringify(overlay)).not.toMatch(SECRET)
  })
})
