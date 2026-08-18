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
    status: 'unavailable',
    headline: 'Access Status: Portal public — issued listing, not valuation',
    detail:
      'OnBase Building Documents search results are parsed from a local extract. That listing is issued permits (number, type, date, street). It is not a valuation file and not the Burbank Online Permits applicant portal.',
    howToObtain:
      'Search Type Building Documents at https://ccpa.burbankca.gov/PublicAccess/cq-search/index.html. City page: https://www.burbankca.gov/web/city-clerks-office/public-records-portal. Refresh with node scripts/fetch-onbase-permits.mjs.',
    portals: [
      { name: 'Public Records Portal', url: 'https://www.burbankca.gov/web/city-clerks-office/public-records-portal' },
      { name: 'OnBase Building Documents search', url: 'https://ccpa.burbankca.gov/PublicAccess/cq-search/index.html' },
      { name: 'Burbank Online Permits (applicant portal)', url: 'https://permit.burbankca.gov/bop/onlineLogon.do' },
    ],
  },
  {
    domain: 'spending',
    status: 'unavailable',
    headline: 'Access Status: Portal public — no structured API yet',
    detail: 'OpenGov Annual — Departments and Accounts Payable Transactions are parsed from local exports. Those files are not a contracts register.',
    howToObtain: 'Annual: Share → Spreadsheet at https://burbankca.opengov.com/transparency. AP listing: https://burbankca.opengov.com/data/#/1296. Refresh AP with node scripts/fetch-opengov-ap.mjs.',
    portals: [
      { name: 'Burbank OpenGov', url: 'https://burbankca.opengov.com/transparency' },
      { name: 'Accounts Payable Transactions', url: 'https://burbankca.opengov.com/data/#/1296' },
    ],
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
