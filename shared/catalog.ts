import type { AccessClass, SourceRecord, SourceStatus } from './types.ts'

export type AccessKeys = {
  CENSUS_API_KEY: boolean
  NOAA_CDO_TOKEN: boolean
  AIRNOW_API_KEY: boolean
  DATA_GOV_API_KEY: boolean
}

export type SourceLiveRow = SourceRecord & {
  status: SourceStatus
  statusDetail: string | null
}

export type SourceOverlayHints = {
  retrievedAt: string
  census: unknown
  climate: unknown
  airQuality: unknown
  weather?: unknown
  earthquakes?: unknown
  crimeAnnual?: unknown
  fbiAnnual?: unknown
  collisions?: unknown
  hateCrimeEvents?: unknown
  errors: { sourceId: string; message: string }[]
}

const KEYED_LIVE: Record<
  string,
  { env: keyof AccessKeys; overlayField?: 'census' | 'climate' | 'airQuality' | 'fbiAnnual' }
> = {
  'census-acs': { env: 'CENSUS_API_KEY', overlayField: 'census' },
  'noaa-cdo': { env: 'NOAA_CDO_TOKEN', overlayField: 'climate' },
  aqi: { env: 'AIRNOW_API_KEY', overlayField: 'airQuality' },
  'fbi-cde': { env: 'DATA_GOV_API_KEY', overlayField: 'fbiAnnual' },
}

const PUBLIC_OVERLAY: Record<string, keyof SourceOverlayHints> = {
  'nws-forecast': 'weather',
  'usgs-earthquakes': 'earthquakes',
  'ca-doj-openjustice': 'crimeAnnual',
  'ca-doj-openjustice-hate-crime': 'hateCrimeEvents',
}

export const SOURCES: SourceRecord[] = [
  {
    id: 'burbank-gis',
    name: 'City of Burbank GIS / ArcGIS REST',
    agency: 'City of Burbank Information Technology — GIS Team',
    url: 'https://gis.burbankca.gov/',
    apiEndpoint: 'https://mobilegis.burbankca.gov/burgis/rest/services',
    datasetId: 'burgis',
    authentication: 'PUBLIC',
    rateLimit: 'Unknown; ArcGIS maxRecordCount applies per layer',
    updateFrequency: 'weekly',
    geographicCoverage: 'City of Burbank',
    historicalCoverage: 'Varies by layer; landbase is current inventory',
    fieldsAvailable: ['parcels', 'zoning', 'streets', 'city boundary'],
    lastSuccessfulRetrieval: null,
    lastModified: null,
    dataQualityRating: 4,
    legalAccess: 'PUBLIC',
    howToObtain:
      'Query the public REST directory at https://mobilegis.burbankca.gov/burgis/rest/services (map portal https://gis.burbankca.gov/). Some layers may require a token; confirm per service.',
    phase1Priority: 1,
  },
  {
    id: 'burbank-business',
    name: 'Burbank business licenses',
    agency: 'City of Burbank — Finance / Business License',
    url: 'https://www.burbankca.gov/web/community-development/business-license-tax',
    apiEndpoint: null,
    datasetId: null,
    authentication: 'REGISTRATION',
    rateLimit: 'Not published as a bulk API',
    updateFrequency: 'weekly',
    geographicCoverage: 'City of Burbank',
    historicalCoverage: 'Unknown until a bulk extract is obtained',
    fieldsAvailable: ['business name', 'address', 'category', 'license status'],
    lastSuccessfulRetrieval: null,
    lastModified: null,
    dataQualityRating: 2,
    legalAccess: 'REGISTRATION',
    howToObtain:
      'No bulk license API. Register or apply at https://www.burbankca.gov/web/community-development/business-license-tax. Request a public extract via CPRA at https://www.burbankca.gov/web/city-clerks-office/public-records-request. CityScope does not display fabricated license counts.',
    phase1Priority: 2,
  },
  {
    id: 'burbank-permits',
    name: 'Burbank building permits / development',
    agency: 'City of Burbank — Community Development',
    url: 'https://permit.burbankca.gov/bop/jsp/online/onlineRegister.jsp?appId=elms',
    apiEndpoint: 'https://permit.burbankca.gov/bop/onlineLogon.do',
    datasetId: null,
    authentication: 'REGISTRATION',
    rateLimit: 'Not published as a bulk API',
    updateFrequency: 'weekly',
    geographicCoverage: 'City of Burbank',
    historicalCoverage: 'Unknown until a bulk extract is obtained',
    fieldsAvailable: ['permit type', 'address', 'status', 'valuation', 'dates'],
    lastSuccessfulRetrieval: null,
    lastModified: null,
    dataQualityRating: 2,
    legalAccess: 'REGISTRATION',
    howToObtain:
      'Register at https://permit.burbankca.gov/bop/jsp/online/onlineRegister.jsp?appId=elms then sign in at https://permit.burbankca.gov/bop/onlineLogon.do for individual lookups. Request a bulk CSV via CPRA at https://www.burbankca.gov/web/city-clerks-office/public-records-request. CityScope does not display fabricated permits.',
    phase1Priority: 3,
  },
  {
    id: 'burbank-opengov',
    name: 'Burbank OpenGov financial transparency',
    agency: 'City of Burbank — Finance',
    url: 'https://burbankca.opengov.com/transparency',
    apiEndpoint: null,
    datasetId: 'burbankca.opengov',
    authentication: 'PUBLIC',
    rateLimit: 'Web portal; bulk API access is not documented for this instance',
    updateFrequency: 'monthly',
    geographicCoverage: 'City of Burbank',
    historicalCoverage: 'Budget years published in OpenGov',
    fieldsAvailable: ['budget', 'actuals', 'departments', 'funds'],
    lastSuccessfulRetrieval: null,
    lastModified: null,
    dataQualityRating: 3,
    legalAccess: 'PUBLIC',
    howToObtain:
      'Browse and export from https://burbankca.opengov.com/transparency. Parse a structured export before CityScope can show expenditure totals. No demonstration ledger is shown.',
    phase1Priority: 4,
  },
  {
    id: 'burbank-pd',
    name: 'Burbank Police Department public crime data',
    agency: 'Burbank Police Department',
    url: 'https://www.burbankca.gov/web/city-clerks-office/public-records-request',
    apiEndpoint: null,
    datasetId: null,
    authentication: 'CPRA',
    rateLimit: 'No public incident API identified',
    updateFrequency: 'weekly',
    geographicCoverage: 'City of Burbank',
    historicalCoverage: 'Unknown',
    fieldsAvailable: ['crime category', 'location', 'date', 'time', 'sector'],
    lastSuccessfulRetrieval: null,
    lastModified: null,
    dataQualityRating: 2,
    legalAccess: 'CPRA',
    howToObtain:
      'Incident-level BPD records are not a public bulk API. Submit a CPRA request at https://www.burbankca.gov/web/city-clerks-office/public-records-request (search published records at https://www.burbankca.gov/web/city-clerks-office/public-records-portal). Annual agency totals: FBI CDE after https://api.data.gov/signup/ (ORI CA0191200), or CA DOJ OpenJustice at https://openjustice.doj.ca.gov/data. CityScope does not display fabricated incident counts.',
    phase1Priority: 5,
  },
  {
    id: 'census-acs',
    name: 'U.S. Census Bureau ACS / Decennial',
    agency: 'U.S. Census Bureau',
    url: 'https://www.census.gov/quickfacts/burbankcitycalifornia',
    apiEndpoint: 'https://api.census.gov/data',
    datasetId: 'place:08954 / state:06',
    authentication: 'API_KEY',
    rateLimit: 'Census Data API now requires a key',
    updateFrequency: 'monthly',
    geographicCoverage: 'Burbank city, CA; tracts; block groups',
    historicalCoverage: '2010 and 2020 Census; ACS 5-year and 1-year vintages',
    fieldsAvailable: ['population', 'income', 'poverty', 'housing', 'education', 'age', 'race', 'ethnicity'],
    lastSuccessfulRetrieval: '2026-08-15',
    lastModified: '2024-12-01',
    dataQualityRating: 5,
    legalAccess: 'API_KEY',
    howToObtain: 'Request a free Census API key at https://api.census.gov/data/key_signup.html. Snapshots below use published QuickFacts / ACS tables.',
    phase1Priority: 6,
  },
  {
    id: 'ca-open-data',
    name: 'California Open Data',
    agency: 'State of California',
    url: 'https://data.ca.gov/dataset?q=Burbank',
    apiEndpoint: 'https://data.ca.gov/api/3/action',
    datasetId: null,
    authentication: 'PUBLIC',
    rateLimit: 'CKAN standard',
    updateFrequency: 'monthly',
    geographicCoverage: 'California; filter to Burbank / LA County',
    historicalCoverage: 'Varies by dataset',
    fieldsAvailable: ['varies'],
    lastSuccessfulRetrieval: null,
    lastModified: null,
    dataQualityRating: 3,
    legalAccess: 'PUBLIC',
    howToObtain:
      'Search and download at https://data.ca.gov/dataset?q=Burbank (portal https://data.ca.gov/). Public datasets do not require a key. Add connectors per dataset.',
    phase1Priority: 7,
  },
  {
    id: 'lacounty-gis',
    name: 'Los Angeles County GIS',
    agency: 'County of Los Angeles',
    url: 'https://egis-lacounty.hub.arcgis.com/search',
    apiEndpoint: 'https://public.gis.lacounty.gov/arcgis/rest/services',
    datasetId: null,
    authentication: 'PUBLIC',
    rateLimit: 'ArcGIS Hub / REST limits',
    updateFrequency: 'weekly',
    geographicCoverage: 'Los Angeles County, including Burbank',
    historicalCoverage: 'Varies',
    fieldsAvailable: ['parcels', 'boundaries', 'transportation'],
    lastSuccessfulRetrieval: null,
    lastModified: null,
    dataQualityRating: 4,
    legalAccess: 'PUBLIC',
    howToObtain:
      'Browse https://egis-lacounty.hub.arcgis.com/search or query REST at https://public.gis.lacounty.gov/arcgis/rest/services. Clip features to the Burbank city boundary. Public layers do not require a key.',
    phase1Priority: 8,
  },
  {
    id: 'nws-forecast',
    name: 'NWS / weather.gov forecast',
    agency: 'National Weather Service',
    url: 'https://www.weather.gov/',
    apiEndpoint: 'https://api.weather.gov/gridpoints/LOX/154,51/forecast',
    datasetId: 'LOX/154,51',
    authentication: 'PUBLIC',
    rateLimit: 'User-Agent required; be polite',
    updateFrequency: 'daily',
    geographicCoverage: 'Burbank grid point (NWS LOX)',
    historicalCoverage: 'Forecast periods only (not a climate archive)',
    fieldsAvailable: ['temperature', 'wind', 'short forecast', 'precipitation probability'],
    lastSuccessfulRetrieval: '2026-08-15',
    lastModified: '2026-08-15',
    dataQualityRating: 5,
    legalAccess: 'PUBLIC',
    howToObtain: 'GET https://api.weather.gov/points/34.1808,-118.3090 then follow forecast URL. Include a contact User-Agent.',
    phase1Priority: 9,
  },
  {
    id: 'usgs-earthquakes',
    name: 'USGS earthquake catalog',
    agency: 'U.S. Geological Survey',
    url: 'https://earthquake.usgs.gov/',
    apiEndpoint: 'https://earthquake.usgs.gov/fdsnws/event/1/query',
    datasetId: 'fdsnws-event',
    authentication: 'PUBLIC',
    rateLimit: 'USGS FDSN; keep queries bounded',
    updateFrequency: 'daily',
    geographicCoverage: '40 km radius from Burbank center',
    historicalCoverage: '1900–present depending on network',
    fieldsAvailable: ['magnitude', 'place', 'time', 'coordinates', 'depth', 'event url'],
    lastSuccessfulRetrieval: '2026-08-15',
    lastModified: '2026-08-15',
    dataQualityRating: 5,
    legalAccess: 'PUBLIC',
    howToObtain: 'FDSN query with latitude, longitude, maxradiuskm. No key required.',
    phase1Priority: 10,
  },
  {
    id: 'ca-doj-openjustice',
    name: 'CA DOJ OpenJustice crimes and clearances',
    agency: 'California Department of Justice — Criminal Justice Statistics Center',
    url: 'https://openjustice.doj.ca.gov/data',
    apiEndpoint: 'https://data-openjustice.doj.ca.gov/',
    datasetId: 'crimes-and-clearances',
    authentication: 'PUBLIC',
    rateLimit: 'Statewide annual files; no live incident API',
    updateFrequency: 'monthly',
    geographicCoverage: 'California agencies including Burbank PD and Glendale PD',
    historicalCoverage: 'Annual UCR-style agency totals (multi-decade files)',
    fieldsAvailable: ['homicide', 'rape', 'robbery', 'aggravated assault', 'burglary', 'larceny', 'vehicle theft', 'arson'],
    lastSuccessfulRetrieval: '2026-08-15',
    lastModified: '2025-07-01',
    dataQualityRating: 4,
    legalAccess: 'PUBLIC',
    howToObtain:
      'Download Crimes and Clearances from OpenJustice and filter to Burbank PD or Glendale PD. These are annual agency totals, not geocoded incidents. CityScope does not display fabricated incident counts.',
    phase1Priority: 5,
  },
  {
    id: 'ca-doj-openjustice-hate-crime',
    name: 'CA DOJ OpenJustice hate crime',
    agency: 'California Department of Justice — Criminal Justice Statistics Center',
    url: 'https://data-openjustice.doj.ca.gov/data/hate-crime',
    apiEndpoint:
      'https://data-openjustice.doj.ca.gov/sites/default/files/dataset/2026-07/Hate%20Crimes_2001-2025.csv',
    datasetId: 'hate-crime',
    authentication: 'PUBLIC',
    rateLimit: 'Statewide event-level file; no live incident API',
    updateFrequency: 'monthly',
    geographicCoverage: 'Burbank PD (NCIC 1912 / Los Angeles County 19). The CSV has no city name.',
    historicalCoverage: 'Reported hate-crime events, ClosedYear 2001–2025',
    fieldsAvailable: [
      'ClosedYear',
      'MonthOccurrence',
      'MostSeriousBias',
      'MostSeriousBiasType',
      'MostSeriousUcr',
      'victim counts',
      'suspect counts',
      'location',
    ],
    lastSuccessfulRetrieval: '2026-08-16',
    lastModified: '2026-07-01',
    dataQualityRating: 4,
    legalAccess: 'PUBLIC',
    howToObtain:
      'Download Hate Crimes 2001–2025 from https://data-openjustice.doj.ca.gov/data/hate-crime and filter NCIC=1912 (Burbank PD). Do not use statewide totals as Burbank. These are reported events, not geocoded incidents. CityScope does not display fabricated incident counts.',
    phase1Priority: 5,
  },
  {
    id: 'fbi-cde',
    name: 'FBI Crime Data Explorer (agency summaries)',
    agency: 'Federal Bureau of Investigation',
    url: 'https://api.data.gov/signup/',
    apiEndpoint: 'https://api.usa.gov/crime/fbi/sapi',
    datasetId: 'ORI CA0191200 / CA0192500',
    authentication: 'API_KEY',
    rateLimit: 'api.data.gov key required',
    updateFrequency: 'monthly',
    geographicCoverage: 'Burbank PD (ORI CA0191200) and Glendale PD (ORI CA0192500)',
    historicalCoverage: 'UCR/NIBRS annual agency summaries',
    fieldsAvailable: ['offense counts by year', 'violent/property summaries'],
    lastSuccessfulRetrieval: null,
    lastModified: null,
    dataQualityRating: 4,
    legalAccess: 'API_KEY',
    howToObtain:
      'Request a free api.data.gov key at https://api.data.gov/signup/ then query summarized agency offenses (explorer https://cde.ucr.cjis.gov/). This is annual totals, not a live incident map.',
    phase1Priority: 5,
  },
  {
    id: 'noaa-cdo',
    name: 'NOAA Climate Data Online',
    agency: 'NOAA NCEI',
    url: 'https://www.ncei.noaa.gov/cdo-web/',
    apiEndpoint: 'https://www.ncei.noaa.gov/cdo-web/api/v2/',
    datasetId: 'GHCND',
    authentication: 'API_KEY',
    rateLimit: 'Token required; daily token caps',
    updateFrequency: 'daily',
    geographicCoverage: 'Station nearest Burbank (e.g. BUR / Lockheed)',
    historicalCoverage: 'Decades of daily observations',
    fieldsAvailable: ['TMAX', 'TMIN', 'PRCP'],
    lastSuccessfulRetrieval: '2026-08-15',
    lastModified: null,
    dataQualityRating: 5,
    legalAccess: 'API_KEY',
    howToObtain: 'Request a free CDO token at https://www.ncei.noaa.gov/cdo-web/token. Forecast weather uses NWS (public) until the token is set.',
    phase1Priority: 9,
  },
  {
    id: 'switrs',
    name: 'SWITRS / TIMS traffic collisions',
    agency: 'California Highway Patrol / UC Berkeley TIMS',
    url: 'https://tims.berkeley.edu/register.php',
    apiEndpoint: null,
    datasetId: 'SWITRS',
    authentication: 'REGISTRATION',
    rateLimit: 'TIMS account',
    updateFrequency: 'monthly',
    geographicCoverage: 'California; filter to Burbank',
    historicalCoverage: 'Multi-year collision records',
    fieldsAvailable: ['date', 'severity', 'intersection', 'coordinates'],
    lastSuccessfulRetrieval: null,
    lastModified: null,
    dataQualityRating: 4,
    legalAccess: 'REGISTRATION',
    howToObtain:
      'Create a free TIMS account at https://tims.berkeley.edu/register.php then export Burbank collisions. Statewide CCRS files: https://data.ca.gov/dataset/ccrs. CityScope does not display fabricated crash points.',
    phase1Priority: 7,
  },
  {
    id: 'bur-airport',
    name: 'Hollywood Burbank Airport activity',
    agency: 'Burbank-Glendale-Pasadena Airport Authority',
    url: 'https://www.hollywoodburbankairport.com/about-us/airport-statistics/',
    apiEndpoint: null,
    datasetId: null,
    authentication: 'PUBLIC',
    rateLimit: 'No bulk API identified',
    updateFrequency: 'monthly',
    geographicCoverage: 'BUR airport and surrounding neighborhoods',
    historicalCoverage: 'Published traffic reports when available',
    fieldsAvailable: ['passengers', 'operations', 'airlines'],
    lastSuccessfulRetrieval: null,
    lastModified: null,
    dataQualityRating: 2,
    legalAccess: 'PUBLIC',
    howToObtain:
      'Download published passenger and cargo PDFs from https://www.hollywoodburbankairport.com/about-us/airport-statistics/. CityScope does not display fabricated passenger counts.',
    phase1Priority: null,
  },
  {
    id: 'aqi',
    name: 'AirNow / SCAQMD air quality',
    agency: 'EPA AirNow / South Coast AQMD',
    url: 'https://www.airnow.gov/',
    apiEndpoint: 'https://www.airnowapi.org/',
    datasetId: null,
    authentication: 'API_KEY',
    rateLimit: 'AirNow API key',
    updateFrequency: 'daily',
    geographicCoverage: 'Burbank / San Fernando Valley monitors',
    historicalCoverage: 'Recent observations; archives via AirNow',
    fieldsAvailable: ['AQI', 'PM2.5', 'ozone'],
    lastSuccessfulRetrieval: '2026-08-15',
    lastModified: null,
    dataQualityRating: 4,
    legalAccess: 'API_KEY',
    howToObtain: 'Request an AirNow API key. SCAQMD also publishes regional reports.',
    phase1Priority: null,
  },
  {
    id: 'flock-alpr',
    name: 'Flock / ALPR',
    agency: 'Flock Safety / Burbank Police Department',
    url: 'https://transparency.flocksafety.com/burbank-ca-pd',
    apiEndpoint: null,
    datasetId: null,
    authentication: 'RESTRICTED',
    rateLimit: 'Not applicable',
    updateFrequency: 'on_demand',
    geographicCoverage: 'Camera locations if ever published',
    historicalCoverage: 'Not available to this system',
    fieldsAvailable: [],
    lastSuccessfulRetrieval: null,
    lastModified: null,
    dataQualityRating: 1,
    legalAccess: 'RESTRICTED',
    howToObtain:
      'Treat as restricted. Public usage stats only: https://transparency.flocksafety.com/burbank-ca-pd (city page https://www.burbankca.gov/web/police-department/flock-safety). Plate reads are not public; request via CPRA at https://www.burbankca.gov/web/city-clerks-office/public-records-request. CityScope will not ingest ALPR reads without authorization.',
    phase1Priority: null,
  },
  {
    id: 'bpd-uof',
    name: 'BPD use-of-force and complaints',
    agency: 'Burbank Police Department',
    url: 'https://www.burbankca.gov/web/city-clerks-office/public-records-request',
    apiEndpoint: null,
    datasetId: null,
    authentication: 'CPRA',
    rateLimit: 'Not applicable',
    updateFrequency: 'on_demand',
    geographicCoverage: 'City of Burbank',
    historicalCoverage: 'Unknown',
    fieldsAvailable: ['incident date', 'type', 'disposition — if released'],
    lastSuccessfulRetrieval: null,
    lastModified: null,
    dataQualityRating: 1,
    legalAccess: 'CPRA',
    howToObtain:
      'Request via CPRA at https://www.burbankca.gov/web/city-clerks-office/public-records-request. Published complaint summaries (not incident files) are on https://www.burbankca.gov/web/police-department/transparency. Do not assume records exist in a public bulk feed. Display Access Status: Restricted until produced.',
    phase1Priority: 5,
  },
  {
    id: 'bpd-policies',
    name: 'BPD policies and training documents',
    agency: 'Burbank Police Department',
    url: 'https://www.burbankca.gov/web/police-department/transparency',
    apiEndpoint: null,
    datasetId: null,
    authentication: 'PUBLIC',
    rateLimit: 'Website',
    updateFrequency: 'on_demand',
    geographicCoverage: 'Department-wide',
    historicalCoverage: 'As published',
    fieldsAvailable: ['policy title', 'effective date', 'document URL'],
    lastSuccessfulRetrieval: null,
    lastModified: null,
    dataQualityRating: 2,
    legalAccess: 'PUBLIC',
    howToObtain:
      'Collect SB 978 policy PDFs from https://www.burbankca.gov/web/police-department/transparency. Confirm before scraping.',
    phase1Priority: 5,
  },
]

export function sourceById(id: string): SourceRecord | undefined {
  return SOURCES.find((s) => s.id === id)
}

export function statusFor(source: SourceRecord): SourceStatus {
  if (source.lastSuccessfulRetrieval && (source.legalAccess === 'PUBLIC' || source.legalAccess === 'API_KEY')) {
    if (
      source.id === 'census-acs' ||
      source.id === 'nws-forecast' ||
      source.id === 'usgs-earthquakes' ||
      source.id === 'noaa-cdo' ||
      source.id === 'aqi' ||
      source.id === 'ca-doj-openjustice' ||
      source.id === 'ca-doj-openjustice-hate-crime' ||
      source.id === 'switrs' ||
      source.id === 'fbi-cde'
    ) {
      return 'connected'
    }
  }
  switch (source.legalAccess) {
    case 'PUBLIC':
      return source.lastSuccessfulRetrieval ? 'connected' : 'unavailable'
    case 'API_KEY':
      return 'needs_api_key'
    case 'REGISTRATION':
      return 'needs_registration'
    case 'AUTHORIZED':
      return 'restricted'
    case 'CPRA':
      return 'needs_cpra'
    case 'RESTRICTED':
      return 'restricted'
    default:
      return 'unavailable'
  }
}

/** Live status from env key presence plus last overlay/ingest result. Never treats a set key as missing. */
export function liveSourceView(
  source: SourceRecord,
  keys: AccessKeys,
  overlay: SourceOverlayHints | null,
): SourceLiveRow {
  if (source.id === 'switrs') {
    const collisions = overlay?.collisions
    const count = Array.isArray(collisions) ? collisions.length : 0
    if (count > 0) {
      return {
        ...source,
        status: 'connected',
        lastSuccessfulRetrieval: overlay?.retrievedAt ?? source.lastSuccessfulRetrieval,
        statusDetail: `${count} collision records from local Crashes.csv`,
      }
    }
    return { ...source, status: statusFor(source), statusDetail: null }
  }
  if (source.id === 'ca-doj-openjustice-hate-crime') {
    const events = overlay?.hateCrimeEvents
    const count = Array.isArray(events) ? events.length : 0
    if (count > 0) {
      return {
        ...source,
        status: 'connected',
        lastSuccessfulRetrieval: overlay?.retrievedAt ?? source.lastSuccessfulRetrieval,
        statusDetail: `${count} hate-crime events (NCIC 1912)`,
      }
    }
    return { ...source, status: statusFor(source), statusDetail: null }
  }
  const keyed = KEYED_LIVE[source.id]
  const overlayField = keyed?.overlayField ?? PUBLIC_OVERLAY[source.id]
  const liveData = overlay && overlayField ? overlay[overlayField] : undefined
  const hasOverlayData = Array.isArray(liveData) ? liveData.length > 0 : Boolean(liveData)
  if (!keyed) {
    if (hasOverlayData && overlay) {
      return {
        ...source,
        status: 'connected',
        lastSuccessfulRetrieval: overlay.retrievedAt,
        statusDetail: 'Published snapshot',
      }
    }
    return { ...source, status: statusFor(source), statusDetail: null }
  }
  if (!keys[keyed.env]) {
    if (hasOverlayData && overlay) {
      return {
        ...source,
        status: 'connected',
        lastSuccessfulRetrieval: overlay.retrievedAt,
        statusDetail: 'Published snapshot. Live keyed ingest stays local.',
      }
    }
    return { ...source, status: 'needs_api_key', statusDetail: null }
  }
  if (!overlay) {
    return {
      ...source,
      status: 'connected',
      statusDetail: 'API key present on this machine.',
    }
  }
  const error = overlay.errors.find((e) => e.sourceId === source.id)
  if (hasOverlayData) {
    return {
      ...source,
      status: 'connected',
      lastSuccessfulRetrieval: overlay.retrievedAt,
      statusDetail: null,
    }
  }
  if (error) {
    return {
      ...source,
      status: 'key_invalid',
      statusDetail: error.message,
    }
  }
  return {
    ...source,
    status: 'connected',
    statusDetail: 'API key present on this machine.',
  }
}

export function accessTone(access: AccessClass): string {
  switch (access) {
    case 'PUBLIC':
      return 'public'
    case 'API_KEY':
      return 'key'
    case 'REGISTRATION':
      return 'reg'
    case 'AUTHORIZED':
      return 'auth'
    case 'CPRA':
      return 'cpra'
    case 'RESTRICTED':
      return 'restricted'
    default:
      return 'restricted'
  }
}
