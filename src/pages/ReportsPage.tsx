import { Link } from 'react-router-dom'
import { REPORT_DEFS, reportHasConnectedDataset } from '@shared/reports.ts'
import { useCityData } from '../lib/data.ts'

export function ReportsPage() {
  const { warehouse } = useCityData()
  const groups = [
    {
      key: 'with-data',
      title: 'With data',
      blurb: 'Built from published snapshots or connected public feeds. Not a substitute for incident-level records.',
      items: REPORT_DEFS.filter((r) => reportHasConnectedDataset(r.id, warehouse)),
    },
    {
      key: 'no-dataset',
      title: 'No dataset yet',
      blurb: 'Access restricted, not connected, or empty. These reports describe status. They are not live city statistics.',
      items: REPORT_DEFS.filter((r) => !reportHasConnectedDataset(r.id, warehouse)),
    },
  ] as const
  return (
    <div className="page">
      <h1>Reports</h1>
      <p className="lede">
        Each report answers what happened, how large, where, when, compared with what, what
        supports it, other explanations, what is missing, and what to investigate next.
      </p>
      {groups.map((g) => (
        <section key={g.key} className={g.key === 'no-dataset' ? 'report-group split' : 'report-group'}>
          <h2>{g.title}</h2>
          <p className="meta">{g.blurb}</p>
          <ul>
            {g.items.map((r) => (
              <li key={r.id}>
                <Link to={`/reports/${r.id}`}>{r.title}</Link>
                <span className="meta"> — {r.period}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
