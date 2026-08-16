import { Link } from 'react-router-dom'
import { gapFor } from '@shared/accessGaps.ts'
import { topN } from '@shared/analysis.ts'
import { collisionsProvenance } from '@shared/switrs.ts'
import { CLAIM_LABEL } from '@shared/types.ts'
import { AccessPanel } from '../components/AccessPanel.tsx'
import { Banner, Stat } from '../components/Stat.tsx'
import { num, useCityData } from '../lib/data.ts'

export function TransportationPage() {
  const { warehouse, analysis } = useCityData()
  const gap = gapFor('collisions')
  const rows = warehouse.collisions
  if (rows.length === 0) {
    if (!gap) return null
    return (
      <div className="page">
        <h1>Transportation</h1>
        <AccessPanel gap={gap} />
      </div>
    )
  }
  const fileName = warehouse.collisionsFile ?? 'Crashes.csv'
  const provenance = collisionsProvenance(warehouse, fileName)
  const fatal = rows.filter((c) => c.severity === 'fatal').length
  const injury = rows.filter((c) => c.severity === 'injury').length
  const property = rows.filter((c) => c.severity === 'property').length
  const geocoded = rows.filter((c) => c.geo.lat != null && c.geo.lng != null).length
  const top = topN(analysis.collisionsByIntersection, 8)
  return (
    <div className="page">
      <h1>Transportation</h1>
      <Banner kind="live">
        {CLAIM_LABEL.fact} / snapshot from {fileName}: {num(rows.length)} official Burbank collision
        records, retrieved {warehouse.generatedAt}. Not demonstration data. Correlation is not
        causation.
      </Banner>
      <div className="grid stats">
        <Stat label={`Records (${fileName})`} value={num(rows.length)} provenance={provenance} />
        <Stat label="Fatal-coded" value={num(fatal)} />
        <Stat label="Injury-coded" value={num(injury)} />
        <Stat label="Property-coded" value={num(property)} />
        <Stat label="Mapped (lat/lng)" value={num(geocoded)} />
        <Stat label="Counted only (no coordinates)" value={num(rows.length - geocoded)} />
      </div>
      <p className="meta">
        Columns used: CASE_ID, COLLISION_DATE, COLLISION_TIME, COLLISION_SEVERITY, PRIMARY_RD,
        SECONDARY_RD, LATITUDE, LONGITUDE, POINT_X, POINT_Y, CITY. This extract has no
        property-damage-only rows if that count is zero — that is the file, not a missing zero
        invented by CityScope.
      </p>
      <h2>Named locations (from PRIMARY_RD & SECONDARY_RD)</h2>
      <table>
        <thead>
          <tr>
            <th>Location</th>
            <th>Records</th>
          </tr>
        </thead>
        <tbody>
          {top.map(([name, n]) => (
            <tr key={name}>
              <td>{name}</td>
              <td>{num(n)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        <Link to="/map">Plot geocoded collisions on the map</Link>
        {' · '}
        <Link to="/reports/transport">Transportation report</Link>
      </p>
    </div>
  )
}
