import { Link } from 'react-router-dom'
import type { PublicFeedState } from '@shared/publicFeeds.ts'
import { CLAIM_LABEL } from '@shared/types.ts'
import { Banner, Stat } from '../components/Stat.tsx'
import { feedMetaLine, feedStatLabel, quakeProvenance, weatherProvenance } from '../lib/fetchPublicFeeds.ts'
import { useCityData, num } from '../lib/data.ts'

export function EnvironmentPage() {
  const { warehouse, publicFeeds } = useCityData()
  const wx = warehouse.weather[0]
  const aqi = [...warehouse.airQuality].sort((a, b) => b.aqi - a.aqi)[0]
  const climate = warehouse.climate[warehouse.climate.length - 1]
  const wxFeed = publicFeeds.weather
  const eqFeed = publicFeeds.earthquakes
  return (
    <div className="page">
      <h1>Environment & risk</h1>
      <Banner kind="live">
        NWS forecast and USGS earthquakes are public feeds fetched in the browser on load (XML). If
        a fetch fails, the baked copy is shown and labeled snapshot — not live. AirNow and NOAA
        GHCND need keys and stay off this static page. AirNow must not be used for regulation.
      </Banner>
      <div className="grid stats">
        <Stat
          label={feedStatLabel('NWS', wxFeed)}
          value={wx ? `${wx.shortForecast} ${wx.temperatureF}°F` : 'n/a'}
          meta={feedMetaLine(wxFeed)}
          provenance={weatherProvenance(wxFeed, wx, warehouse.generatedAt)}
        />
        <Stat
          label={feedStatLabel('USGS M≥2.5 (40 km)', eqFeed)}
          value={num(warehouse.earthquakes.length)}
          meta={feedMetaLine(eqFeed)}
          provenance={quakeProvenance(eqFeed, warehouse.earthquakes.length, warehouse.generatedAt)}
        />
        <Stat
          label="AirNow"
          value={aqi ? `${aqi.parameter} ${aqi.aqi} (${aqi.category})` : 'not loaded'}
        />
        <Stat
          label="NOAA GHCND latest"
          value={
            climate
              ? `${climate.date} TMAX ${climate.tmaxF ?? 'n/a'}°F`
              : 'not loaded'
          }
        />
      </div>
      <h2>Forecast periods</h2>
      <p>
        <span className="pill fact">{CLAIM_LABEL.fact}</span>
        <FeedPills feed={wxFeed} />
      </p>
      <FeedStatus feed={wxFeed} />
      <ul>
        {warehouse.weather.map((w) => (
          <li key={w.startTime}>
            {w.name}: {w.shortForecast}, {w.temperatureF}°F, {w.wind || '—'}
          </li>
        ))}
      </ul>
      {warehouse.airQuality.length > 0 ? (
        <>
          <h2>AirNow observations</h2>
          <ul>
            {warehouse.airQuality.map((a) => (
              <li key={`${a.parameter}-${a.dateObserved}-${a.hourObserved}`}>
                {a.parameter}: AQI {a.aqi} ({a.category}) — {a.reportingArea} {a.dateObserved}
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {warehouse.climate.length > 0 ? (
        <>
          <h2>NOAA daily climate (BUR station)</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>TMAX °F</th>
                <th>TMIN °F</th>
                <th>PRCP in</th>
              </tr>
            </thead>
            <tbody>
              {warehouse.climate.map((c) => (
                <tr key={c.date}>
                  <td>{c.date}</td>
                  <td>{c.tmaxF ?? '—'}</td>
                  <td>{c.tminF ?? '—'}</td>
                  <td>{c.prcpIn ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p>Start the API so live NOAA/AirNow can overlay, or run `npm run ingest`.</p>
      )}
      <h2>Earthquakes</h2>
      <p>
        <span className="pill fact">{CLAIM_LABEL.fact}</span>
        <FeedPills feed={eqFeed} />
      </p>
      <FeedStatus feed={eqFeed} />
      <p>
        M≥2.5 within 40 km of Burbank (34.1808, -118.309), 2026 YTD (starttime=2026-01-01). A live
        result of zero events replaces the baked list.
      </p>
      {warehouse.earthquakes.length === 0 ? (
        <p>No events in this catalog window.</p>
      ) : (
        <ul>
          {warehouse.earthquakes.map((e) => (
            <li key={e.id}>
              M{e.mag.toFixed(1)} — {e.place} ({e.time.slice(0, 10)}) — <a href={e.url}>USGS</a>
            </li>
          ))}
        </ul>
      )}
      <p>
        <Link to="/reports/environment">Monthly environmental report</Link>
      </p>
    </div>
  )
}

function FeedPills({ feed }: { feed: PublicFeedState<unknown> }) {
  if (feed.loading) return <span className="pill snapshot">retrieving</span>
  return (
    <>
      <span className={`pill ${feed.dataClass}`}>{feed.dataClass}</span>
      {feed.format === 'json' ? <span className="pill observation">JSON fallback</span> : null}
    </>
  )
}

function FeedStatus({ feed }: { feed: PublicFeedState<unknown> }) {
  if (feed.loading) return <p>Retrieving public XML…</p>
  return (
    <div>
      <p>
        Source: <a href={feed.sourceUrl}>{feed.sourceUrl}</a>
        {feed.retrievedAt ? ` · retrieved ${feed.retrievedAt}` : null}
      </p>
      {feed.note ? <p>{feed.note}</p> : null}
      {feed.error ? <p>Live fetch failed: {feed.error}. Showing snapshot.</p> : null}
    </div>
  )
}
