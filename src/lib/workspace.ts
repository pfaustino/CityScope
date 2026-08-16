const KEY = 'cityscope.investigations.v1'

export type SavedInvestigation = {
  id: string
  title: string
  createdAt: string
  entityKind?: string
  entityId?: string
  notes: string
  findings: string[]
  questions: string[]
  hypotheses: string[]
}

export function loadInvestigations(): SavedInvestigation[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as SavedInvestigation[]
  } catch {
    return []
  }
}

export function saveInvestigations(rows: SavedInvestigation[]): void {
  localStorage.setItem(KEY, JSON.stringify(rows))
}

export function upsertInvestigation(row: SavedInvestigation): SavedInvestigation[] {
  const rows = loadInvestigations()
  const idx = rows.findIndex((r) => r.id === row.id)
  if (idx >= 0) rows[idx] = row
  else rows.unshift(row)
  saveInvestigations(rows)
  return rows
}

export function exportMarkdown(row: SavedInvestigation): string {
  return [
    `# ${row.title}`,
    '',
    `Created ${row.createdAt}`,
    row.entityKind ? `Entity: ${row.entityKind}/${row.entityId}` : '',
    '',
    '## Notes',
    row.notes || '_None_',
    '',
    '## Findings',
    ...row.findings.map((f) => `- ${f}`),
    '',
    '## Questions',
    ...row.questions.map((f) => `- ${f}`),
    '',
    '## Hypotheses',
    ...row.hypotheses.map((f) => `- ${f}`),
    '',
    '_Hypotheses are not facts. Correlation is not causation._',
  ]
    .filter((line) => line !== '')
    .join('\n')
}
