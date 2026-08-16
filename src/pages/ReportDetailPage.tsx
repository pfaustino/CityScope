import { Link, useParams } from 'react-router-dom'
import { buildAllReports } from '@shared/reports.ts'
import { CLAIM_LABEL } from '@shared/types.ts'
import { Banner, Stat } from '../components/Stat.tsx'
import { useProvenance } from '../components/ProvenanceDrawer.tsx'
import { useCityData } from '../lib/data.ts'

export function ReportDetailPage() {
  const { id } = useParams()
  const { warehouse } = useCityData()
  const { open } = useProvenance()
  const report = buildAllReports(warehouse).find((r) => r.id === id)
  if (!report || !id) {
    return (
      <div className="page">
        <h1>Report not found</h1>
        <Link to="/reports">Back</Link>
      </div>
    )
  }
  return (
    <div className="page">
      <p className="kicker">{report.category}</p>
      <h1>{report.title}</h1>
      <p className="lede">{report.period}</p>
      <Banner kind={/access status|does not invent|restricted/i.test(report.dataClassNote) ? 'restricted' : 'live'}>
        {report.dataClassNote}
      </Banner>
      <div className="grid stats">
        {report.keyNumbers.map((k) => (
          <Stat key={k.label} label={k.label} value={k.value} provenance={k.provenance} />
        ))}
      </div>
      {report.sections.map((s) => (
        <section key={s.heading} style={{ marginTop: '1.25rem' }}>
          <h2>{s.heading}</h2>
          {s.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </section>
      ))}
      <section style={{ marginTop: '1.25rem' }}>
        <h2>Report quality standard</h2>
        <dl className="quality">
          {Object.entries(report.qualityAnswers).map(([q, a]) => (
            <div key={q}>
              <dt>{q}</dt>
              <dd>{a}</dd>
            </div>
          ))}
        </dl>
      </section>
      {report.keyNumbers[0] ? (
        <p>
          <button type="button" className="btn ghost" onClick={() => open(report.keyNumbers[0]!.provenance)}>
            Inspect first key number ({CLAIM_LABEL[report.keyNumbers[0].provenance.claimType]})
          </button>
        </p>
      ) : null}
      <p>
        <Link to="/reports">All reports</Link>
      </p>
    </div>
  )
}
