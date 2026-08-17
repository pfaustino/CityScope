import { describe, expect, it } from 'vitest'
import { liveSourceView, sourceById, SOURCES, statusFor } from '../shared/catalog.ts'

const keysOn = {
  CENSUS_API_KEY: true,
  NOAA_CDO_TOKEN: true,
  AIRNOW_API_KEY: true,
  DATA_GOV_API_KEY: true,
}

const keysOff = {
  CENSUS_API_KEY: false,
  NOAA_CDO_TOKEN: false,
  AIRNOW_API_KEY: false,
  DATA_GOV_API_KEY: false,
}

describe('liveSourceView', () => {
  it('does not treat a set Census key as missing when ACS rejects it', () => {
    const source = sourceById('census-acs')
    expect(source).toBeDefined()
    if (!source) return
    const row = liveSourceView(source, keysOn, {
      retrievedAt: '2026-08-15T12:00:00Z',
      census: null,
      climate: [],
      airQuality: [],
      errors: [
        {
          sourceId: 'census-acs',
          message: 'Census API rejected the key (Invalid Key). Activate it from the Census email.',
        },
      ],
    })
    expect(row.status).toBe('key_invalid')
    expect(row.status).not.toBe('needs_api_key')
    expect(row.statusDetail).toMatch(/Invalid Key/i)
  })

  it('treats baked overlay rows as connected snapshots when keys are absent', () => {
    const census = sourceById('census-acs')
    const openJustice = sourceById('ca-doj-openjustice')
    expect(census && openJustice).toBeTruthy()
    if (!census || !openJustice) return
    const overlay = {
      retrievedAt: '2026-08-16T00:00:00Z',
      census: [{ year: '2023' }],
      climate: [],
      airQuality: [],
      crimeAnnual: [{ year: 2024, violent: 396 }],
      errors: [],
    }
    expect(liveSourceView(census, keysOff, overlay).status).toBe('connected')
    expect(liveSourceView(census, keysOff, overlay).statusDetail).toMatch(/snapshot/i)
    expect(liveSourceView(openJustice, keysOff, overlay).status).toBe('connected')
  })

  it('marks keyed sources needs_api_key only when the env key is absent', () => {
    const census = sourceById('census-acs')
    const noaa = sourceById('noaa-cdo')
    const aqi = sourceById('aqi')
    const fbi = sourceById('fbi-cde')
    expect(census && noaa && aqi && fbi).toBeTruthy()
    if (!census || !noaa || !aqi || !fbi) return
    expect(liveSourceView(census, keysOff, null).status).toBe('needs_api_key')
    expect(liveSourceView(noaa, keysOff, null).status).toBe('needs_api_key')
    expect(liveSourceView(aqi, keysOff, null).status).toBe('needs_api_key')
    expect(liveSourceView(fbi, keysOff, null).status).toBe('needs_api_key')
  })

  it('marks keyed sources connected when the key is set and overlay has data', () => {
    const census = sourceById('census-acs')
    const noaa = sourceById('noaa-cdo')
    const aqi = sourceById('aqi')
    expect(census && noaa && aqi).toBeTruthy()
    if (!census || !noaa || !aqi) return
    const overlay = {
      retrievedAt: '2026-08-15T12:00:00Z',
      census: [{ year: '2023' }],
      climate: [{ date: '2026-08-01' }],
      airQuality: [{ aqi: 40 }],
      errors: [],
    }
    expect(liveSourceView(census, keysOn, overlay).status).toBe('connected')
    expect(liveSourceView(noaa, keysOn, overlay).status).toBe('connected')
    expect(liveSourceView(aqi, keysOn, overlay).status).toBe('connected')
    const fbi = sourceById('fbi-cde')
    expect(fbi).toBeDefined()
    if (!fbi) return
    expect(liveSourceView(fbi, keysOn, overlay).status).toBe('connected')
    expect(liveSourceView(fbi, keysOn, overlay).statusDetail).toMatch(/API key present/i)
  })

  it('marks FBI CDE connected when overlay has annual rows', () => {
    const fbi = sourceById('fbi-cde')
    expect(fbi).toBeDefined()
    if (!fbi) return
    const row = liveSourceView(fbi, keysOn, {
      retrievedAt: '2026-08-15T12:00:00Z',
      census: null,
      climate: [],
      airQuality: [],
      fbiAnnual: [{ year: 2024, violent: 1 }],
      errors: [],
    })
    expect(row.status).toBe('connected')
    expect(row.lastSuccessfulRetrieval).toBe('2026-08-15T12:00:00Z')
  })

  it('marks SWITRS connected when overlay has collision rows', () => {
    const switrs = sourceById('switrs')
    expect(switrs).toBeDefined()
    if (!switrs) return
    const row = liveSourceView(switrs, keysOn, {
      retrievedAt: '2026-08-15T12:00:00Z',
      census: null,
      climate: [],
      airQuality: [],
      collisions: [{ id: '1' }],
      errors: [],
    })
    expect(row.status).toBe('connected')
    expect(row.statusDetail).toMatch(/Crashes\.csv/i)
    expect(row.statusDetail).toMatch(/Burbank/i)
  })

  it('marks OpenJustice hate crime connected when overlay has NCIC 1912 events', () => {
    const hate = sourceById('ca-doj-openjustice-hate-crime')
    expect(hate).toBeDefined()
    if (!hate) return
    const row = liveSourceView(hate, keysOn, {
      retrievedAt: '2026-08-16T12:00:00Z',
      census: null,
      climate: [],
      airQuality: [],
      hateCrimeEvents: [{ id: 'CA24-1', year: 2024, ncic: '1912' }],
      errors: [],
    })
    expect(row.status).toBe('connected')
    expect(row.statusDetail).toMatch(/NCIC 1912/)
  })
})

describe('unconnected source obtain URLs', () => {
  it('includes an https register/request URL for every source that is not connected', () => {
    for (const source of SOURCES) {
      if (statusFor(source) === 'connected') continue
      expect(source.url, source.id).toMatch(/^https:\/\//)
      expect(source.howToObtain, source.id).toMatch(/https:\/\//)
    }
  })
})
