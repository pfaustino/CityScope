import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { parseAcsTable } from '../server/connectors/census.ts'
import { parseAirNow } from '../server/connectors/airnow.ts'
import { parseNoaa } from '../server/connectors/noaa.ts'
import { parseFbiCdeActualsByYear, parseFbiCdeYearCoverage } from '../server/connectors/fbiCde.ts'
import {
  parseHateCrimeCsv,
  hateCrimeAnnual,
  hateCrimeBiasTypeCounts,
  hateCrimeLocationCounts,
  hateCrimeMonthCounts,
  hateCrimeOffensiveActCounts,
  hateCrimeWeaponCounts,
  HATE_CRIME_BLANK_CELL,
} from '../shared/hateCrime.ts'
import { parseOpenJusticeCsv } from '../server/connectors/openjustice.ts'
import { parseForecast, parseQuakes, parseDwmlForecast, parseQuakeMl } from '../shared/liveParse.ts'
import { NWS_DWML_URL, USGS_QUAKEML_URL } from '../shared/publicFeeds.ts'
import { parseSwitrsCsv, rollupCollisions } from '../shared/switrs.ts'
import {
  citywideBudgetVsActual,
  departmentChartRows,
  latestBudgetPeriod,
  parseOpenGovAnnualCsv,
  parseOpenGovPaymentsCsv,
  ytdActualPeriod,
} from '../shared/opengov.ts'

describe('live parsers', () => {
  it('documents the public XML URLs used on page load', () => {
    expect(USGS_QUAKEML_URL).toContain('format=xml')
    expect(USGS_QUAKEML_URL).toContain('latitude=34.1808')
    expect(USGS_QUAKEML_URL).toContain('maxradiuskm=40')
    expect(USGS_QUAKEML_URL).toContain('minmagnitude=2.5')
    expect(USGS_QUAKEML_URL).toContain('starttime=2026-01-01')
    expect(NWS_DWML_URL).toContain('FcstType=dwml')
    expect(NWS_DWML_URL).toContain('lat=34.1808')
  })

  it('parses a Census ACS table into a live snapshot', () => {
    const snap = parseAcsTable(
      [
        [
          'NAME',
          'B01003_001E',
          'B19013_001E',
          'B17001_002E',
          'B17001_001E',
          'B15003_001E',
          'B15003_022E',
          'B15003_023E',
          'B15003_024E',
          'B15003_025E',
          'B03002_001E',
          'B03002_001M',
          'B03002_012E',
          'B03002_012M',
          'B03002_003E',
          'B03002_003M',
          'B03002_004E',
          'B03002_004M',
          'B03002_005E',
          'B03002_005M',
          'B03002_006E',
          'B03002_006M',
          'B03002_007E',
          'B03002_007M',
          'B03002_008E',
          'B03002_008M',
          'B03002_009E',
          'B03002_009M',
        ],
        [
          'Burbank city, California',
          '105165',
          '95816',
          '7467',
          '105165',
          '1000',
          '300',
          '100',
          '50',
          '50',
          '1000',
          '20',
          '250',
          '10',
          '400',
          '12',
          '50',
          '8',
          '10',
          '5',
          '200',
          '9',
          '5',
          '4',
          '15',
          '6',
          '70',
          '7',
        ],
      ],
      '2026-08-15T00:00:00Z',
    )
    expect(snap.population).toBe(105165)
    expect(snap.provenance.dataClass).toBe('live')
    expect(snap.povertyRate).toBeCloseTo(7467 / 105165, 5)
    expect(snap.bachelorOrHigher).toBeCloseTo(0.5, 5)
    expect(snap.raceEthnicity).toHaveLength(8)
    const hispanic = snap.raceEthnicity?.find((g) => g.id === 'hispanic')
    expect(hispanic?.share).toBeCloseTo(0.25, 5)
    expect(hispanic?.shareMoe).not.toBeNull()
  })

  it('parses AirNow observations', () => {
    const rows = parseAirNow([
      {
        DateObserved: '2026-08-15',
        HourObserved: 8,
        ReportingArea: 'Burbank',
        ParameterName: 'PM2.5',
        AQI: 41,
        Category: { Name: 'Good' },
      },
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0]?.aqi).toBe(41)
    expect(rows[0]?.dataClass).toBe('live')
  })

  it('pivots NOAA GHCND rows by date', () => {
    const days = parseNoaa(
      {
        results: [
          { date: '2026-08-14T00:00:00', datatype: 'TMAX', value: 91 },
          { date: '2026-08-14T00:00:00', datatype: 'TMIN', value: 65 },
          { date: '2026-08-14T00:00:00', datatype: 'PRCP', value: 0 },
        ],
      },
      'GHCND:USW00023152',
    )
    expect(days).toHaveLength(1)
    expect(days[0]?.tmaxF).toBe(91)
    expect(days[0]?.tminF).toBe(65)
  })

  it('filters OpenJustice CSV to Burbank PD annual totals', () => {
    const rows = parseOpenJusticeCsv(
      [
        'Year,County,NCICCode,Violent_sum,Homicide_sum,ForRape_sum,Robbery_sum,AggAssault_sum,Property_sum,Burglary_sum,VehicleTheft_sum,LTtotal_sum',
        '2024,Los Angeles County,Burbank,396,2,12,96,286,3114,347,297,2470',
        '2024,Los Angeles County,Glendale,530,4,34,172,320,3733,372,424,2937',
        '2024,Orange County,Anaheim,1,0,0,0,1,2,0,0,2',
      ].join('\n'),
      '2026-08-15T00:00:00Z',
      'live',
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]?.violent).toBe(396)
    expect(rows[0]?.property).toBe(3114)
    expect(rows[0]?.dataClass).toBe('live')
  })

  it('filters OpenJustice CSV to Glendale PD when requested', () => {
    const rows = parseOpenJusticeCsv(
      [
        'Year,County,NCICCode,Violent_sum,Homicide_sum,ForRape_sum,Robbery_sum,AggAssault_sum,Property_sum,Burglary_sum,VehicleTheft_sum,LTtotal_sum',
        '2024,Los Angeles County,Burbank,396,2,12,96,286,3114,347,297,2470',
        '2024,Los Angeles County,Glendale,530,4,34,172,320,3733,372,424,2937',
      ].join('\n'),
      '2026-08-15T00:00:00Z',
      'live',
      ['Glendale'],
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]?.agency).toBe('Glendale')
    expect(rows[0]?.violent).toBe(530)
    expect(rows[0]?.property).toBe(3733)
  })

  it('filters OpenJustice hate-crime CSV to NCIC 1912 and counts 2024 events', () => {
    const header =
      'RecordId,ClosedYear,MonthOccurrence,County,NCIC,TotalNumberOfVictims,TotalNumberOfSuspects,MostSeriousUcr,MostSeriousLocation,MostSeriousBias,MostSeriousBiasType,WeaponType,Offensive_Act'
    const rows = [
      header,
      'CA24-1,2024,1,19,1912,1,0,Intimidation,Residence,Anti-Black or African American,Race/Ethnicity/Ancestry,,"Verbal slurs"',
      'CA24-2,2024,2,19,1912,1,1,Simple Assault,School,Anti-Black or African American,Race/Ethnicity/Ancestry,"Personal weapons (hands, feet, teeth, etc.)",Other',
      'CA24-3,2024,4,19,1912,1,1,Simple Assault,Other,Anti-Black or African American,Race/Ethnicity/Ancestry,Unknown,Other',
      'CA24-4,2024,5,19,1912,1,1,Simple Assault,Parking Lot,Anti-Other Religion,Religion,Unknown,Verbal slurs',
      'CA24-5,2024,1,19,1912,1,0,Destruction/Damage/Vandalism,Church,Anti-Gay (Male),Sexual Orientation,,Graffiti',
      'CA24-6,2024,2,19,1912,1,1,Aggravated Assault,Grocery,Anti-Black or African American,Race/Ethnicity/Ancestry,"Knife or other cutting or stabbing instrument",Other',
      'CA24-7,2024,8,19,1912,1,0,Destruction/Damage/Vandalism,Residence,Anti-Black or African American,Race/Ethnicity/Ancestry,,Graffiti',
      'CA24-8,2024,10,19,1912,1,2,Intimidation,School,Anti-Black or African American,Race/Ethnicity/Ancestry,Unknown,Verbal slurs',
      'CA24-9,2024,12,19,1912,1,0,Destruction/Damage/Vandalism,Parking Lot,Anti-Gay (Male),Sexual Orientation,,Graffiti',
      'CA23-1,2023,3,19,1912,1,1,Intimidation,Residence,Anti-Jewish,Religion,Unknown,Verbal slurs',
      'CA24-other,2024,1,19,1913,99,99,Intimidation,Residence,Anti-Jewish,Religion,Unknown,Verbal slurs',
      'CA24-state,2024,1,00,0000,500,500,Intimidation,Residence,Anti-Jewish,Religion,Unknown,Verbal slurs',
    ]
    const events = parseHateCrimeCsv(rows.join('\n'), 'snapshot')
    expect(events).toHaveLength(10)
    expect(events.every((e) => e.ncic === '1912')).toBe(true)
    expect(events.every((e) => e.victims !== 99 && e.victims !== 500)).toBe(true)
    const annual = hateCrimeAnnual(events)
    const y2024 = annual.find((r) => r.year === 2024)
    expect(y2024).toEqual({ year: 2024, events: 9, victims: 9, suspects: 6 })
    expect(hateCrimeBiasTypeCounts(events, 2024)).toEqual([
      { biasType: 'Race/Ethnicity/Ancestry', events: 6 },
      { biasType: 'Sexual Orientation', events: 2 },
      { biasType: 'Religion', events: 1 },
    ])
    expect(events.every((e) => e.dataClass === 'snapshot')).toBe(true)
    const jan = events.find((e) => e.id === 'CA24-1')
    expect(jan?.month).toBe(1)
    expect(jan?.mostSeriousLocation).toBe('Residence')
    expect(jan?.weaponType).toBe('')
    expect(jan?.offensiveAct).toBe('Verbal slurs')
    const hands = events.find((e) => e.id === 'CA24-2')
    expect(hands?.weaponType).toBe('Personal weapons (hands, feet, teeth, etc.)')
    expect(hateCrimeMonthCounts(events, 2024).map((r) => [r.month, r.events])).toEqual([
      [1, 2],
      [2, 2],
      [4, 1],
      [5, 1],
      [8, 1],
      [10, 1],
      [12, 1],
    ])
    expect(hateCrimeLocationCounts(events, 2024)).toEqual(
      expect.arrayContaining([
        { label: 'Parking Lot', events: 2 },
        { label: 'Residence', events: 2 },
        { label: 'School', events: 2 },
      ]),
    )
    expect(hateCrimeWeaponCounts(events, 2024)).toEqual([
      { label: HATE_CRIME_BLANK_CELL, events: 4 },
      { label: 'Unknown', events: 3 },
      { label: 'Knife or other cutting or stabbing instrument', events: 1 },
      { label: 'Personal weapons (hands, feet, teeth, etc.)', events: 1 },
    ])
    expect(hateCrimeOffensiveActCounts(events, 2024)[0]).toEqual({ label: 'Graffiti', events: 3 })
  })

  it('parses SWITRS Crashes.csv rows as snapshot collisions', () => {
    const rows = parseSwitrsCsv(
      [
        'CASE_ID,COLLISION_DATE,COLLISION_TIME,COLLISION_SEVERITY,NUMBER_KILLED,NUMBER_INJURED,PRIMARY_RD,SECONDARY_RD,LATITUDE,LONGITUDE,POINT_X,POINT_Y,CITY',
        '82189740,2023-01-05,2010,3,0,1,ALAMEDA AVENUE,GATEWAY,34.1735,-118.3007,-118.3008,34.1734,BURBANK',
        '82189767,2023-01-03,1313,4,0,1,GLENOAKS BOULEVARD,MAGNOLIA BOULEVARD,,, -118.3086,34.1850,BURBANK',
        '999,2023-01-01,800,4,0,1,MAIN,FIRST,34.1,-118.2,-118.2,34.1,GLENDALE',
      ].join('\n'),
      'Crashes.csv',
    )
    expect(rows).toHaveLength(2)
    expect(rows[0]?.id).toBe('82189740')
    expect(rows[0]?.severity).toBe('injury')
    expect(rows[0]?.severityCode).toBe('3')
    expect(rows[0]?.hour).toBe(20)
    expect(rows[0]?.year).toBe(2023)
    expect(rows[0]?.city).toBe('BURBANK')
    expect(rows[0]?.killed).toBe(0)
    expect(rows[0]?.injured).toBe(1)
    expect(rows[0]?.dataClass).toBe('snapshot')
    expect(rows[0]?.geo.lat).toBeCloseTo(34.1735)
    expect(rows[1]?.geo.lat).toBeCloseTo(34.185)
    expect(rows.every((r) => r.dataClass !== 'demonstration')).toBe(true)
    expect(rows.every((r) => r.city === 'BURBANK')).toBe(true)
  })

  it('parses Glendale TIMS rows separately and does not mix cities', () => {
    const header =
      'CASE_ID,ACCIDENT_YEAR,COLLISION_DATE,COLLISION_TIME,DAY_OF_WEEK,COLLISION_SEVERITY,NUMBER_KILLED,NUMBER_INJURED,PRIMARY_RD,SECONDARY_RD,LATITUDE,LONGITUDE,POINT_X,POINT_Y,CITY'
    const burbank = parseSwitrsCsv(
      [header, '1,2023,2023-01-05,2010,4,1,1,0,ALAMEDA,GATEWAY,34.17,-118.30,-118.30,34.17,BURBANK'].join('\n'),
      'Crashes.csv',
      'BURBANK',
    )
    const glendale = parseSwitrsCsv(
      [
        header,
        '1,2023,2023-01-05,2010,4,1,1,0,ALAMEDA,GATEWAY,34.17,-118.30,-118.30,34.17,BURBANK',
        '2,2024,2024-06-01,900,6,4,0,1,BRAND,BROADWAY,34.14,-118.25,-118.25,34.14,GLENDALE',
        '3,2025,2025-03-02,2330,7,2,0,2,GLENOAKS,CHESTER,34.16,-118.24,-118.24,34.16,GLENDALE',
      ].join('\n'),
      'Crashes-Glendale.csv',
      'GLENDALE',
    )
    expect(burbank).toHaveLength(1)
    expect(glendale).toHaveLength(2)
    expect(glendale.every((r) => r.city === 'GLENDALE')).toBe(true)
    expect(glendale.map((r) => r.year).sort()).toEqual([2024, 2025])
    expect(glendale[0]?.alcoholInvolved).toBe(false)
    expect(rollupCollisions(burbank).n + rollupCollisions(glendale).n).toBe(3)
    expect(rollupCollisions(burbank).killed).toBe(1)
    expect(rollupCollisions(glendale).killed).toBe(0)
  })

  it('parses NWS daytime forecast periods', () => {
    const rows = parseForecast({
      properties: {
        periods: [
          { name: 'Saturday', startTime: '2026-08-15T06:00:00-07:00', temperature: 87, shortForecast: 'Sunny', windSpeed: '5 mph', windDirection: 'S', isDaytime: true },
          { name: 'Saturday Night', startTime: '2026-08-15T18:00:00-07:00', temperature: 64, shortForecast: 'Clear', windSpeed: '0 mph', windDirection: 'S', isDaytime: false },
        ],
      },
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]?.temperatureF).toBe(87)
  })

  it('parses USGS GeoJSON features', () => {
    const rows = parseQuakes(
      {
        features: [
          {
            id: 'ci1',
            properties: { mag: 2.6, place: 'Burbank', time: Date.parse('2026-08-12T20:36:29.310Z'), url: 'https://example.test' },
            geometry: { coordinates: [-118.3, 34.18, 5] },
          },
        ],
      },
      'snapshot',
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]?.dataClass).toBe('snapshot')
    expect(rows[0]?.lat).toBeCloseTo(34.18)
  })

  it('parses USGS QuakeML events and converts depth meters to km', () => {
    const xml = `<?xml version="1.0"?>
<q:quakeml xmlns="http://quakeml.org/xmlns/bed/1.2" xmlns:catalog="http://anss.org/xmlns/catalog/0.1" xmlns:q="http://quakeml.org/xmlns/quakeml/1.2">
 <eventParameters>
  <event catalog:eventsource="ci" catalog:eventid="40671466" publicID="quakeml:earthquake.usgs.gov/fdsnws/event/1/query?eventid=ci40671466">
   <description><type>earthquake name</type><text>9 km SW of Valencia, CA</text></description>
   <origin>
    <time><value>2026-08-12T20:56:29.310Z</value></time>
    <longitude><value>-118.62866666667</value></longitude>
    <latitude><value>34.3845</value></latitude>
    <depth><value>4220</value></depth>
   </origin>
   <magnitude>
    <mag><value>2.63</value></mag>
   </magnitude>
  </event>
 </eventParameters>
</q:quakeml>`
    const rows = parseQuakeMl(xml, 'live')
    expect(rows).toHaveLength(1)
    expect(rows[0]?.id).toBe('ci40671466')
    expect(rows[0]?.mag).toBeCloseTo(2.63)
    expect(rows[0]?.depthKm).toBeCloseTo(4.22)
    expect(rows[0]?.dataClass).toBe('live')
    expect(rows[0]?.url).toContain('ci40671466')
  })

  it('treats empty QuakeML eventParameters as a live zero-event catalog', () => {
    const xml =
      '<q:quakeml xmlns:q="http://quakeml.org/xmlns/quakeml/1.2"><eventParameters publicID="q"></eventParameters></q:quakeml>'
    expect(parseQuakeMl(xml)).toEqual([])
  })

  it('parses NWS DWML daytime periods from the 12-hour layout', () => {
    const xml = `<?xml version="1.0"?>
<dwml>
  <data type="forecast">
    <time-layout>
      <layout-key>k-p12h-n4-1</layout-key>
      <start-valid-time period-name="Today">2026-08-17T08:00:00-07:00</start-valid-time>
      <start-valid-time period-name="Tonight">2026-08-17T18:00:00-07:00</start-valid-time>
      <start-valid-time period-name="Tuesday">2026-08-18T06:00:00-07:00</start-valid-time>
      <start-valid-time period-name="Tuesday Night">2026-08-18T18:00:00-07:00</start-valid-time>
    </time-layout>
    <time-layout>
      <layout-key>k-p24h-n2-1</layout-key>
      <start-valid-time period-name="Today">2026-08-17T08:00:00-07:00</start-valid-time>
      <start-valid-time period-name="Tuesday">2026-08-18T06:00:00-07:00</start-valid-time>
    </time-layout>
    <parameters>
      <temperature type="maximum" units="Fahrenheit" time-layout="k-p24h-n2-1">
        <name>Daily Maximum Temperature</name>
        <value>93</value>
        <value>96</value>
      </temperature>
      <weather time-layout="k-p12h-n4-1">
        <weather-conditions weather-summary="Mostly Sunny"/>
        <weather-conditions weather-summary="Partly Cloudy"/>
        <weather-conditions weather-summary="Hot"/>
        <weather-conditions weather-summary="Mostly Clear"/>
      </weather>
      <wordedForecast time-layout="k-p12h-n4-1">
        <text>Mostly sunny, with a high near 93. Light south wind becoming southwest 5 to 10 mph in the afternoon.</text>
        <text>Partly cloudy, with a low around 68.</text>
        <text>Mostly sunny and hot, with a high near 96. Calm wind becoming south around 5 mph.</text>
        <text>Mostly clear.</text>
      </wordedForecast>
    </parameters>
  </data>
</dwml>`
    const rows = parseDwmlForecast(xml)
    expect(rows).toHaveLength(2)
    expect(rows[0]?.name).toBe('Today')
    expect(rows[0]?.temperatureF).toBe(93)
    expect(rows[0]?.shortForecast).toBe('Mostly Sunny')
    expect(rows[0]?.wind).toMatch(/wind/i)
    expect(rows[1]?.name).toBe('Tuesday')
    expect(rows[1]?.temperatureF).toBe(96)
    expect(rows[1]?.shortForecast).toBe('Hot')
  })

  it('sums FBI CDE monthly actuals to calendar years', () => {
    const years = parseFbiCdeActualsByYear({
      offenses: {
        actuals: {
          'Burbank Police Department Offenses': { '01-2023': 20, '02-2023': 10, '01-2024': 5 },
          'Burbank Police Department Clearances': { '01-2023': 1 },
        },
      },
    })
    expect(years[2023]).toBe(30)
    expect(years[2024]).toBe(5)
  })

  it('counts FBI CDE months with numeric actuals', () => {
    const coverage = parseFbiCdeYearCoverage({
      offenses: {
        actuals: {
          'Glendale Police Department Offenses': {
            '01-2021': 0,
            '12-2021': 0,
            '01-2022': 20,
            '02-2022': 10,
          },
        },
      },
    })
    expect(coverage.months[2021]).toBe(2)
    expect(coverage.totals[2021]).toBe(0)
    expect(coverage.months[2022]).toBe(2)
    expect(coverage.totals[2022]).toBe(30)
  })

  it('parses an OpenGov Annual Departments snapshot', () => {
    const snap = parseOpenGovAnnualCsv(
      [
        '"Burbank"',
        '"Annual - Departments"',
        '"Download generated on 08/17/2026"',
        '',
        '"","2023-24 Budget","June 2023-24 Actual","2025-26 Budget","May 2025-26 Actual","2026-27 Budget"',
        '"Police"," 10,000"," 9,000"," 12,000"," 8,000"," 11,000"',
        '"Fire"," 5,000"," 4,000"," 6,000"," 5,000"," 7,000"',
        '"Total"," 15,000"," 13,000"," 18,000"," 13,000"," 18,000"',
      ].join('\n'),
      'Burbank Data Snapshot.csv',
    )
    expect(snap.city).toBe('Burbank')
    expect(snap.report).toBe('Annual - Departments')
    expect(snap.generatedOn).toBe('2026-08-17')
    expect(snap.dataClass).toBe('snapshot')
    expect(snap.periods.map((p) => p.kind)).toEqual(['budget', 'actual', 'budget', 'actual', 'budget'])
    expect(snap.periods[1]?.asOfMonth).toBe('June')
    expect(snap.periods[3]?.asOfMonth).toBe('May')
    expect(latestBudgetPeriod(snap)?.label).toBe('2026-27 Budget')
    expect(ytdActualPeriod(snap)?.label).toBe('May 2025-26 Actual')
    expect(citywideBudgetVsActual(snap)).toEqual([{ label: '2023-24', budget: 15000, actual: 13000 }])
    expect(departmentChartRows(snap, '2026-27 Budget')[0]).toEqual({ label: 'Police', value: 11000 })
  })

  it('parses the local Burbank OpenGov Annual Departments CSV', () => {
    const file = path.join(process.cwd(), 'Burbank Data Snapshot.csv')
    expect(existsSync(file)).toBe(true)
    const snap = parseOpenGovAnnualCsv(readFileSync(file, 'utf8'), 'Burbank Data Snapshot.csv')
    expect(snap.departments.filter((d) => !d.isTotal)).toHaveLength(16)
    expect(snap.periods).toHaveLength(7)
    expect(latestBudgetPeriod(snap)?.label).toBe('2026-27 Budget')
    const total = snap.departments.find((d) => d.isTotal)
    expect(total?.amounts['2026-27 Budget']).toBe(1_011_663_440)
    expect(total?.amounts['June 2024-25 Actual (Audited)']).toBe(723_522_747)
    const police = snap.departments.find((d) => d.department === 'Police')
    expect(police?.amounts['2026-27 Budget']).toBe(79_592_692)
    expect(citywideBudgetVsActual(snap).map((r) => r.label)).toEqual(['2023-24', '2024-25'])
  })

  it('rolls up an OpenGov Accounts Payable listing', () => {
    const snap = parseOpenGovPaymentsCsv(
      [
        '"Burbank"',
        '"Accounts Payable Transactions"',
        '"Download generated on 08/17/2026"',
        '"https://burbankca.opengov.com/data/#/1296"',
        '',
        'Vendor Name,Payment Number,Payment Date,Invoice Number,Description,Invoice Amount,Purchase Order Number',
        'CALPERS,CK:1,2025-08-15,INV1,RETIREMENT,100.5,',
        'CALPERS,CK:2,2025-09-01,INV2,RETIREMENT,50,',
        'US BANK,CK:3,2025-08-20,INV3,CARD,-10,',
      ].join('\n'),
      'OpenGov-Accounts-Payable.csv',
    )
    expect(snap.count).toBe(3)
    expect(snap.total).toBeCloseTo(140.5)
    expect(snap.dateStart).toBe('2025-08-15')
    expect(snap.dateEnd).toBe('2025-09-01')
    expect(snap.topVendors[0]).toEqual({ vendor: 'CALPERS', amount: 150.5, count: 2 })
    expect(snap.byMonth).toEqual([
      { month: '2025-08', amount: 90.5, count: 2 },
      { month: '2025-09', amount: 50, count: 1 },
    ])
    expect(snap.dataClass).toBe('snapshot')
  })

  it('parses the local OpenGov Accounts Payable CSV', () => {
    const file = path.join(process.cwd(), 'OpenGov-Accounts-Payable.csv')
    expect(existsSync(file)).toBe(true)
    const snap = parseOpenGovPaymentsCsv(readFileSync(file, 'utf8'), 'OpenGov-Accounts-Payable.csv')
    expect(snap.count).toBe(17034)
    expect(snap.total).toBeCloseTo(534739370.31, 2)
    expect(snap.dateStart).toBe('2025-08-01')
    expect(snap.dateEnd).toBe('2026-07-31')
    expect(snap.topVendors[0]?.vendor).toBe('CALPERS')
  })
})
