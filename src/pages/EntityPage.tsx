import { Link, useParams } from 'react-router-dom'
import { investigate, type EntityKind } from '@shared/investigate.ts'
import { Banner } from '../components/Stat.tsx'
import { useCityData } from '../lib/data.ts'
import { upsertInvestigation } from '../lib/workspace.ts'

export function EntityPage() {
  const { kind, id } = useParams()
  const { warehouse } = useCityData()
  const bundle = kind && id ? investigate(warehouse, kind as EntityKind, id) : null
  if (!bundle) {
    return (
      <div className="page">
        <h1>Entity not found</h1>
        <Link to="/">Dashboard</Link>
      </div>
    )
  }
  return (
    <div className="page">
      <p className="kicker">{bundle.kind}</p>
      <h1>{bundle.title}</h1>
      <Banner kind="restricted">{bundle.caveats.join(' ')}</Banner>
      {bundle.summary.map((s) => (
        <p key={s}>{s}</p>
      ))}
      <table>
        <tbody>
          {bundle.facts.map((f) => (
            <tr key={f.label}>
              <th>{f.label}</th>
              <td>{f.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Related</h2>
      <ul>
        {bundle.related.map((r) => (
          <li key={`${r.kind}-${r.id}`}>
            <Link to={`/investigate/${r.kind}/${r.id}`}>{r.label}</Link>
          </li>
        ))}
      </ul>
      <button
        className="btn"
        type="button"
        onClick={() => {
          upsertInvestigation({
            id: `inv-${bundle.kind}-${bundle.id}`,
            title: `Investigate ${bundle.title}`,
            createdAt: new Date().toISOString(),
            entityKind: bundle.kind,
            entityId: bundle.id,
            notes: bundle.summary.join('\n'),
            findings: bundle.facts.map((f) => `${f.label}: ${f.value}`),
            questions: ['What official record would confirm this?'],
            hypotheses: [],
          })
        }}
      >
        Save to investigation workspace
      </button>
      <p>
        <Link to="/investigations">Open workspace</Link>
      </p>
    </div>
  )
}
