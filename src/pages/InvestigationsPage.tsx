import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  exportMarkdown,
  loadInvestigations,
  upsertInvestigation,
  type SavedInvestigation,
} from '../lib/workspace.ts'

export function InvestigationsPage() {
  const [rows, setRows] = useState(() => loadInvestigations())
  const [activeId, setActiveId] = useState(rows[0]?.id ?? '')
  const active = useMemo(() => rows.find((r) => r.id === activeId) ?? null, [rows, activeId])

  function create(): void {
    const row: SavedInvestigation = {
      id: `inv-${Date.now()}`,
      title: 'Untitled investigation',
      createdAt: new Date().toISOString(),
      notes: '',
      findings: [],
      questions: ['What official source would confirm this?'],
      hypotheses: [],
    }
    setRows(upsertInvestigation(row))
    setActiveId(row.id)
  }

  function patch(partial: Partial<SavedInvestigation>): void {
    if (!active) return
    setRows(upsertInvestigation({ ...active, ...partial }))
  }

  function download(kind: 'md' | 'json'): void {
    if (!active) return
    const body = kind === 'md' ? exportMarkdown(active) : JSON.stringify(active, null, 2)
    const blob = new Blob([body], { type: kind === 'md' ? 'text/markdown' : 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${active.id}.${kind}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page">
      <h1>Investigations</h1>
      <p className="lede">
        Save findings, notes, questions, and hypotheses. Hypotheses are not facts. Export markdown
        or JSON; use the browser print dialog for PDF/HTML.
      </p>
      <p>
        <button className="btn" type="button" onClick={create}>
          New investigation
        </button>
      </p>
      <div className="grid two">
        <div className="card">
          <h2>Workspace list</h2>
          <ul>
            {rows.map((r) => (
              <li key={r.id}>
                <button type="button" className="btn ghost" onClick={() => setActiveId(r.id)}>
                  {r.title}
                </button>
                <div className="meta">{r.createdAt.slice(0, 10)}</div>
              </li>
            ))}
          </ul>
        </div>
        {active ? (
          <div className="card">
            <label>
              Title
              <input value={active.title} onChange={(e) => patch({ title: e.target.value })} />
            </label>
            <label>
              Notes
              <textarea rows={6} value={active.notes} onChange={(e) => patch({ notes: e.target.value })} />
            </label>
            <label>
              Findings (one per line)
              <textarea
                rows={4}
                value={active.findings.join('\n')}
                onChange={(e) => patch({ findings: e.target.value.split('\n') })}
              />
            </label>
            <label>
              Questions
              <textarea
                rows={3}
                value={active.questions.join('\n')}
                onChange={(e) => patch({ questions: e.target.value.split('\n') })}
              />
            </label>
            <label>
              Hypotheses
              <textarea
                rows={3}
                value={active.hypotheses.join('\n')}
                onChange={(e) => patch({ hypotheses: e.target.value.split('\n') })}
              />
            </label>
            <p>
              <button className="btn" type="button" onClick={() => download('md')}>
                Export markdown
              </button>{' '}
              <button className="btn ghost" type="button" onClick={() => download('json')}>
                Export JSON
              </button>{' '}
              <button className="btn ghost" type="button" onClick={() => window.print()}>
                Print / PDF
              </button>
            </p>
            {active.entityKind && active.entityId ? (
              <p>
                Linked entity:{' '}
                <Link to={`/investigate/${active.entityKind}/${active.entityId}`}>
                  {active.entityKind}/{active.entityId}
                </Link>
              </p>
            ) : null}
          </div>
        ) : (
          <p>Create a workspace to begin.</p>
        )}
      </div>
    </div>
  )
}
