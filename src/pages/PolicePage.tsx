import { Link } from 'react-router-dom'
import { SOURCES, statusFor } from '@shared/catalog.ts'
import { Banner } from '../components/Stat.tsx'

export function PolicePage() {
  const rows = SOURCES.filter((s) => ['burbank-pd', 'flock-alpr', 'bpd-uof', 'bpd-policies'].includes(s.id))
  return (
    <div className="page">
      <h1>Police accountability</h1>
      <Banner kind="restricted">
        Flock / ALPR and use-of-force / complaint files are not available to this system. Access
        Status: Restricted. CityScope will not invent those counts.
      </Banner>
      <table>
        <thead>
          <tr>
            <th>Dataset</th>
            <th>Access status</th>
            <th>How access could be obtained</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>
                <span className={`status ${statusFor(s)}`} />
                {statusFor(s).replaceAll('_', ' ')}
              </td>
              <td>{s.howToObtain}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Incident-level crime is not displayed on the Crime page. Do not infer misconduct from
        missing data.{' '}
        <Link to="/reports/police">Access-status report</Link>
      </p>
    </div>
  )
}
