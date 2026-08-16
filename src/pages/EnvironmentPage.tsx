import { Link } from 'react-router-dom'
import { Banner, Stat } from '../components/Stat.tsx'
import { useCityData, num } from '../lib/data.ts'

export function EnvironmentPage() {
  const { warehouse } = useCityData()
  const wx = warehouse.weather[0]
  const aqi = [...warehouse.airQuality].sort((a, b) => b.aqi - a.aqi)[0]
  const climate = warehouse.climate[warehouse.climate.length - 1]
  return (
    <div className="page">
      <h1>Environment & risk</h1>
      <Banner kind="live">
        NWS forecast, USGS earthquakes, AirNow (preliminary), and NOAA GHCND when ingest runs with
        keys. AirNow must not be used for regulation.
      </Banner>
      <div className="grid stats">
        <Stat label="NWS" value={wx ? `${wx.shortForecast} ${wx.temperatureF}°F` : 'n/a'} />
        <Stat label="USGS M≥2.5 (40 km)" value={num(warehouse.earthquakes.length)} />
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
      <ul>
        {warehouse.weather.map((w) => (
          <li key={w.startTime}>
            {w.name}: {w.shortForecast}, {w.temperatureF}°F, {w.wind}
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
      <ul>
        {warehouse.earthquakes.map((e) => (
          <li key={e.id}>
            M{e.mag.toFixed(1)} — {e.place} ({e.time.slice(0, 10)}) — <a href={e.url}>USGS</a>
          </li>
        ))}
      </ul>
      <p>
        <Link to="/reports/environment">Monthly environmental report</Link>
      </p>
    </div>
  )
}
