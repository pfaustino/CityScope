import { Link } from 'react-router-dom'
import { gapFor } from '@shared/accessGaps.ts'
import { CLAIM_LABEL } from '@shared/types.ts'
import { AccessPanel } from '../components/AccessPanel.tsx'
import { Banner, Stat } from '../components/Stat.tsx'
import { useCityData, num } from '../lib/data.ts'

export function CrimePage() {
  const { warehouse } = useCityData()
  const gap = gapFor('crime')
  const years = [...warehouse.crimeAnnual].sort((a, b) => b.year - a.year).slice(0, 12)
  const latest = years[0]
  const fbiYears = [...warehouse.fbiAnnual].sort((a, b) => b.year - a.year)
  const fbiLatest = fbiYears[0]
  if (!gap) return null
  return (
    <div className="page">
      <h1>Crime & public safety</h1>
      {latest ? (
        <>
          <Banner kind="live">
            Annual agency totals from CA DOJ OpenJustice ({CLAIM_LABEL.fact}). These are not
            incidents, monthly counts, or neighborhood maps. Correlation is not causation.
          </Banner>
          <div className="grid stats">
            <Stat
              label={`${latest.year} violent (annual)`}
              value={num(latest.violent)}
              provenance={latest.provenance}
            />
            <Stat label={`${latest.year} property (annual)`} value={num(latest.property)} />
            <Stat label={`${latest.year} homicide (annual)`} value={num(latest.homicide)} />
          </div>
          <h2>OpenJustice annual totals (Burbank PD)</h2>
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>Violent</th>
                <th>Homicide</th>
                <th>Rape</th>
                <th>Robbery</th>
                <th>Agg. assault</th>
                <th>Property</th>
                <th>Burglary</th>
                <th>Vehicle theft</th>
                <th>Larceny</th>
              </tr>
            </thead>
            <tbody>
              {years.map((y) => (
                <tr key={y.year}>
                  <td>{y.year}</td>
                  <td>{num(y.violent)}</td>
                  <td>{num(y.homicide)}</td>
                  <td>{num(y.rape)}</td>
                  <td>{num(y.robbery)}</td>
                  <td>{num(y.aggravatedAssault)}</td>
                  <td>{num(y.property)}</td>
                  <td>{num(y.burglary)}</td>
                  <td>{num(y.vehicleTheft)}</td>
                  <td>{num(y.larceny)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            <Link to="/reports/crime-annual">Annual access-and-totals report</Link>
          </p>
        </>
      ) : (
        <p>Annual OpenJustice totals are not loaded yet. Start the API or run ingest.</p>
      )}
      {fbiLatest ? (
        <>
          <Banner kind="live">
            FBI Crime Data Explorer annual/API facts for Burbank PD (ORI CA0191200). Monthly CDE
            actuals are summed to calendar years. These are not incidents. CDE and OpenJustice can
            differ.
          </Banner>
          <div className="grid stats">
            <Stat
              label={`${fbiLatest.year} violent (FBI CDE annual)`}
              value={num(fbiLatest.violent)}
              provenance={fbiLatest.provenance}
            />
            <Stat label={`${fbiLatest.year} property (FBI CDE annual)`} value={num(fbiLatest.property)} />
            <Stat label={`${fbiLatest.year} homicide (FBI CDE annual)`} value={num(fbiLatest.homicide)} />
          </div>
          <h2>FBI CDE annual totals (Burbank PD)</h2>
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>Violent</th>
                <th>Homicide</th>
                <th>Rape</th>
                <th>Robbery</th>
                <th>Agg. assault</th>
                <th>Property</th>
                <th>Burglary</th>
                <th>Vehicle theft</th>
                <th>Larceny</th>
              </tr>
            </thead>
            <tbody>
              {fbiYears.map((y) => (
                <tr key={`fbi-${y.year}`}>
                  <td>{y.year}</td>
                  <td>{num(y.violent)}</td>
                  <td>{num(y.homicide)}</td>
                  <td>{num(y.rape)}</td>
                  <td>{num(y.robbery)}</td>
                  <td>{num(y.aggravatedAssault)}</td>
                  <td>{num(y.property)}</td>
                  <td>{num(y.burglary)}</td>
                  <td>{num(y.vehicleTheft)}</td>
                  <td>{num(y.larceny)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
      <AccessPanel gap={gap} />
      <p>
        No incident counts, neighborhood totals, or map points are shown. A zero incident count
        would be a fake statistic.{' '}
        <Link to="/reports/crime-monthly">Open the incident access-status report</Link>
      </p>
    </div>
  )
}
