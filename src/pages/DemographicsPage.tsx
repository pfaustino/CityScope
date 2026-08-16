import { Link } from 'react-router-dom'
import { Banner, Stat } from '../components/Stat.tsx'
import { useCityData, num, usd } from '../lib/data.ts'

export function DemographicsPage() {
  const { warehouse } = useCityData()
  return (
    <div className="page">
      <h1>Demographic & economic change</h1>
      <Banner kind="live">
        Published Census / ACS / Population Estimates snapshots. Live ACS API needs a Census key.
        ACS 1-year income is not comparable to ACS 5-year income without caveats.
      </Banner>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Vintage</th>
              <th>Population</th>
              <th>Median HH income</th>
              <th>Poverty</th>
              <th>Median home</th>
              <th>Claim</th>
            </tr>
          </thead>
          <tbody>
            {warehouse.census.map((c) => (
              <tr key={c.year}>
                <td>{c.vintage}</td>
                <td>
                  <Stat label="" value={num(c.population)} provenance={c.provenance} />
                </td>
                <td>{c.medianHouseholdIncome ? usd(c.medianHouseholdIncome) : '—'}</td>
                <td>{c.povertyRate !== null ? `${(c.povertyRate * 100).toFixed(1)}%` : '—'}</td>
                <td>{c.medianHomeValue ? usd(c.medianHomeValue) : '—'}</td>
                <td>
                  <span className={`pill ${c.provenance.claimType}`}>{c.provenance.claimType}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {warehouse.census.map((c) => (
        <p key={`${c.year}-n`}>
          <strong>{c.year}:</strong> {c.notes.join(' ')}
        </p>
      ))}
      <p>
        <Link to="/reports/demographics">Annual “Burbank is changing” report</Link>
      </p>
    </div>
  )
}
