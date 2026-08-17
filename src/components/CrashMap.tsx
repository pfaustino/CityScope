import { useMemo, useState } from 'react'
import { CircleMarker, LayerGroup, MapContainer, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { TIMS_SEVERITY, timsLabel } from '@shared/switrs.ts'
import type { Collision } from '@shared/types.ts'

const SEVERITY_COLOR: Record<string, string> = {
  '1': '#7a1f1f',
  '2': '#b4532a',
  '3': '#8a5310',
  '4': '#5e574a',
  '0': '#8a8478',
}

const CITY_STROKE: Record<string, string> = {
  BURBANK: '#132f3c',
  GLENDALE: '#1f4d62',
}

export function CrashMap({ rows }: { rows: Collision[] }) {
  const cities = useMemo(() => {
    const set = new Set(rows.map((c) => c.city))
    return [...set].sort()
  }, [rows])
  const [on, setOn] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(cities.map((city) => [city, city === 'BURBANK' || cities.length === 1])),
  )
  const mapped = rows.filter((c) => {
    if (c.geo.lat == null || c.geo.lng == null) return false
    return Boolean(on[c.city])
  })
  const center = mapped[0]
    ? ([mapped[0].geo.lat as number, mapped[0].geo.lng as number] as [number, number])
    : ([34.1808, -118.309] as [number, number])
  const zoom = cities.length > 1 && Object.values(on).filter(Boolean).length > 1 ? 12 : 13

  return (
    <>
      <div className="layers">
        {cities.map((city) => (
          <label key={city}>
            <input
              type="checkbox"
              checked={Boolean(on[city])}
              onChange={() => setOn((s) => ({ ...s, [city]: !s[city] }))}
            />{' '}
            {titleCase(city)} points
          </label>
        ))}
      </div>
      <p className="meta">
        Official SWITRS/TIMS rows with LATITUDE/LONGITUDE or POINT_Y/POINT_X. Crime points are not
        shown. Color is TIMS collision severity; outline is city. Glendale is off by default when
        Burbank is also loaded so the two extracts are not visually mixed.
      </p>
      <ul className="legend">
        {Object.entries(TIMS_SEVERITY)
          .filter(([code]) => code !== '0')
          .map(([code, label]) => (
            <li key={code}>
              <span className="swatch" style={{ background: SEVERITY_COLOR[code] }} />
              {code} {label}
            </li>
          ))}
      </ul>
      <div className="map-root crash-map">
        <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer
            attribution="&copy; OpenStreetMap &copy; CARTO"
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <LayerGroup>
            {mapped.map((c) => (
              <CircleMarker
                key={`${c.city}-${c.id}`}
                center={[c.geo.lat as number, c.geo.lng as number]}
                radius={5}
                pathOptions={{
                  color: CITY_STROKE[c.city] ?? '#132f3c',
                  fillColor: SEVERITY_COLOR[c.severityCode] ?? '#5e574a',
                  weight: 1,
                  fillOpacity: 0.4,
                }}
              >
                <Popup>
                  <strong>{titleCase(c.city)}</strong>
                  <br />
                  {c.date}
                  {c.hour != null ? ` · ${String(c.hour).padStart(2, '0')}:00` : ''}
                  <br />
                  {timsLabel(TIMS_SEVERITY, c.severityCode)}
                  <br />
                  {c.intersection}
                  <br />
                  Killed {c.killed} · injured {c.injured}
                </Popup>
              </CircleMarker>
            ))}
          </LayerGroup>
        </MapContainer>
      </div>
    </>
  )
}

function titleCase(city: string): string {
  return city.slice(0, 1) + city.slice(1).toLowerCase()
}
