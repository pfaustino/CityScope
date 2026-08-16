import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Load `.env` without printing values. Existing process.env wins. */
export function loadEnv(): void {
  const file = path.join(ROOT, '.env')
  if (!existsSync(file)) return
  const text = readFileSync(file, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

export function keyPresent(name: string): boolean {
  const value = process.env[name]
  return Boolean(value && value.trim().length > 0)
}

export function accessStatus() {
  return {
    CENSUS_API_KEY: keyPresent('CENSUS_API_KEY'),
    NOAA_CDO_TOKEN: keyPresent('NOAA_CDO_TOKEN'),
    AIRNOW_API_KEY: keyPresent('AIRNOW_API_KEY'),
    DATA_GOV_API_KEY: keyPresent('DATA_GOV_API_KEY'),
    signup: {
      census: 'https://api.census.gov/data/key_signup.html',
      noaa: 'https://www.ncdc.noaa.gov/cdo-web/token',
      airnow: 'https://docs.airnowapi.org/account/request/',
      fbiCde: 'https://api.data.gov/signup/',
    },
  }
}
