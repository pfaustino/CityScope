import { writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const SEARCH = 'https://ccpa.burbankca.gov/PublicAccess/cq-search/index.html'
const QUERY_ID = 172
const START_YEAR = 2024

function csvCell(value) {
  const s = value == null ? '' : String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replaceAll('"', '""')}"`
  return s
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function todayUs() {
  const d = new Date()
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`
}

const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(SEARCH, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('#obpa_query')

const end = todayUs()
const years = []
for (let year = START_YEAR; year <= new Date().getFullYear(); year += 1) {
  years.push({
    from: `01/01/${year}`,
    to: year === new Date().getFullYear() ? end : `12/31/${year}`,
  })
}

const parts = await page.evaluate(async ({ years: ranges, queryId }) => {
  async function search(from, to) {
    const res = await fetch('../api/CustomQuery/KeywordSearch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        QueryID: queryId,
        Keywords: [
          { ID: 135, Value: '', KeywordOperator: '=' },
          { ID: 137, Value: '', KeywordOperator: '=' },
          { ID: 138, Value: '', KeywordOperator: '=' },
          { ID: 139, Value: '', KeywordOperator: '=' },
          { ID: 142, Value: '', KeywordOperator: '=' },
          { ID: 143, Value: from, KeywordOperator: '>=' },
          { ID: 143, Value: to, KeywordOperator: '<=' },
        ],
        QueryLimit: 0,
      }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${from}-${to}`)
    const data = await res.json()
    return {
      from,
      to,
      truncated: Boolean(data.Truncated),
      rows: (data.Data || []).map((r) => {
        const c = r.DisplayColumnValues || []
        return {
          streetNo: (c[0] && c[0].Value) || '',
          streetDir: (c[1] && c[1].Value) || '',
          streetName: (c[2] && c[2].Value) || '',
          permitNo: (c[3] && c[3].Value) || '',
          permitType: String((c[4] && c[4].Value) || '').replace(/&amp;/g, '&'),
          issuedOn: (c[5] && c[5].Value) || '',
        }
      }),
    }
  }
  const out = []
  for (const range of ranges) out.push(await search(range.from, range.to))
  return out
}, { years, queryId: QUERY_ID })

await browser.close()

const seen = new Set()
const rows = []
for (const part of parts) {
  if (part.truncated) {
    throw new Error(`OnBase truncated ${part.from}–${part.to} (${part.rows.length} rows)`)
  }
  for (const row of part.rows) {
    const key = `${row.permitNo}|${row.issuedOn}`
    if (!row.permitNo || !row.issuedOn || seen.has(key)) continue
    seen.add(key)
    rows.push(row)
  }
}

const generated = `${pad(new Date().getMonth() + 1)}/${pad(new Date().getDate())}/${new Date().getFullYear()}`
const lines = [
  '"Burbank"',
  '"Building Documents"',
  `"Download generated on ${generated}"`,
  `"${SEARCH}"`,
  '',
  'Street No,Street Direction,Street Name,Permit No,Permit Type,Date Issued',
]
for (const row of rows) {
  lines.push(
    [row.streetNo, row.streetDir, row.streetName, row.permitNo, row.permitType, row.issuedOn]
      .map(csvCell)
      .join(','),
  )
}
writeFileSync('OnBase-Building-Permits.csv', `${lines.join('\n')}\n`, 'utf8')
console.log(`wrote ${rows.length} rows`)
