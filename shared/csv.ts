/** RFC4180-ish CSV split. Does not interpret types. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"'
          i += 1
        } else {
          quoted = false
        }
      } else {
        cur += c
      }
      continue
    }
    if (c === '"') {
      quoted = true
      continue
    }
    if (c === ',') {
      row.push(cur)
      cur = ''
      continue
    }
    if (c === '\n') {
      row.push(cur)
      rows.push(row)
      row = []
      cur = ''
      continue
    }
    if (c === '\r') continue
    cur += c
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur)
    rows.push(row)
  }
  return rows.filter((r) => r.some((cell) => cell.trim().length > 0))
}
