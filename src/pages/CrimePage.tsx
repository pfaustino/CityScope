import { Link } from 'react-router-dom'
import { gapFor } from '@shared/accessGaps.ts'
import {
  ACS_2023_RATE_VINTAGE,
  acs5Population,
  compareAgencyYears,
  formatRate,
  isFbiCdeFullYear,
  rateProvenance,
} from '@shared/crimeCompare.ts'
import { GLENDALE } from '@shared/peerCities.ts'
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
  const burbankPop = acs5Population(warehouse.census)?.population ?? warehouse.populationForRates
  const glendalePop = acs5Population(warehouse.censusGlendale)?.population ?? warehouse.populationGlendaleForRates
  const compareRows = compareAgencyYears(
    warehouse.crimeAnnual,
    warehouse.crimeAnnualGlendale,
    burbankPop,
    glendalePop,
  ).slice(0, 12)
  const compareLatest = compareRows[0]
  const latestBurbank = warehouse.crimeAnnual.find((r) => r.year === compareLatest?.year)
  const latestGlendale = warehouse.crimeAnnualGlendale.find((r) => r.year === compareLatest?.year)
  const fbiCompare = compareAgencyYears(
    warehouse.fbiAnnual.filter(isFbiCdeFullYear),
    warehouse.fbiAnnualGlendale.filter(isFbiCdeFullYear),
    burbankPop,
    glendalePop,
  ).slice(0, 8)
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
            {' · '}
            <Link to="/reports/crime-compare">Burbank vs Glendale report</Link>
          </p>
        </>
      ) : (
        <p>Annual OpenJustice totals are not loaded yet. Start the API or run ingest.</p>
      )}
      <p>
        <Link to="/hate-crimes">Hate crimes (OpenJustice events, NCIC 1912)</Link>
      </p>
      {compareLatest && latestBurbank && latestGlendale ? (
        <>
          <h2>Burbank vs Glendale</h2>
          <Banner kind="live">
            Primary full-year comparison is CA DOJ OpenJustice ({CLAIM_LABEL.fact}). Rates per 1,000
            residents use {ACS_2023_RATE_VINTAGE} population for each city ({CLAIM_LABEL.calculation}
            ). These are agency totals, not incidents. A rate difference is not a causal finding.
          </Banner>
          <p>
            <span className="pill fact">{CLAIM_LABEL.fact}</span>
            <span className="pill calculation">{CLAIM_LABEL.calculation}</span>
          </p>
          <div className="grid stats">
            <Stat
              label={`${compareLatest.year} violent — Burbank`}
              value={num(compareLatest.burbankViolent)}
              provenance={latestBurbank.provenance}
            />
            <Stat
              label={`${compareLatest.year} violent — Glendale`}
              value={num(compareLatest.glendaleViolent)}
              provenance={latestGlendale.provenance}
            />
            <Stat
              label={`${compareLatest.year} violent / 1,000 — Burbank`}
              value={formatRate(compareLatest.burbankViolentPer1000)}
              meta={`${ACS_2023_RATE_VINTAGE} pop. ${num(burbankPop)}`}
              provenance={
                compareLatest.burbankViolentPer1000 != null
                  ? rateProvenance(
                      `${compareLatest.year} violent offenses per 1,000 (Burbank)`,
                      compareLatest.burbankViolentPer1000,
                      'Burbank',
                      compareLatest.year,
                      compareLatest.burbankViolent,
                      burbankPop,
                      latestBurbank,
                      ACS_2023_RATE_VINTAGE,
                    )
                  : undefined
              }
            />
            <Stat
              label={`${compareLatest.year} violent / 1,000 — Glendale`}
              value={formatRate(compareLatest.glendaleViolentPer1000)}
              meta={`${ACS_2023_RATE_VINTAGE} pop. ${num(glendalePop)}`}
              provenance={
                compareLatest.glendaleViolentPer1000 != null
                  ? rateProvenance(
                      `${compareLatest.year} violent offenses per 1,000 (Glendale)`,
                      compareLatest.glendaleViolentPer1000,
                      'Glendale',
                      compareLatest.year,
                      compareLatest.glendaleViolent,
                      glendalePop,
                      latestGlendale,
                      ACS_2023_RATE_VINTAGE,
                    )
                  : undefined
              }
            />
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Burbank violent</th>
                  <th>Glendale violent</th>
                  <th>Burbank violent / 1k</th>
                  <th>Glendale violent / 1k</th>
                  <th>Burbank property</th>
                  <th>Glendale property</th>
                  <th>Burbank property / 1k</th>
                  <th>Glendale property / 1k</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row) => (
                  <tr key={`cmp-${row.year}`}>
                    <td>{row.year}</td>
                    <td>{num(row.burbankViolent)}</td>
                    <td>{num(row.glendaleViolent)}</td>
                    <td>{formatRate(row.burbankViolentPer1000)}</td>
                    <td>{formatRate(row.glendaleViolentPer1000)}</td>
                    <td>{num(row.burbankProperty)}</td>
                    <td>{num(row.glendaleProperty)}</td>
                    <td>{formatRate(row.burbankPropertyPer1000)}</td>
                    <td>{formatRate(row.glendalePropertyPer1000)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="meta">
            OpenJustice agency rows: Burbank and {GLENDALE.openJusticeAgency}, Los Angeles County.
            Rate denominator is {ACS_2023_RATE_VINTAGE} (Burbank {num(burbankPop)}; Glendale{' '}
            {num(glendalePop)}). Applying that vintage to every crime year is a calculation, not a
            same-year census count.
          </p>
          {fbiCompare.length > 0 ? (
            <>
              <h3>FBI CDE (secondary, full-year rows only)</h3>
              <p className="meta">
                CDE coverage is uneven in the NIBRS transition. 2021 is not shown as a full-year
                comparison. OpenJustice remains the primary series. Glendale PD ORI {GLENDALE.fbiOri}.
              </p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Burbank violent</th>
                      <th>Glendale violent</th>
                      <th>Burbank property</th>
                      <th>Glendale property</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fbiCompare.map((row) => (
                      <tr key={`fbi-cmp-${row.year}`}>
                        <td>{row.year}</td>
                        <td>{num(row.burbankViolent)}</td>
                        <td>{num(row.glendaleViolent)}</td>
                        <td>{num(row.burbankProperty)}</td>
                        <td>{num(row.glendaleProperty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="meta">
              FBI CDE is not used for the city comparison when coverage is incomplete (including 2021
              NIBRS-transition actuals). OpenJustice is the full-year series.
            </p>
          )}
        </>
      ) : null}
      {fbiLatest ? (
        <>
          <Banner kind="live">
            FBI Crime Data Explorer annual/API facts for Burbank PD (ORI CA0191200). Monthly CDE
            actuals are summed to calendar years. These are not incidents. CDE and OpenJustice can
            differ. 2021 CDE for this ORI has actuals only in December (Jan–Nov are blank), so that
            year is not a full-year total.
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
