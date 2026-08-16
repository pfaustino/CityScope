import { afterEach, describe, expect, it } from 'vitest'
import { keyPresent } from '../server/env.ts'

describe('env key presence', () => {
  const previous = process.env.CENSUS_API_KEY

  afterEach(() => {
    if (previous === undefined) delete process.env.CENSUS_API_KEY
    else process.env.CENSUS_API_KEY = previous
  })

  it('treats empty and missing keys as absent', () => {
    delete process.env.CENSUS_API_KEY
    expect(keyPresent('CENSUS_API_KEY')).toBe(false)
    process.env.CENSUS_API_KEY = '   '
    expect(keyPresent('CENSUS_API_KEY')).toBe(false)
    process.env.CENSUS_API_KEY = 'not-a-real-key'
    expect(keyPresent('CENSUS_API_KEY')).toBe(true)
  })
})
