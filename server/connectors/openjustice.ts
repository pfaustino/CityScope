import type { AgencyCrimeYear, DataClass } from '../../shared/types.ts'

export const OPENJUSTICE_CRIMES_URL =
  'https://data-openjustice.doj.ca.gov/sites/default/files/dataset/2025-07/Crimes_and_Clearances_with_Arson-1985-2024.csv'

const LIMITATIONS = [
  'Annual reported offenses for Burbank PD, not geocoded incidents.',
  '2021–2023 statewide files mix UCR summary and CIBRS/IBR.',
  'Correlation is not causation.',
]

export async function fetchOpenJustice(): Promise<AgencyCrimeYear[]> {
  const res = await fetch(OPENJUSTICE_CRIMES_URL, {
    headers: {
      Accept: 'text/csv',
      'User-Agent': 'CityScope/0.1 (Burbank public-data research)',
    },
    signal: AbortSignal.timeout(60_000),
  })
  if (!res.ok) throw new Error(`OpenJustice HTTP ${res.status}`)
  const text = await res.text()
  return parseOpenJusticeCsv(text, new Date().toISOString(), 'live')
}

export function parseOpenJusticeCsv(text: string, retrievedAt: string, dataClass: DataClass): AgencyCrimeYear[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  const headerLine = lines[0]
  if (!headerLine) throw new Error('OpenJustice: empty file')
  const header = headerLine.split(',').map((h) => h.trim())
  const idx = (name: string) => header.indexOf(name)
  const yearI = idx('Year')
  const countyI = idx('County')
  const agencyI = idx('NCICCode')
  const col = {
    violent: idx('Violent_sum'),
    homicide: idx('Homicide_sum'),
    rape: idx('ForRape_sum'),
    robbery: idx('Robbery_sum'),
    aggravatedAssault: idx('AggAssault_sum'),
    property: idx('Property_sum'),
    burglary: idx('Burglary_sum'),
    vehicleTheft: idx('VehicleTheft_sum'),
    larceny: idx('LTtotal_sum'),
  }
  if (yearI < 0 || countyI < 0 || agencyI < 0 || col.violent < 0 || col.property < 0) {
    throw new Error('OpenJustice: unexpected header')
  }
  const out: AgencyCrimeYear[] = []
  for (const line of lines.slice(1)) {
    const parts = line.split(',')
    const agency = (parts[agencyI] ?? '').trim()
    const county = (parts[countyI] ?? '').trim()
    if (agency.toLowerCase() !== 'burbank') continue
    if (!/los angeles/i.test(county)) continue
    const year = Number(parts[yearI])
    const violent = Number(parts[col.violent])
    const property = Number(parts[col.property])
    if (!Number.isFinite(year) || !Number.isFinite(violent) || !Number.isFinite(property)) continue
    const numAt = (i: number) => {
      const n = Number(parts[i])
      return Number.isFinite(n) ? n : 0
    }
    out.push({
      year,
      county,
      agency,
      violent,
      homicide: numAt(col.homicide),
      rape: numAt(col.rape),
      robbery: numAt(col.robbery),
      aggravatedAssault: numAt(col.aggravatedAssault),
      property,
      burglary: numAt(col.burglary),
      vehicleTheft: numAt(col.vehicleTheft),
      larceny: numAt(col.larceny),
      dataClass,
      provenance: {
        statisticId: `openjustice-${year}-violent`,
        label: `${year} reported violent offenses (Burbank PD)`,
        value: violent,
        sourceId: 'ca-doj-openjustice',
        sourceName: 'CA DOJ OpenJustice crimes and clearances',
        dataset: 'Crimes and Clearances with Arson 1985–2024',
        retrievedAt,
        query: { agency: 'Burbank', county, year: String(year), url: OPENJUSTICE_CRIMES_URL },
        geographicFilter: 'Burbank PD / Los Angeles County (OpenJustice agency row)',
        timePeriod: { start: `${year}-01-01`, end: `${year}-12-31` },
        transformation: 'Filter statewide CSV to agency Burbank in Los Angeles County',
        claimType: 'fact',
        dataClass,
        limitations: LIMITATIONS,
      },
    })
  }
  if (out.length === 0) throw new Error('OpenJustice: no Burbank PD rows')
  return out.sort((a, b) => a.year - b.year)
}
