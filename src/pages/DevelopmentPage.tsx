import { gapFor } from '@shared/accessGaps.ts'
import { formatPermitAddress, onBasePermitProvenance, ONBASE_OVERLAY_ROWS } from '@shared/onbase.ts'
import { CLAIM_LABEL } from '@shared/types.ts'
import { AccessPanel } from '../components/AccessPanel.tsx'
import { MonthChart } from '../components/MonthChart.tsx'
import { Banner, Stat } from '../components/Stat.tsx'
import { num, useCityData } from '../lib/data.ts'

export function DevelopmentPage() {
  const { warehouse } = useCityData()
  const gap = gapFor('permits')
  const listing = warehouse.permitListing
  if (!listing) {
    if (!gap) return null
    return (
      <div className="page">
        <h1>Development watch</h1>
        <AccessPanel gap={gap} />
      </div>
    )
  }

  const recent = listing.rows.slice(0, ONBASE_OVERLAY_ROWS)

  return (
    <div className="page">
      <h1>Development watch</h1>
      <p className="lede">
        OnBase Building Documents search ({listing.fileName}). Issued permits by type and street, not
        a valuation file and not the applicant portal.
      </p>
      <Banner kind="live">
        {CLAIM_LABEL.fact} / snapshot. {num(listing.count)} unique Permit No + Date Issued rows from{' '}
        {listing.dateStart} through {listing.dateEnd}. No dollar amounts are in this listing.
        Addresses are not geocoded. Correlation is not causation.
      </Banner>
      <p>
        <span className="pill fact">{CLAIM_LABEL.fact}</span>
        <span className="pill calculation">{CLAIM_LABEL.calculation}</span>
        <span className="pill snapshot">snapshot</span>
      </p>
      <div className="grid stats">
        <Stat
          label="Issued permits in this extract"
          value={num(listing.count)}
          provenance={onBasePermitProvenance(warehouse, listing)}
        />
        <Stat label="Permit types" value={num(listing.byType.length)} />
        <Stat
          label="Issued dates"
          value={`${listing.dateStart ?? 'n/a'} – ${listing.dateEnd ?? 'n/a'}`}
        />
      </div>

      <h2>Issued permits by month</h2>
      <p className="meta">
        {CLAIM_LABEL.calculation}. Count of listing rows by Date Issued month (YYYY-MM).
      </p>
      <MonthChart data={Object.fromEntries(listing.byMonth.map((row) => [row.month, row.count]))} />

      <h2>Issued permits by type</h2>
      <p className="meta">
        {CLAIM_LABEL.calculation}. Count of listing rows by Permit Type as published.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Permit type</th>
              <th className="num">Issued</th>
            </tr>
          </thead>
          <tbody>
            {listing.byType.map((row) => (
              <tr key={row.type}>
                <td>{row.type}</td>
                <td className="num">{num(row.count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Newest issued permits</h2>
      <p className="meta">
        {CLAIM_LABEL.fact}. {num(recent.length)} of {num(listing.count)} rows, newest Date Issued
        first. Full extract is OnBase-Building-Permits.csv. Source:{' '}
        <a href={listing.sourceUrl}>OnBase Building Documents search</a>.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Issued</th>
              <th>Permit</th>
              <th>Type</th>
              <th>Address</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((row) => (
              <tr key={`${row.permitNo}-${row.issuedOn}`}>
                <td>{row.issuedOn}</td>
                <td>{row.permitNo}</td>
                <td>{row.permitType}</td>
                <td>{formatPermitAddress(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
