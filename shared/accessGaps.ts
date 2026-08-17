import type { AccessGap } from './types.ts'

export const ACCESS_GAPS: AccessGap[] = [
  {
    domain: 'crime',
    status: 'needs_cpra',
    headline: 'Access Status: Restricted — no public incident feed',
    detail:
      'Incident-level Burbank PD records are not published as a bulk API. Annual agency totals and reported hate-crime events from CA DOJ OpenJustice are shown separately and are not a substitute for incident maps or monthly counts.',
    howToObtain:
      'Annual agency totals: FBI Crime Data Explorer (ORI CA0191200) after an api.data.gov key, or CA DOJ OpenJustice crimes-and-clearances tables. Incident-level extracts: CPRA request to Burbank PD. Do not treat third-party crime-map scrapes as official.',
    portals: [
      { name: 'FBI Crime Data Explorer', url: 'https://cde.ucr.cjis.gov/' },
      { name: 'CA DOJ OpenJustice', url: 'https://openjustice.doj.ca.gov/exploration/crime-statistics' },
      { name: 'Burbank Police Department', url: 'https://www.burbankca.gov/departments/police' },
      { name: 'api.data.gov key (for FBI CDE API)', url: 'https://api.data.gov/signup/' },
    ],
  },
  {
    domain: 'business',
    status: 'needs_registration',
    headline: 'Access Status: Needs registration / extract',
    detail: 'No machine-readable Burbank business-license bulk feed is connected. CityScope will not display fabricated license counts.',
    howToObtain: 'Request a public extract from City of Burbank Finance / Business License, or document a stable open search API if one is published.',
    portals: [{ name: 'City of Burbank', url: 'https://www.burbankca.gov/' }],
  },
  {
    domain: 'permits',
    status: 'needs_registration',
    headline: 'Access Status: Needs registration / extract',
    detail: 'Burbank Online Permits is an applicant portal, not a public bulk dataset. No demonstration permits are shown.',
    howToObtain: 'Register at the city permit portal for individual lookups, or request a bulk CSV from Community Development.',
    portals: [
      { name: 'Burbank Online Permits', url: 'https://permit.burbankca.gov/bop/onlineLogon.do' },
      { name: 'Building Permits', url: 'https://www.burbankca.gov/web/community-development/building-permits' },
    ],
  },
  {
    domain: 'spending',
    status: 'unavailable',
    headline: 'Access Status: Portal public — no structured API yet',
    detail: 'OpenGov is publicly browsable. CityScope has not parsed a bulk export, so no expenditure totals are shown.',
    howToObtain: 'Download or parse a structured export from the OpenGov transparency portal, or request a check register from Finance.',
    portals: [{ name: 'Burbank OpenGov', url: 'https://burbankca.opengov.com/transparency' }],
  },
  {
    domain: 'collisions',
    status: 'needs_registration',
    headline: 'Access Status: Needs TIMS registration',
    detail: 'SWITRS/TIMS collision records require a free UC Berkeley TIMS account. No demonstration collisions are shown.',
    howToObtain: 'Create a TIMS account and export Burbank rows. California CCRS crash files on data.ca.gov are statewide and need a Burbank filter before use.',
    portals: [
      { name: 'UC Berkeley TIMS', url: 'https://tims.berkeley.edu/' },
      { name: 'California CCRS (data.ca.gov)', url: 'https://data.ca.gov/dataset/ccrs' },
    ],
  },
  {
    domain: 'airport',
    status: 'unavailable',
    headline: 'Access Status: No structured passenger feed',
    detail: 'Hollywood Burbank Airport publishes statistics as reports, not a bulk API. No demonstration passenger counts are shown.',
    howToObtain: 'Parse official BUR traffic reports or BTS T-100 when a stable file URL is identified.',
    portals: [{ name: 'Hollywood Burbank Airport', url: 'https://hollywoodburbankairport.com/' }],
  },
]

export function gapFor(domain: string): AccessGap | undefined {
  return ACCESS_GAPS.find((g) => g.domain === domain)
}
