import { gapFor } from './accessGaps.ts'
import { analyzeWarehouse, topN, type Analysis } from './analysis.ts'
import { collisionsProvenance } from './switrs.ts'
import type { Provenance, Warehouse } from './types.ts'

export type ReportSection = {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

export type Report = {
  id: string
  category: string
  title: string
  period: string
  dataClassNote: string
  executiveSummary: string[]
  keyNumbers: { label: string; value: string; provenance: Provenance }[]
  whatChanged: string[]
  geographic: string[]
  trends: string[]
  notable: string[]
  crossDataset: string[]
  unknown: string[]
  sources: string[]
  qualityAnswers: Record<string, string>
  sections: ReportSection[]
}

export const REPORT_DEFS = [
  { id: 'crime-monthly', category: 'Crime & Public Safety', title: 'Crime & public safety — monthly', period: '2026-07' },
  { id: 'crime-weekly', category: 'Crime & Public Safety', title: 'Crime & public safety — weekly rollup', period: '2026-07' },
  { id: 'crime-quarterly', category: 'Crime & Public Safety', title: 'Crime & public safety — Q2 2026', period: '2026-Q2' },
  { id: 'crime-annual', category: 'Crime & Public Safety', title: 'Crime & public safety — annual agency totals', period: '2024 (OpenJustice)' },
  { id: 'housing', category: 'Housing & Real Estate', title: 'Housing, permits, and development', period: '2024-01 to 2026-07' },
  { id: 'business', category: 'Business Pulse', title: 'Business pulse', period: '2026-07' },
  { id: 'money', category: 'City Spending & Contracts', title: 'City spending and contracts', period: '2026 YTD vs 2025' },
  { id: 'development', category: 'Development Watch', title: 'Development watch', period: '2024-01 to 2026-07' },
  { id: 'police', category: 'Police Accountability', title: 'Police accountability — access status', period: 'as of 2026-08-15' },
  { id: 'demographics', category: 'Demographic & Economic Change', title: 'Burbank is changing', period: '2020–2025' },
  { id: 'transport', category: 'Transportation', title: 'Transportation and collisions', period: '2023 (Crashes.csv)' },
  { id: 'airport', category: 'Airport', title: 'Hollywood Burbank Airport', period: '2024-01 to 2026-07' },
  { id: 'environment', category: 'Environment & Risk', title: 'Environment and risk — monthly', period: '2026-08' },
] as const

const MISSING_DOMAIN: Record<string, string> = {
  'crime-monthly': 'crime',
  'crime-weekly': 'crime',
  'crime-quarterly': 'crime',
  housing: 'permits',
  business: 'business',
  money: 'spending',
  development: 'permits',
  transport: 'collisions',
  airport: 'airport',
}

/** True when the report is built from warehouse/overlay rows, not an access-gap stub. */
export function reportHasConnectedDataset(id: string, wh?: Warehouse): boolean {
  if (id === 'transport') return (wh?.collisions.length ?? 0) > 0
  return !(id in MISSING_DOMAIN) && id !== 'police'
}

export function buildAllReports(wh: Warehouse): Report[] {
  const analysis = analyzeWarehouse(wh)
  return REPORT_DEFS.map((def) => buildReport(def.id, wh, analysis))
}

export function buildReport(id: string, wh: Warehouse, analysis: Analysis): Report {
  const def = REPORT_DEFS.find((d) => d.id === id)
  if (!def) throw new Error(`Unknown report ${id}`)
  if (id === 'transport' && wh.collisions.length > 0) return transportReport(def, wh)
  const missing = MISSING_DOMAIN[id]
  if (missing) return missingReport(def, missing)
  switch (id) {
    case 'police':
      return policeReport(def)
    case 'demographics':
      return demoReport(def, wh)
    case 'environment':
      return environmentReport(def, wh, analysis)
    case 'crime-annual':
      return crimeAnnualReport(def, wh)
    default:
      throw new Error(`Unhandled report ${id}`)
  }
}

function missingReport(def: (typeof REPORT_DEFS)[number], domain: string): Report {
  const gap = gapFor(domain)
  const headline = gap?.headline ?? 'Access Status: Unavailable'
  return finish(def, {
    dataClassNote: `${headline}. CityScope does not invent substitute statistics.`,
    executiveSummary: [
      headline,
      gap?.detail ?? 'No connected dataset.',
      gap?.howToObtain ?? '',
      'Correlation is not causation; with no series, no correlation is computed.',
    ].filter(Boolean),
    keyNumbers: [],
    whatChanged: ['No official time series is loaded for this domain.'],
    geographic: ['No geocoded records to map.'],
    trends: ['Not applicable until a public dataset is connected.'],
    notable: ['No unusual-pattern detection is run on missing data.'],
    crossDataset: ['No cross-dataset association is claimed.'],
    unknown: [gap?.howToObtain ?? 'A public bulk feed or CPRA production.'],
    sources: gap?.portals.map((p) => `${p.name}: ${p.url}`) ?? [],
    qualityAnswers: quality(
      headline,
      'n/a — no count displayed',
      'City of Burbank (no records loaded)',
      'n/a',
      'n/a',
      'None — access gap, not a zero count.',
      'The data may exist inside an agency system that is not published.',
      gap?.detail ?? 'Official extract missing.',
      gap?.howToObtain ?? 'Connect a public dataset.',
    ),
  })
}

function crimeAnnualReport(def: (typeof REPORT_DEFS)[number], wh: Warehouse): Report {
  const years = [...wh.crimeAnnual].sort((a, b) => a.year - b.year)
  const latest = years[years.length - 1]
  const prior = years.length >= 2 ? years[years.length - 2] : undefined
  const gap = gapFor('crime')
  const violentChange =
    latest && prior ? (((latest.violent - prior.violent) / Math.max(prior.violent, 1)) * 100).toFixed(1) : 'n/a'
  return finish(def, {
    dataClassNote:
      'OpenJustice annual agency totals are official published facts. They are not incident maps. Incident-level BPD records remain Access Status: Restricted.',
    executiveSummary: [
      latest
        ? `Burbank PD ${latest.year} OpenJustice totals: ${latest.violent.toLocaleString()} violent and ${latest.property.toLocaleString()} property offenses reported.`
        : 'Annual OpenJustice totals are not loaded.',
      prior && latest
        ? `Violent offenses vs ${prior.year}: ${violentChange}%. This is a year-to-year comparison of reported totals, not a causal finding.`
        : '',
      'These figures are UCR-style agency summaries. They are not geocoded incidents and must not be treated as a neighborhood crime map.',
      'Correlation is not causation. Incident-level analytics are not computed.',
    ].filter(Boolean),
    keyNumbers: latest
      ? [
          {
            label: `${latest.year} violent offenses (annual)`,
            value: latest.violent.toLocaleString(),
            provenance: latest.provenance,
          },
          {
            label: `${latest.year} property offenses (annual)`,
            value: latest.property.toLocaleString(),
            provenance: { ...latest.provenance, label: `${latest.year} reported property offenses (Burbank PD)`, value: latest.property, statisticId: `openjustice-${latest.year}-property` },
          },
        ]
      : [],
    whatChanged: [
      prior && latest ? `Violent ${prior.year}→${latest.year}: ${prior.violent.toLocaleString()} to ${latest.violent.toLocaleString()} (${violentChange}%).` : 'Need at least two years to describe change.',
    ],
    geographic: ['Citywide agency totals only. No neighborhood or tract assignment.'],
    trends: years.slice(-8).map((y) => `${y.year}: violent ${y.violent.toLocaleString()}, property ${y.property.toLocaleString()}.`),
    notable: ['Do not infer a crime wave, clearance failure, or policy effect from a one-year change.'],
    crossDataset: ['No association with weather, spending, or demographics is claimed. Correlation is not causation.'],
    unknown: [
      gap?.detail ?? 'Incident-level records are not loaded.',
      wh.fbiAnnual.length > 0
        ? `FBI CDE annual/API facts are loaded separately (${wh.fbiAnnual.length} years). They are not incident maps.`
        : 'FBI CDE live API needs a separate api.data.gov key (ORI CA0191200).',
    ],
    sources: ['ca-doj-openjustice', gap?.portals.map((p) => `${p.name}: ${p.url}`).join('; ') ?? ''],
    qualityAnswers: quality(
      latest ? `${latest.year} Burbank PD OpenJustice annual totals.` : 'Annual totals not loaded.',
      violentChange === 'n/a' ? 'n/a' : `${violentChange}% violent vs prior year`,
      'Burbank PD (agency row), Los Angeles County',
      latest ? String(latest.year) : 'n/a',
      prior ? String(prior.year) : 'Prior OpenJustice year',
      'CA DOJ Crimes and Clearances CSV filtered to Burbank.',
      'Reporting-practice change, CIBRS transition, incomplete statewide submissions.',
      'Incident locations, monthly series, clearances by neighborhood, FBI CDE live API.',
      'Keep OpenJustice ingest; add FBI CDE annual API only with an api.data.gov key. CPRA for incidents.',
    ),
  })
}

function transportReport(def: (typeof REPORT_DEFS)[number], wh: Warehouse): Report {
  const analysis = analyzeWarehouse(wh)
  const fileName = wh.collisionsFile ?? 'Crashes.csv'
  const provenance = collisionsProvenance(wh, fileName)
  const fatal = wh.collisions.filter((c) => c.severity === 'fatal').length
  const injury = wh.collisions.filter((c) => c.severity === 'injury').length
  const property = wh.collisions.filter((c) => c.severity === 'property').length
  const geocoded = wh.collisions.filter((c) => c.geo.lat != null && c.geo.lng != null).length
  const top = topN(analysis.collisionsByIntersection, 5)
  const dates = wh.collisions.map((c) => c.date).filter(Boolean).sort()
  return finish(def, {
    dataClassNote: `Fact / snapshot from ${fileName} (${wh.collisions.length} rows, retrieved ${wh.generatedAt}). Not demonstration data.`,
    executiveSummary: [
      `${wh.collisions.length} official Burbank collision records from ${fileName}.`,
      `Severity in this extract: ${fatal} fatal, ${injury} injury, ${property} property-damage-only.`,
      `${geocoded} rows have coordinates and can be mapped; ${wh.collisions.length - geocoded} are counted only.`,
      'These are SWITRS/TIMS records, not a live CAD feed. Correlation is not causation.',
    ],
    keyNumbers: [
      { label: `Collision records (${fileName})`, value: wh.collisions.length.toLocaleString(), provenance },
      {
        label: 'Fatal-coded rows',
        value: fatal.toLocaleString(),
        provenance: { ...provenance, statisticId: 'switrs-fatal', label: 'Fatal-coded collisions', value: fatal },
      },
    ],
    whatChanged: [
      dates[0] && dates[dates.length - 1]
        ? `Collision dates in this file: ${dates[0]} to ${dates[dates.length - 1]}.`
        : 'Collision dates are present on each row.',
    ],
    geographic: [
      geocoded > 0
        ? `${geocoded} records plotted from LATITUDE/LONGITUDE or POINT_Y/POINT_X.`
        : 'No usable coordinates in this extract; counts are still shown.',
    ],
    trends: top.map(([name, n]) => `${name}: ${n} records.`),
    notable: ['Do not treat a high intersection count as a dangerous-intersection finding without exposure (traffic volume).'],
    crossDataset: ['No association with crime, weather, or spending is claimed. Correlation is not causation.'],
    unknown: ['Traffic volumes, citations, and years outside this extract.'],
    sources: ['switrs', fileName],
    qualityAnswers: quality(
      `${wh.collisions.length} SWITRS/TIMS collision rows in ${fileName}.`,
      `${fatal} fatal / ${injury} injury / ${property} property`,
      'City of Burbank (CITY=BURBANK filter)',
      dates[0] && dates[dates.length - 1] ? `${dates[0]} to ${dates[dates.length - 1]}` : 'see file',
      'This extract only — not a multi-year comparison unless more years are present.',
      `${fileName} columns CASE_ID, COLLISION_DATE, COLLISION_SEVERITY, roads, coordinates.`,
      'Reporting practice, incomplete geocodes, injury-only extracts.',
      'Years outside the file; traffic volume; statewide context.',
      'Keep the local extract; add later TIMS years when exported.',
    ),
  })
}

function policeReport(def: (typeof REPORT_DEFS)[number]): Report {
  return finish(def, {
    dataClassNote: 'This section reports access status. It does not invent complaint, use-of-force, or crime statistics.',
    executiveSummary: [
      'Flock / ALPR: Access Status: Restricted. No authorized API or public dataset is connected.',
      'Use-of-force and complaints: Access Status: Restricted pending CPRA or a published dataset.',
      'Incident-level crime analytics are not shown anywhere in CityScope without an official public feed.',
      'Policies and training PDFs can be collected from the public website when URLs are stable.',
    ],
    keyNumbers: [],
    whatChanged: ['No restricted datasets were newly opened in this build.'],
    geographic: ['Not applicable until incident-level accountability data exists.'],
    trends: ['Not applicable.'],
    notable: ['Do not infer misconduct from missing data or from other domains.'],
    crossDataset: ['No spending or crime series is used to imply police conduct.'],
    unknown: [
      'Complaints, UOF, staffing, training completion, ALPR reads, incident extracts.',
      'How to obtain: CPRA to BPD; Flock transparency portal if the city publishes one; vendor authorization for ALPR APIs.',
    ],
    sources: ['flock-alpr (restricted)', 'bpd-uof (CPRA)', 'bpd-policies (public website, not ingested)'],
    qualityAnswers: quality(
      'Access-status report; no restricted counts.',
      'n/a',
      'n/a',
      'as of 2026-08-15',
      'Source catalog classifications.',
      'Catalog only.',
      'n/a',
      'CPRA productions and any public transparency portals.',
      'File CPRA or connect a published dataset; do not scrape ALPR.',
    ),
  })
}

function demoReport(def: (typeof REPORT_DEFS)[number], wh: Warehouse): Report {
  const c2020 = wh.census.find((c) => c.year === '2020')
  const c2023 = wh.census.find((c) => c.year === '2023')
  const c2025 = wh.census.find((c) => c.year === '2025')
  const popChange =
    c2020 && c2025 ? (((c2025.population - c2020.population) / c2020.population) * 100).toFixed(1) : 'n/a'
  const liveNote = c2023?.provenance.dataClass === 'live' ? 'ACS 2023 row is a live Census API pull.' : 'ACS 2023 row is a published-table snapshot until live ingest succeeds.'
  return finish(def, {
    dataClassNote: `Census figures are published snapshots and/or live ACS API pulls. ${liveNote}`,
    executiveSummary: [
      `2020 Census population: ${c2020?.population.toLocaleString() ?? 'n/a'}.`,
      `ACS 2023 5-year population: ${c2023?.population.toLocaleString() ?? 'n/a'}.`,
      `July 1, 2025 estimate: ${c2025?.population.toLocaleString() ?? 'n/a'} (${popChange}% vs 2020 count).`,
      `ACS 2023 5-year median household income: ${c2023?.medianHouseholdIncome ? usd(c2023.medianHouseholdIncome) : 'n/a'}.`,
      'ACS 1-year income should not be naively compared with 5-year income (different vintages and error).',
    ],
    keyNumbers:
      c2020 && c2023 && c2025
        ? [
            { label: '2020 Census population', value: c2020.population.toLocaleString(), provenance: c2020.provenance },
            { label: 'ACS 2023 5-year population', value: c2023.population.toLocaleString(), provenance: c2023.provenance },
            { label: '2025 population estimate', value: c2025.population.toLocaleString(), provenance: c2025.provenance },
          ]
        : [],
    whatChanged: [`Population estimate vs 2020 count: ${popChange}%. This mixes a census count with an estimate.`],
    geographic: ['Citywide only in this release. Tract comparison requires ACS tract tables.'],
    trends: [
      c2023?.medianHomeValue ? `ACS 2023 5-year median home value ${usd(c2023.medianHomeValue)}.` : '',
      c2023?.medianGrossRent ? `ACS 2023 5-year median gross rent ${usd(c2023.medianGrossRent)}.` : '',
      c2023?.povertyRate ? `ACS 2023 5-year poverty rate ${(c2023.povertyRate * 100).toFixed(1)}%.` : '',
    ].filter(Boolean),
    notable: ['QuickFacts mixes vintages; income on the 2025 QuickFacts row is ACS 2020–2024, not a 2025 income survey.'],
    crossDataset: ['Demographic change is not evidence that any local policy caused population movement.'],
    unknown: ['Tract-level ACS, language, commuting.', 'Housing permits are not connected (city portal, not a bulk API).'],
    sources: ['census-acs; https://www.census.gov/quickfacts/burbankcitycalifornia'],
    qualityAnswers: quality(
      'Published Census/ACS/PEP figures, plus live ACS when the key ingest succeeds.',
      `${popChange}% vs 2020 count (estimate vs count).`,
      'Burbank city',
      '2020, 2023 ACS5, 2025 PEP',
      'Prior published vintages.',
      'Census Bureau tables and/or Census Data API.',
      'Estimation error, group quarters, housing market.',
      'Tract ACS.',
      'Add tract geometries for neighborhood comparison.',
    ),
  })
}

function environmentReport(def: (typeof REPORT_DEFS)[number], wh: Warehouse, _analysis: Analysis): Report {
  const wx = wh.weather[0]
  const aqi = [...wh.airQuality].sort((a, b) => b.aqi - a.aqi)[0]
  const climate = wh.climate[wh.climate.length - 1]
  return finish(def, {
    dataClassNote:
      'Forecast is NWS. Earthquakes are USGS. AQI is AirNow (preliminary, not for regulation). Climate days are NOAA GHCND when the token ingest succeeds.',
    executiveSummary: [
      wx ? `NWS Burbank forecast: ${wx.name} ${wx.shortForecast}, ${wx.temperatureF}°F.` : 'Forecast unavailable.',
      `USGS M≥2.5 within 40 km of city center: ${wh.earthquakes.length} events in the loaded catalog window.`,
      aqi
        ? `AirNow ${aqi.parameter} AQI ${aqi.aqi} (${aqi.category}) at ${aqi.reportingArea} — preliminary observations, not AQS official.`
        : 'AirNow observation not loaded in this warehouse yet (run ingest with AIRNOW_API_KEY).',
      climate
        ? `Latest NOAA GHCND day ${climate.date}: TMAX ${climate.tmaxF ?? 'n/a'}°F, TMIN ${climate.tminF ?? 'n/a'}°F, PRCP ${climate.prcpIn ?? 'n/a'} in (${climate.station}).`
        : 'NOAA GHCND daily climate not loaded yet (run ingest with NOAA_CDO_TOKEN).',
    ],
    keyNumbers: [
      {
        label: 'Nearby M≥2.5 earthquakes',
        value: String(wh.earthquakes.length),
        provenance: {
          statisticId: 'eq-count',
          label: 'USGS events M≥2.5 within 40 km',
          value: wh.earthquakes.length,
          sourceId: 'usgs-earthquakes',
          sourceName: 'USGS earthquake catalog',
          dataset: 'FDSN event query',
          retrievedAt: wh.generatedAt,
          query: { latitude: '34.1808', longitude: '-118.3090', maxradiuskm: '40', minmagnitude: '2.5', starttime: '2026-01-01' },
          geographicFilter: '40 km radius from Burbank center',
          timePeriod: { start: '2026-01-01', end: '2026-08-15' },
          transformation: 'Count of GeoJSON features',
          claimType: 'fact',
          dataClass: wh.earthquakes[0]?.dataClass ?? 'snapshot',
          limitations: ['Radius includes events not in Burbank city limits.'],
        },
      },
    ],
    whatChanged: wh.earthquakes.slice(0, 8).map((e) => `M${e.mag.toFixed(1)} — ${e.place} (${e.time.slice(0, 10)}).`),
    geographic: ['Forecast grid is NWS LOX 154,51. Earthquakes plotted by epicenter, not felt intensity in Burbank.'],
    trends: wx ? [`Near-term highs in the forecast reach ${Math.max(...wh.weather.map((w) => w.temperatureF))}°F.`] : [],
    notable: aqi ? [`Highest loaded AQI: ${aqi.parameter} ${aqi.aqi} (${aqi.category}).`] : ['AirNow not in this warehouse snapshot.'],
    crossDataset: ['Environment + demographics: not computed without tract hazard overlays. Correlation is not causation.'],
    unknown: ['Cal-Adapt wildfire, FEMA flood, EnviroStor hazardous facilities.'],
    sources: ['nws-forecast', 'usgs-earthquakes', 'noaa-cdo', 'aqi'],
    qualityAnswers: quality(
      'NWS forecast + USGS catalog + optional AirNow/NOAA.',
      String(wh.earthquakes.length),
      'Burbank grid / 40 km radius / ZIP 91502 AQI',
      'Current forecast; catalog window; latest observation',
      'USGS catalog; NWS update time; AirNow preliminary',
      'USGS FDSN; api.weather.gov; AirNow; NOAA CDO',
      'Regional quakes may be felt weakly or not at all. AirNow is not regulatory.',
      'Wildfire, flood, facility layers.',
      'Keep keys configured and run ingest on a schedule.',
    ),
  })
}

function finish(def: (typeof REPORT_DEFS)[number], rest: Omit<Report, 'id' | 'category' | 'title' | 'period' | 'sections'>): Report {
  const sections: ReportSection[] = [
    { heading: 'Executive summary', paragraphs: rest.executiveSummary },
    { heading: 'What changed?', paragraphs: rest.whatChanged },
    { heading: 'Geographic analysis', paragraphs: rest.geographic },
    { heading: 'Trends', paragraphs: rest.trends },
    { heading: 'Notable changes', paragraphs: rest.notable },
    { heading: 'Cross-dataset findings', paragraphs: rest.crossDataset },
    { heading: 'What we don’t know', paragraphs: rest.unknown },
    { heading: 'Sources', paragraphs: rest.sources },
  ]
  return { ...def, ...rest, sections }
}

function quality(
  happened: string,
  size: string,
  where: string,
  when: string,
  baseline: string,
  support: string,
  other: string,
  missing: string,
  next: string,
): Record<string, string> {
  return {
    'What happened?': happened,
    'How large is the change?': size,
    'Where did it happen?': where,
    'When did it happen?': when,
    'Compared with what baseline?': baseline,
    'What data supports the conclusion?': support,
    'What other explanations exist?': other,
    'What information is missing?': missing,
    'What should a human investigate next?': next,
  }
}

function usd(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}
