import { parseCsv } from './csv.ts'
import { makeProvenance } from './provenance.ts'
import type { OnBasePermitRow, OnBasePermitSnapshot, Provenance, Warehouse } from './types.ts'

export const ONBASE_PERMIT_FILE = 'OnBase-Building-Permits.csv'
export const ONBASE_SEARCH_URL = 'https://ccpa.burbankca.gov/PublicAccess/cq-search/index.html'
export const ONBASE_PORTAL_URL = 'https://www.burbankca.gov/web/city-clerks-office/public-records-portal'
export const ONBASE_API_URL = 'https://ccpa.burbankca.gov/PublicAccess/api/CustomQuery/KeywordSearch'
export const ONBASE_QUERY_ID = 172
export const ONBASE_OVERLAY_ROWS = 200
export const ONBASE_MAX_ROWS = 40000

export const ONBASE_LIMITATIONS = [
  'Official City of Burbank OnBase Building Documents search results — not demonstration data.',
  'This is an issued-permit listing from the public records portal, not the Burbank Online Permits applicant system.',
  'The listing has no valuation, applicant, contractor, inspection status, or coordinates.',
  'Date Issued is the listing date, not an application-submitted date.',
  'Addresses are street number, direction, and name as published. They are not geocoded.',
  'Permit PDFs behind each result are not downloaded.',
  'This extract covers issued dates from 2024-01-02 through 2026-07-28 (query through 2026-08-17).',
  'Correlation is not causation.',
]

export function parseOnBasePermitsCsv(text: string, fileName: string): OnBasePermitSnapshot {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''))
  let generatedOn: string | null = null
  let sourceUrl = ONBASE_SEARCH_URL
  let headerIndex = -1
  const scan = Math.min(rows.length, 16)
  for (let i = 0; i < scan; i += 1) {
    const row = rows[i]
    if (!row) continue
    const first = (row[0] ?? '').trim()
    if (/^download generated on\s+/i.test(first)) {
      generatedOn = parseGeneratedOn(first)
      continue
    }
    if (/^https:\/\/(ccpa|www)\.burbankca\.gov\//i.test(first)) {
      sourceUrl = first
      continue
    }
    if (looksLikePermitHeader(row)) {
      headerIndex = i
      break
    }
  }
  if (headerIndex < 0) {
    throw new Error(`OnBase permits CSV ${fileName} has no Permit No / Date Issued header`)
  }
  const header = rows[headerIndex] ?? []
  const streetNoCol = colIndex(header, 'Street No', 'Street No.')
  const streetDirCol = colIndex(header, 'Street Direction')
  const streetNameCol = colIndex(header, 'Street Name')
  const permitCol = colIndex(header, 'Permit No', 'Permit No.')
  const typeCol = colIndex(header, 'Permit Type')
  const dateCol = colIndex(header, 'Date Issued')
  if (permitCol < 0 || dateCol < 0 || typeCol < 0) {
    throw new Error(`OnBase permits CSV ${fileName} is missing Permit No, Permit Type, or Date Issued`)
  }

  const seen = new Set<string>()
  const parsed: OnBasePermitRow[] = []
  const byMonth = new Map<string, number>()
  const byType = new Map<string, number>()
  let dateStart: string | null = null
  let dateEnd: string | null = null
  const bodyEnd = Math.min(rows.length, headerIndex + 1 + ONBASE_MAX_ROWS)
  for (let i = headerIndex + 1; i < bodyEnd; i += 1) {
    const row = rows[i]
    if (!row) continue
    const permitNo = (row[permitCol] ?? '').trim()
    const issuedOn = parseUsDate(row[dateCol] ?? '')
    const permitType = decodeHtml((row[typeCol] ?? '').trim())
    if (!permitNo || !issuedOn || !permitType) continue
    const key = `${permitNo}|${issuedOn}`
    if (seen.has(key)) continue
    seen.add(key)
    const next: OnBasePermitRow = {
      permitNo,
      streetNo: streetNoCol < 0 ? '' : (row[streetNoCol] ?? '').trim(),
      streetDirection: streetDirCol < 0 ? '' : (row[streetDirCol] ?? '').trim(),
      streetName: streetNameCol < 0 ? '' : (row[streetNameCol] ?? '').trim(),
      permitType,
      issuedOn,
    }
    parsed.push(next)
    if (!dateStart || issuedOn < dateStart) dateStart = issuedOn
    if (!dateEnd || issuedOn > dateEnd) dateEnd = issuedOn
    const month = issuedOn.slice(0, 7)
    byMonth.set(month, (byMonth.get(month) ?? 0) + 1)
    byType.set(permitType, (byType.get(permitType) ?? 0) + 1)
  }
  if (parsed.length === 0) {
    throw new Error(`OnBase permits CSV ${fileName} has no permit rows`)
  }

  parsed.sort((a, b) => b.issuedOn.localeCompare(a.issuedOn) || a.permitNo.localeCompare(b.permitNo))

  return {
    fileName,
    report: 'Building Documents',
    generatedOn,
    sourceUrl,
    count: parsed.length,
    dateStart,
    dateEnd,
    byMonth: [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count })),
    byType: [...byType.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type)),
    rows: parsed,
    dataClass: 'snapshot',
  }
}

export function permitListingForOverlay(snap: OnBasePermitSnapshot): OnBasePermitSnapshot {
  return { ...snap, rows: snap.rows.slice(0, ONBASE_OVERLAY_ROWS) }
}

export function formatPermitAddress(row: OnBasePermitRow): string {
  return [row.streetNo, row.streetDirection, row.streetName].filter(Boolean).join(' ')
}

export function onBasePermitProvenance(wh: Warehouse, snap: OnBasePermitSnapshot): Provenance {
  return makeProvenance({
    label: 'Issued building permits in this extract',
    value: snap.count,
    sourceId: 'burbank-permits',
    dataset: `${snap.report} (${snap.fileName})`,
    retrievedAt: snap.generatedOn ? `${snap.generatedOn}T12:00:00-07:00` : wh.generatedAt,
    query: { report: snap.report, file: snap.fileName, url: snap.sourceUrl, queryId: String(ONBASE_QUERY_ID) },
    geographicFilter: 'City of Burbank, California',
    timePeriod: {
      start: snap.dateStart ?? '2024-01-01',
      end: snap.dateEnd ?? '2026-07-28',
    },
    transformation: `Count of unique Permit No + Date Issued rows from the OnBase Building Documents custom query`,
    claimType: 'fact',
    dataClass: snap.dataClass,
    limitations: ONBASE_LIMITATIONS,
  })
}

function looksLikePermitHeader(row: string[]): boolean {
  const joined = row.map((c) => c.trim().toLowerCase())
  return joined.some((c) => c === 'permit no' || c === 'permit no.') && joined.some((c) => c === 'date issued')
}

function colIndex(header: string[], ...names: string[]): number {
  const want = names.map((n) => n.trim().toLowerCase())
  return header.findIndex((cell) => want.includes(cell.trim().toLowerCase()))
}

function parseUsDate(cell: string): string | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(cell.trim())
  if (!m?.[1] || !m[2] || !m[3]) return null
  return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`
}

function parseGeneratedOn(cell: string): string | null {
  const m = /download generated on\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/i.exec(cell)
  if (!m?.[1] || !m[2] || !m[3]) return null
  return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`
}

function decodeHtml(value: string): string {
  return value.replace(/&amp;/gi, '&').replace(/&nbsp;/gi, ' ').trim()
}
