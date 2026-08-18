export const CITY = {
  name: 'Burbank',
  state: 'California',
  county: 'Los Angeles County',
  center: { lat: 34.1808, lng: -118.309 },
  bounds: {
    south: 34.145,
    west: -118.375,
    north: 34.225,
    east: -118.255,
  },
} as const

export type AccessClass =
  | 'PUBLIC'
  | 'API_KEY'
  | 'REGISTRATION'
  | 'AUTHORIZED'
  | 'CPRA'
  | 'RESTRICTED'

export type SourceStatus =
  | 'connected'
  | 'needs_api_key'
  | 'key_invalid'
  | 'needs_registration'
  | 'needs_cpra'
  | 'restricted'
  | 'unavailable'

export type ClaimType = 'fact' | 'calculation' | 'correlation' | 'observation' | 'hypothesis'
export type DataClass = 'live' | 'snapshot' | 'demonstration'
export type UpdateFrequency = 'daily' | 'weekly' | 'monthly' | 'on_demand'

export type SourceRecord = {
  id: string
  name: string
  agency: string
  url: string
  apiEndpoint: string | null
  datasetId: string | null
  authentication: AccessClass
  rateLimit: string
  updateFrequency: UpdateFrequency
  geographicCoverage: string
  historicalCoverage: string
  fieldsAvailable: string[]
  lastSuccessfulRetrieval: string | null
  lastModified: string | null
  dataQualityRating: 1 | 2 | 3 | 4 | 5
  legalAccess: AccessClass
  howToObtain: string
  phase1Priority: number | null
}

export type Provenance = {
  statisticId: string
  label: string
  value: number | string
  unit?: string
  sourceId: string
  sourceName: string
  dataset: string
  retrievedAt: string
  query: Record<string, string>
  geographicFilter: string
  timePeriod: { start: string; end: string }
  transformation: string
  claimType: ClaimType
  dataClass: DataClass
  limitations: string[]
}

export type GeoRef = {
  addressOriginal: string | null
  addressNormalized: string | null
  lat: number | null
  lng: number | null
  zip: string | null
  censusTract: string | null
  neighborhood: string | null
  policeSector: string | null
  parcel: string | null
}

export type Neighborhood = {
  id: string
  name: string
  lat: number
  lng: number
  zipPrimary: string
}

export type MonthlySeries = {
  month: string
  value: number
}

export type CrimeIncident = {
  id: string
  category: string
  date: string
  hour: number
  weekday: number
  geo: GeoRef
  dataClass: DataClass
}

/** One reported hate-crime event. Not a geocoded incident. */
export type HateCrimeEvent = {
  id: string
  year: number
  month: number
  ncic: string
  county: string
  mostSeriousBias: string
  mostSeriousBiasType: string
  mostSeriousUcr: string
  mostSeriousLocation: string
  /** CSV WeaponType. Empty when the cell is blank — not a finding of “no weapon.” */
  weaponType: string
  /** CSV Offensive_Act. Empty when the cell is blank. */
  offensiveAct: string
  victims: number
  suspects: number
  dataClass: DataClass
}

/** Annual UCR-style agency totals. Not incident locations. */
export type AgencyCrimeYear = {
  year: number
  county: string
  agency: string
  violent: number
  homicide: number
  rape: number
  robbery: number
  aggravatedAssault: number
  property: number
  burglary: number
  vehicleTheft: number
  larceny: number
  /** Months with numeric CDE actuals. Absent on OpenJustice annual rows. */
  monthsReported?: number
  dataClass: DataClass
  provenance: Provenance
}

export type BusinessRecord = {
  id: string
  nameOriginal: string
  nameNormalized: string
  category: string
  openedOn: string
  status: 'active' | 'possible_closure' | 'closed'
  geo: GeoRef
  dataClass: DataClass
}

export type PermitRecord = {
  id: string
  type: 'residential' | 'commercial' | 'demolition' | 'remodel'
  description: string
  submittedOn: string
  approvedOn: string | null
  estimatedValue: number
  status: string
  applicantPublic: string | null
  contractorPublic: string | null
  geo: GeoRef
  dataClass: DataClass
}

export type OnBasePermitRow = {
  permitNo: string
  streetNo: string
  streetDirection: string
  streetName: string
  permitType: string
  issuedOn: string
}

export type OnBasePermitSnapshot = {
  fileName: string
  report: string
  generatedOn: string | null
  sourceUrl: string
  count: number
  dateStart: string | null
  dateEnd: string | null
  byMonth: { month: string; count: number }[]
  byType: { type: string; count: number }[]
  rows: OnBasePermitRow[]
  dataClass: DataClass
}

/** One year-end Form 460 summary. Column B is calendar-year to date — do not sum overlapping 460s. */
export type CampaignForm460YearEnd = {
  calendarYear: number
  coversFrom: string
  coversThrough: string
  filedOn: string
  filingId: string
  pdfUrl: string
  monetaryContributions: number
  loansReceived: number
  nonmonetaryContributions: number
  totalContributionsReceived: number
  totalExpendituresMade: number
  endingCashBalance: number
  terminated: boolean
}

/** Form 470 short form as listed on eFile. Not a dollar total. */
export type CampaignForm470 = {
  calendarYear: number
  coversFrom: string
  coversThrough: string
  filedOn: string
  pdfUrl: string
}

export type CampaignContributorCode = 'IND' | 'COM' | 'OTH' | 'PTY' | 'SCC'

/** One itemized Schedule A contributor, summed across campaign-year Form 460s. */
export type CampaignContributor = {
  name: string
  city: string | null
  state: string | null
  zip: string | null
  contributorCode: CampaignContributorCode | null
  occupationEmployer: string | null
  amount: number
  giftCount: number
}

export type CampaignScheduleA = {
  itemized: CampaignContributor[]
  itemizedTotal: number
  unitemized: number
}

export type CampaignCommittee = {
  candidateName: string
  office: string
  committeeName: string
  stateId: string
  electionYear: number
  electionDate: string
  yearEnd460: CampaignForm460YearEnd
  officeholder470: CampaignForm470[]
  scheduleA: CampaignScheduleA
}

/** Transcribed year-end Form 460 totals for sitting Burbank City Council members. Not every eFile filer. */
export type CampaignSnapshot = {
  sourceUrl: string
  retrievedAt: string
  election: string
  electionDate: string
  committees: CampaignCommittee[]
  dataClass: DataClass
}

export type DevelopmentProject = {
  id: string
  title: string
  geo: GeoRef
  zoning: string | null
  estimatedValue: number
  status: string
  timeline: { date: string; event: string }[]
  relatedPermitIds: string[]
  dataClass: DataClass
}

export type Expenditure = {
  id: string
  date: string
  department: string
  vendor: string
  vendorId: string
  amount: number
  category: string
  description: string
  sourceRecordUrl: string
  dataClass: DataClass
}

export type Collision = {
  id: string
  date: string
  hour: number | null
  severity: 'property' | 'injury' | 'fatal'
  intersection: string
  geo: GeoRef
  dataClass: DataClass
  city: string
  year: number | null
  dayOfWeek: number | null
  severityCode: string
  killed: number
  injured: number
  primaryRd: string
  secondaryRd: string
  alcoholInvolved: boolean
  pedestrian: boolean
  bicycle: boolean
  motorcycle: boolean
  truck: boolean
  hitAndRun: string
  lighting: string
  weather: string
  collisionType: string
  atIntersection: string
  towAway: string
  pcfViolCategory: string
}

/** Mutually exclusive ACS B03002 group. Shares are calculations from estimates. */
export type CensusRaceEthnicity = {
  id: string
  label: string
  estimate: number
  moe: number | null
  share: number
  shareMoe: number | null
}

export type CensusSnapshot = {
  year: string
  vintage: string
  population: number
  medianAge: number | null
  medianHouseholdIncome: number | null
  povertyRate: number | null
  medianHomeValue: number | null
  medianGrossRent: number | null
  households: number | null
  bachelorOrHigher: number | null
  raceEthnicity: CensusRaceEthnicity[] | null
  notes: string[]
  provenance: Provenance
}

export type Earthquake = {
  id: string
  time: string
  mag: number
  place: string
  lat: number
  lng: number
  depthKm: number
  url: string
  dataClass: DataClass
}

export type WeatherPeriod = {
  name: string
  startTime: string
  temperatureF: number
  shortForecast: string
  wind: string
}

export type AirportMonth = {
  month: string
  passengers: number
  dataClass: DataClass
}

export type AccessGap = {
  domain: string
  status: SourceStatus
  headline: string
  detail: string
  howToObtain: string
  portals: { name: string; url: string }[]
}

export type AirQualityObs = {
  dateObserved: string
  hourObserved: number
  reportingArea: string
  parameter: string
  aqi: number
  category: string
  dataClass: DataClass
}

export type ClimateDay = {
  date: string
  tmaxF: number | null
  tminF: number | null
  prcpIn: number | null
  station: string
  dataClass: DataClass
}

/** One OpenGov Annual column: adopted budget or an actuals cutoff. */
export type OpenGovPeriod = {
  label: string
  fiscalYear: string
  kind: 'budget' | 'actual'
  asOfMonth: string | null
  audited: boolean
}

export type OpenGovDepartmentRow = {
  department: string
  amounts: Record<string, number>
  isTotal: boolean
}

/** Local OpenGov transparency CSV (Annual — Departments). Not a check register. */
export type OpenGovAnnualSnapshot = {
  city: string
  report: string
  generatedOn: string | null
  fileName: string
  periods: OpenGovPeriod[]
  departments: OpenGovDepartmentRow[]
  dataClass: DataClass
}

/** Vendor payment listing rollup. Not a contract register and not a department budget. */
export type OpenGovPaymentRollup = {
  fileName: string
  report: string
  generatedOn: string | null
  sourceUrl: string
  count: number
  total: number
  dateStart: string | null
  dateEnd: string | null
  byMonth: { month: string; amount: number; count: number }[]
  topVendors: { vendor: string; amount: number; count: number }[]
  dataClass: DataClass
}

export type LiveOverlay = {
  retrievedAt: string
  census: CensusSnapshot[] | null
  weather: WeatherPeriod[] | null
  earthquakes: Earthquake[] | null
  climate: ClimateDay[] | null
  airQuality: AirQualityObs[] | null
  crimeAnnual: AgencyCrimeYear[] | null
  fbiAnnual: AgencyCrimeYear[] | null
  crimeAnnualGlendale: AgencyCrimeYear[] | null
  fbiAnnualGlendale: AgencyCrimeYear[] | null
  censusGlendale: CensusSnapshot[] | null
  collisions: Collision[] | null
  collisionsFile: string | null
  collisionsGlendale: Collision[] | null
  collisionsGlendaleFile: string | null
  hateCrimeEvents: HateCrimeEvent[] | null
  budgetAnnual?: OpenGovAnnualSnapshot | null
  payments?: OpenGovPaymentRollup | null
  permitListing?: OnBasePermitSnapshot | null
  campaigns?: CampaignSnapshot | null
  errors: { sourceId: string; message: string }[]
}

export type Warehouse = {
  generatedAt: string
  neighborhoods: Neighborhood[]
  crime: CrimeIncident[]
  crimeAnnual: AgencyCrimeYear[]
  businesses: BusinessRecord[]
  permits: PermitRecord[]
  projects: DevelopmentProject[]
  expenditures: Expenditure[]
  collisions: Collision[]
  collisionsFile: string | null
  collisionsGlendale: Collision[]
  collisionsGlendaleFile: string | null
  hateCrimeEvents: HateCrimeEvent[]
  budgetAnnual: OpenGovAnnualSnapshot | null
  payments: OpenGovPaymentRollup | null
  permitListing: OnBasePermitSnapshot | null
  campaigns: CampaignSnapshot | null
  fbiAnnual: AgencyCrimeYear[]
  crimeAnnualGlendale: AgencyCrimeYear[]
  fbiAnnualGlendale: AgencyCrimeYear[]
  censusGlendale: CensusSnapshot[]
  census: CensusSnapshot[]
  earthquakes: Earthquake[]
  weather: WeatherPeriod[]
  airport: AirportMonth[]
  airQuality: AirQualityObs[]
  climate: ClimateDay[]
  accessGaps: AccessGap[]
  populationForRates: number
  populationGlendaleForRates: number
}

export const CLAIM_LABEL: Record<ClaimType, string> = {
  fact: 'Fact',
  calculation: 'Calculation',
  correlation: 'Correlation / Association',
  observation: 'Observation',
  hypothesis: 'Hypothesis',
}

export const ACCESS_LABEL: Record<AccessClass, string> = {
  PUBLIC: 'Public — no authentication',
  API_KEY: 'API key — free or easy key',
  REGISTRATION: 'Registration — free account required',
  AUTHORIZED: 'Authorized — agency or vendor approval required',
  CPRA: 'CPRA — public-records request may be required',
  RESTRICTED: 'Restricted — not currently accessible',
}

export const STATUS_LABEL: Record<SourceStatus, string> = {
  connected: 'Connected',
  needs_api_key: 'Needs API key',
  key_invalid: 'Key present — live call failed',
  needs_registration: 'Needs registration',
  needs_cpra: 'Needs CPRA request',
  restricted: 'Restricted',
  unavailable: 'Unavailable',
}
