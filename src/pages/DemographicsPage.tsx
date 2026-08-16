import { Link } from 'react-router-dom'
import type { CensusRaceEthnicity, CensusSnapshot } from '@shared/types.ts'
import { Banner, Stat } from '../components/Stat.tsx'
import { useCityData, num, usd } from '../lib/data.ts'

function pctRate(n: number | null): string {
  if (n === null) return '—'
  return `${(n * 100).toFixed(1)}%`
}

function shareWithMoe(row: CensusRaceEthnicity): string {
  const share = `${(row.share * 100).toFixed(1)}%`
  if (row.shareMoe === null) return share
  return `${share} ± ${(row.shareMoe * 100).toFixed(1)}`
}

export function DemographicsPage() {
  const { warehouse } = useCityData()
  const raceRows = warehouse.census.filter((c) => c.raceEthnicity && c.raceEthnicity.length > 0)
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
              <th>Median age</th>
              <th>Median HH income</th>
              <th>Poverty</th>
              <th>Median home</th>
              <th>Median rent</th>
              <th>Households</th>
              <th>Bachelor’s+</th>
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
                <td>{c.medianAge !== null ? c.medianAge.toFixed(1) : '—'}</td>
                <td>{c.medianHouseholdIncome ? usd(c.medianHouseholdIncome) : '—'}</td>
                <td>{pctRate(c.povertyRate)}</td>
                <td>{c.medianHomeValue ? usd(c.medianHomeValue) : '—'}</td>
                <td>{c.medianGrossRent ? usd(c.medianGrossRent) : '—'}</td>
                <td>{c.households !== null ? num(c.households) : '—'}</td>
                <td>{pctRate(c.bachelorOrHigher)}</td>
                <td>
                  <span className={`pill ${c.provenance.claimType}`}>{c.provenance.claimType}</span>
                  <span className={`pill ${c.provenance.dataClass}`}>{c.provenance.dataClass}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="meta">
        Bachelor’s or higher is among residents age 25+ (ACS B15003). Poverty is persons below poverty
        (B17001). Click a population figure for provenance.
      </p>
      {raceRows.map((c) => (
        <RaceTable key={`${c.year}-race`} snapshot={c} />
      ))}
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

function RaceTable({ snapshot }: { snapshot: CensusSnapshot }) {
  const rows = snapshot.raceEthnicity
  if (!rows) return null
  return (
    <section style={{ marginTop: '1.5rem' }}>
      <h2>Race and Hispanic origin</h2>
      <p className="meta">
        {snapshot.vintage}. ACS table B03002, mutually exclusive groups. Share is a calculation
        (group estimate ÷ B03002 total). Margins of error are ACS 90% MOE, shown in percentage
        points of city population.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Group</th>
              <th>Estimate</th>
              <th>Share ± MOE</th>
              <th>Claim</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.label}</td>
                <td>
                  <Stat
                    label=""
                    value={num(row.estimate)}
                    meta={row.moe !== null ? `± ${num(row.moe)}` : undefined}
                    provenance={snapshot.provenance}
                  />
                </td>
                <td>
                  {shareWithMoe(row)}
                  <span className="pill calculation">calculation</span>
                </td>
                <td>
                  <span className="pill fact">fact</span>
                  <span className={`pill ${snapshot.provenance.dataClass}`}>{snapshot.provenance.dataClass}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
