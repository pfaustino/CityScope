import { parseCsv } from './csv.ts'
import { makeProvenance } from './provenance.ts'
import type { OpenGovAnnualSnapshot, OpenGovDepartmentRow, OpenGovPaymentRollup, OpenGovPeriod, Provenance, Warehouse } from './types.ts'

export const OPENGOV_DEFAULT_FILE = 'Burbank Data Snapshot.csv'
export const OPENGOV_ALT_FILE = 'OpenGov-Annual-Departments.csv'
export const OPENGOV_AP_FILE = 'OpenGov-Accounts-Payable.csv'
export const OPENGOV_AP_URL = 'https://burbankca.opengov.com/data/#/1296'
export const OPENGOV_AP_TOP_VENDORS = 20
export const OPENGOV_AP_MAX_ROWS = 25000

export const OPENGOV_LIMITATIONS = [
  'Official OpenGov Annual — Departments export — not demonstration data.',
  'This is an all-funds department rollup, not a vendor check register or contracts file.',
  'Burbank Water and Power is an enterprise utility and is a large share of the all-funds total.',
  'May actuals are year-to-date through May, not a full fiscal year.',
  'City of Burbank’s fiscal year runs July–June; column labels come from OpenGov.',
  'Correlation is not causation.',
]

export const OPENGOV_AP_LIMITATIONS = [
  'Official OpenGov Accounts Payable Transactions listing — not demonstration data.',
  'This is a vendor payment / invoice listing, not a contracts file and not a department budget.',
  'The listing has no department column.',
  'Payment dates in this extract run from 2025-08-01 through 2026-07-31.',
  'This extract has no payments dated June 2026. Rows without a Payment Date (OpenGov report footer text) are omitted.',
  'Negative invoice amounts are refunds or adjustments as published, not missing zeros.',
  'Large vendors include payroll, retirement, and utility payments. A large total is not a finding of waste or fraud.',
  'Correlation is not causation.',
]

const MONTHS =
  'January|February|March|April|May|June|July|August|September|October|November|December'

const MAX_ROWS = 64
const MAX_PERIODS = 24

export function parseOpenGovAnnualCsv(text: string, fileName: string): OpenGovAnnualSnapshot {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''))
  let city = 'Burbank'
  let report = 'Annual'
  let generatedOn: string | null = null
  let headerIndex = -1
  const scan = Math.min(rows.length, MAX_ROWS)
  for (let i = 0; i < scan; i += 1) {
    const row = rows[i]
    if (!row) continue
    const first = (row[0] ?? '').trim()
    if (row.length === 1 || row.slice(1).every((c) => c.trim() === '')) {
      if (/^download generated on\s+/i.test(first)) {
        generatedOn = parseGeneratedOn(first)
        continue
      }
      if (i === 0 && first) city = first
      else if (first) report = first
      continue
    }
    if (looksLikeHeader(row)) {
      headerIndex = i
      break
    }
  }
  if (headerIndex < 0) {
    throw new Error(`OpenGov CSV ${fileName} has no department/period header row`)
  }
  const header = rows[headerIndex] ?? []
  const periods: OpenGovPeriod[] = []
  const periodCap = Math.min(header.length, MAX_PERIODS + 1)
  for (let c = 1; c < periodCap; c += 1) {
    const label = (header[c] ?? '').trim()
    if (!label) continue
    const period = parsePeriodLabel(label)
    if (!period) {
      throw new Error(`OpenGov CSV ${fileName} has an unrecognized column: ${label}`)
    }
    periods.push(period)
  }
  if (periods.length === 0) {
    throw new Error(`OpenGov CSV ${fileName} has no period columns`)
  }

  const departments: OpenGovDepartmentRow[] = []
  const bodyEnd = Math.min(rows.length, headerIndex + 1 + MAX_ROWS)
  for (let i = headerIndex + 1; i < bodyEnd; i += 1) {
    const row = rows[i]
    if (!row) continue
    const department = (row[0] ?? '').trim()
    if (!department) continue
    const amounts: Record<string, number> = {}
    for (const period of periods) {
      const col = header.indexOf(period.label)
      const parsed = parseMoney(row[col] ?? '')
      if (parsed === null) {
        throw new Error(`OpenGov CSV ${fileName} has a non-numeric amount for ${department} / ${period.label}`)
      }
      amounts[period.label] = parsed
    }
    departments.push({
      department,
      amounts,
      isTotal: /^total$/i.test(department),
    })
  }
  if (departments.filter((d) => !d.isTotal).length === 0) {
    throw new Error(`OpenGov CSV ${fileName} has no department rows`)
  }

  return {
    city,
    report,
    generatedOn,
    fileName,
    periods,
    departments,
    dataClass: 'snapshot',
  }
}

export function departmentRows(snap: OpenGovAnnualSnapshot): OpenGovDepartmentRow[] {
  return snap.departments.filter((d) => !d.isTotal)
}

export function totalRow(snap: OpenGovAnnualSnapshot): OpenGovDepartmentRow | undefined {
  return snap.departments.find((d) => d.isTotal)
}

export function latestBudgetPeriod(snap: OpenGovAnnualSnapshot): OpenGovPeriod | undefined {
  const budgets = snap.periods.filter((p) => p.kind === 'budget')
  return budgets.at(-1)
}

export function completedActualPeriods(snap: OpenGovAnnualSnapshot): OpenGovPeriod[] {
  return snap.periods.filter((p) => p.kind === 'actual' && p.asOfMonth === 'June')
}

export function ytdActualPeriod(snap: OpenGovAnnualSnapshot): OpenGovPeriod | undefined {
  return snap.periods.filter((p) => p.kind === 'actual' && p.asOfMonth !== 'June').at(-1)
}

export function budgetForFiscalYear(snap: OpenGovAnnualSnapshot, fiscalYear: string): OpenGovPeriod | undefined {
  return snap.periods.find((p) => p.kind === 'budget' && p.fiscalYear === fiscalYear)
}

export function departmentChartRows(
  snap: OpenGovAnnualSnapshot,
  periodLabel: string,
  opts?: { exclude?: string[] },
): { label: string; value: number }[] {
  const skip = new Set(opts?.exclude ?? [])
  return departmentRows(snap)
    .filter((d) => !skip.has(d.department))
    .map((d) => ({ label: d.department, value: d.amounts[periodLabel] ?? 0 }))
    .sort((a, b) => b.value - a.value)
}

export function citywideBudgetVsActual(snap: OpenGovAnnualSnapshot): {
  label: string
  budget: number
  actual: number
}[] {
  const total = totalRow(snap)
  if (!total) return []
  const out: { label: string; budget: number; actual: number }[] = []
  for (const actual of completedActualPeriods(snap)) {
    const budget = budgetForFiscalYear(snap, actual.fiscalYear)
    if (!budget) continue
    const b = total.amounts[budget.label]
    const a = total.amounts[actual.label]
    if (b == null || a == null) continue
    out.push({ label: actual.fiscalYear, budget: b, actual: a })
  }
  return out
}

export function formatUsdCompact(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export function openGovProvenance(wh: Warehouse, snap: OpenGovAnnualSnapshot): Provenance {
  const latest = latestBudgetPeriod(snap)
  const total = latest ? (totalRow(snap)?.amounts[latest.label] ?? 0) : 0
  return makeProvenance({
    label: latest ? `${latest.label} (all funds)` : 'OpenGov Annual — Departments',
    value: total,
    unit: 'USD',
    sourceId: 'burbank-opengov',
    dataset: `${snap.report} (${snap.fileName})`,
    retrievedAt: snap.generatedOn ? `${snap.generatedOn}T12:00:00-07:00` : wh.generatedAt,
    query: { report: snap.report, city: snap.city, file: snap.fileName },
    geographicFilter: 'City of Burbank, California',
    timePeriod: fiscalTimePeriod(latest?.fiscalYear ?? snap.periods[0]?.fiscalYear ?? '2026-27'),
    transformation: 'Direct OpenGov Annual — Departments export; no re-aggregation',
    claimType: 'fact',
    dataClass: snap.dataClass,
    limitations: OPENGOV_LIMITATIONS,
  })
}

export function fiscalTimePeriod(fiscalYear: string): { start: string; end: string } {
  const startYear = Number(fiscalYear.slice(0, 4))
  if (!Number.isFinite(startYear)) {
    return { start: '2023-07-01', end: '2027-06-30' }
  }
  return { start: `${startYear}-07-01`, end: `${startYear + 1}-06-30` }
}

export function parseOpenGovPaymentsCsv(text: string, fileName: string): OpenGovPaymentRollup {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''))
  let generatedOn: string | null = null
  let sourceUrl = OPENGOV_AP_URL
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
    if (/^https:\/\/burbankca\.opengov\.com\//i.test(first)) {
      sourceUrl = first
      continue
    }
    if (looksLikePaymentHeader(row)) {
      headerIndex = i
      break
    }
  }
  if (headerIndex < 0) {
    throw new Error(`OpenGov AP CSV ${fileName} has no Vendor Name / Payment Date header`)
  }
  const header = rows[headerIndex] ?? []
  const vendorCol = colIndex(header, 'Vendor Name')
  const dateCol = colIndex(header, 'Payment Date')
  const amountCol = colIndex(header, 'Invoice Amount', 'Invoice Amount ($)')
  if (vendorCol < 0 || dateCol < 0 || amountCol < 0) {
    throw new Error(`OpenGov AP CSV ${fileName} is missing Vendor Name, Payment Date, or Invoice Amount`)
  }

  const byVendor = new Map<string, { amount: number; count: number }>()
  const byMonth = new Map<string, { amount: number; count: number }>()
  let total = 0
  let count = 0
  let dateStart: string | null = null
  let dateEnd: string | null = null
  const bodyEnd = Math.min(rows.length, headerIndex + 1 + OPENGOV_AP_MAX_ROWS)
  for (let i = headerIndex + 1; i < bodyEnd; i += 1) {
    const row = rows[i]
    if (!row) continue
    const vendor = (row[vendorCol] ?? '').trim()
    const date = (row[dateCol] ?? '').trim()
    const amount = parseMoney(row[amountCol] ?? '')
    if (!vendor || !/^\d{4}-\d{2}-\d{2}$/.test(date) || amount === null) continue
    count += 1
    total += amount
    if (!dateStart || date < dateStart) dateStart = date
    if (!dateEnd || date > dateEnd) dateEnd = date
    const month = date.slice(0, 7)
    const vendorRow = byVendor.get(vendor) ?? { amount: 0, count: 0 }
    vendorRow.amount += amount
    vendorRow.count += 1
    byVendor.set(vendor, vendorRow)
    const monthRow = byMonth.get(month) ?? { amount: 0, count: 0 }
    monthRow.amount += amount
    monthRow.count += 1
    byMonth.set(month, monthRow)
  }
  if (count === 0) {
    throw new Error(`OpenGov AP CSV ${fileName} has no payment rows`)
  }

  const topVendors = [...byVendor.entries()]
    .map(([vendor, row]) => ({ vendor, amount: row.amount, count: row.count }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, OPENGOV_AP_TOP_VENDORS)

  return {
    fileName,
    report: 'Accounts Payable Transactions',
    generatedOn,
    sourceUrl,
    count,
    total,
    dateStart,
    dateEnd,
    byMonth: [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, row]) => ({ month, amount: row.amount, count: row.count })),
    topVendors,
    dataClass: 'snapshot',
  }
}

export function openGovPaymentsProvenance(wh: Warehouse, snap: OpenGovPaymentRollup): Provenance {
  return makeProvenance({
    label: 'Accounts Payable invoice total',
    value: snap.total,
    unit: 'USD',
    sourceId: 'burbank-opengov',
    dataset: `${snap.report} (${snap.fileName})`,
    retrievedAt: snap.generatedOn ? `${snap.generatedOn}T12:00:00-07:00` : wh.generatedAt,
    query: { report: snap.report, file: snap.fileName, url: snap.sourceUrl },
    geographicFilter: 'City of Burbank, California',
    timePeriod: {
      start: snap.dateStart ?? '2025-08-01',
      end: snap.dateEnd ?? '2026-07-31',
    },
    transformation: `Sum of Invoice Amount over ${snap.count} payment rows; top ${OPENGOV_AP_TOP_VENDORS} vendors by amount`,
    claimType: 'fact',
    dataClass: snap.dataClass,
    limitations: OPENGOV_AP_LIMITATIONS,
  })
}

function looksLikeHeader(row: string[]): boolean {
  const rest = row.slice(1).map((c) => c.trim()).filter(Boolean)
  if (rest.length < 2) return false
  return rest.every((cell) => parsePeriodLabel(cell) !== null)
}

function parsePeriodLabel(label: string): OpenGovPeriod | null {
  const audited = /\(\s*Audited\s*\)/i.test(label)
  const cleaned = label.replace(/\(\s*Audited\s*\)/gi, '').replace(/\s+/g, ' ').trim()
  const actual = new RegExp(`^(${MONTHS})\\s+(\\d{4}-\\d{2})\\s+Actual$`, 'i').exec(cleaned)
  if (actual?.[1] && actual[2]) {
    return {
      label,
      fiscalYear: actual[2],
      kind: 'actual',
      asOfMonth: titleCaseMonth(actual[1]),
      audited,
    }
  }
  const budget = /^(\d{4}-\d{2})\s+Budget$/i.exec(cleaned)
  if (budget?.[1]) {
    return { label, fiscalYear: budget[1], kind: 'budget', asOfMonth: null, audited: false }
  }
  return null
}

function titleCaseMonth(month: string): string {
  return month.charAt(0).toUpperCase() + month.slice(1).toLowerCase()
}

function parseGeneratedOn(cell: string): string | null {
  const m = /download generated on\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/i.exec(cell)
  if (!m?.[1] || !m[2] || !m[3]) return null
  const month = m[1].padStart(2, '0')
  const day = m[2].padStart(2, '0')
  return `${m[3]}-${month}-${day}`
}

function parseMoney(cell: string): number | null {
  const t = cell.replace(/,/g, '').replace(/\$/g, '').trim()
  if (!t) return null
  const n = Number(t)
  if (!Number.isFinite(n)) return null
  return n
}

function looksLikePaymentHeader(row: string[]): boolean {
  const joined = row.map((c) => c.trim().toLowerCase())
  return joined.includes('vendor name') && joined.some((c) => c === 'payment date') && joined.some((c) => c.startsWith('invoice amount'))
}

function colIndex(header: string[], ...names: string[]): number {
  const want = names.map((n) => n.trim().toLowerCase())
  return header.findIndex((cell) => want.includes(cell.trim().toLowerCase()))
}
