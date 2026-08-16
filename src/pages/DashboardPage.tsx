import { Link } from 'react-router-dom'
import { gapFor } from '@shared/accessGaps.ts'
import { AccessPanel } from '../components/AccessPanel.tsx'
import { Banner, Stat } from '../components/Stat.tsx'
import { useCityData, num } from '../lib/data.ts'

export function DashboardPage() {
  const { warehouse, analysis, overlayErrors } = useCityData()
  const o = analysis.overview
  const crimeGap = gapFor('crime')
  const pop = warehouse.census.find((c) => c.year === '2023')
  const crimeYear = [...warehouse.crimeAnnual].sort((a, b) => b.year - a.year)[0]

  return (
    <div className="page">
      <h1>Burbank today</h1>
      <p className="lede">
        Only numbers from connected public sources are shown. Click a statistic for provenance.
        Correlation is not causation.
      </p>
      <Banner kind="live">
        Live/snapshot: Census ACS, NWS, USGS, NOAA GHCND, AirNow, CA DOJ OpenJustice annual
        totals, FBI CDE annual/API facts when the key works, and SWITRS collisions when
        Crashes.csv is loaded. Incident-level crime is not connected — no substitute incident
        counts.
      </Banner>
      <div className="grid stats">
        <Stat
          label={pop?.provenance.dataClass === 'live' ? 'ACS 2023 population (live)' : 'ACS 2023 population'}
          value={num(o.population)}
          provenance={pop?.provenance ?? o.stats[0]}
        />
        <Stat label="Weather (NWS)" value={o.weatherToday} />
        <Stat label="USGS M≥2.5 (40 km)" value={num(o.quakesNearby)} />
        <Stat label="AirNow" value={o.aqiSummary ?? 'Run ingest / start API'} />
        {crimeYear ? (
          <Stat
            label={`${crimeYear.year} violent (OpenJustice annual)`}
            value={num(crimeYear.violent)}
            provenance={crimeYear.provenance}
          />
        ) : null}
      </div>
      {crimeGap ? (
        <section style={{ marginTop: '1.25rem' }}>
          <h2>Crime</h2>
          <AccessPanel gap={crimeGap} />
          <p>
            <Link to="/crime">Crime access details</Link>
          </p>
        </section>
      ) : null}
      <section style={{ marginTop: '1.5rem' }}>
        <h2>This week’s findings</h2>
        {analysis.discoveries.length === 0 ? (
          <p>
            No unusual-pattern findings. CityScope will not generate discoveries from missing or
            fabricated series.
          </p>
        ) : (
          <ul>
            {analysis.discoveries.map((d) => (
              <li key={d.id}>
                <strong>{d.headline}</strong>
                <div>{d.body}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section style={{ marginTop: '1.5rem' }}>
        <h2>Data health</h2>
        <p>
          Warehouse {analysis.dataHealth.warehouseGeneratedAt}. Connected/snapshot:{' '}
          {analysis.dataHealth.liveOrSnapshot.join(', ')}. Not loaded:{' '}
          {analysis.dataHealth.unavailable.join(', ')}. Restricted:{' '}
          {analysis.dataHealth.restricted.join(', ')}.
        </p>
        {overlayErrors.length > 0 ? (
          <ul>
            {overlayErrors.map((e) => (
              <li key={e.sourceId}>
                Live {e.sourceId}: {e.message}
              </li>
            ))}
          </ul>
        ) : null}
        <p>
          <Link to="/sources">Open the source catalog</Link>
        </p>
      </section>
    </div>
  )
}
