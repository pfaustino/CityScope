import { writeFileSync } from 'node:fs'

const UUID = '58e8adbd-5de7-4eec-8adb-ed4ed440668c'
const URL = `https://burbankca.opengov.com/api/transactions/v2/query/${UUID}`
const PAGE = 1000
const MAX_PAGES = 40

function csvCell(value) {
  const s = value == null ? '' : String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replaceAll('"', '""')}"`
  return s
}

const all = []
for (let page = 0; page < MAX_PAGES; page += 1) {
  const offset = page * PAGE
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ offset, limit: PAGE }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} at offset ${offset}`)
  const data = await res.json()
  const rows = Array.isArray(data.transactions) ? data.transactions : []
  all.push(...rows.filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(String(row.payment ?? ''))))
  if (rows.length < PAGE) break
}

const header = [
  'Vendor Name',
  'Payment Number',
  'Payment Date',
  'Invoice Number',
  'Description',
  'Invoice Amount',
  'Purchase Order Number',
]
const lines = [
  '"Burbank"',
  '"Accounts Payable Transactions"',
  '"Download generated on 08/17/2026"',
  '"https://burbankca.opengov.com/data/#/1296"',
  '',
  header.map(csvCell).join(','),
]
for (const row of all) {
  lines.push(
    [
      row.vendor,
      row.payment_number,
      row.payment,
      row.invoice__,
      row.purchase_order,
      row.invoice,
      row.po,
    ]
      .map(csvCell)
      .join(','),
  )
}
writeFileSync('OpenGov-Accounts-Payable.csv', `${lines.join('\n')}\n`, 'utf8')
console.log(`wrote ${all.length} rows`)
