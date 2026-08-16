import { useState } from 'react'
import { CITY } from '@shared/types.ts'
import { CircleMarker, LayerGroup, MapContainer, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useCityData } from '../lib/data.ts'

type LayerKey = 'earthquakes' | 'airport' | 'collisions'

const SEVERITY_COLOR: Record<string, string> = {
  fatal: '#7a1f1f',
  injury: '#b4532a',
  property: '#5e574a',
}

export function CityMap() {
  const { warehouse } = useCityData()
  const mappedCollisions = warehouse.collisions.filter(
    (c) => c.geo.lat != null && c.geo.lng != null,
  )
  const [on, setOn] = useState<Record<LayerKey, boolean>>({
    earthquakes: true,
    airport: true,
    collisions: true,
  })

  return (
    <>
      <div className="layers">
        {(Object.keys(on) as LayerKey[]).map((k) => (
          <label key={k}>
            <input
              type="checkbox"
              checked={on[k]}
              onChange={() => setOn((s) => ({ ...s, [k]: !s[k] }))}
            />{' '}
            {k}
          </label>
        ))}
      </div>
      <p className="meta">
        Collision points are official SWITRS/TIMS rows with coordinates. Crime, business, and
        permit layers stay omitted. Airport marker is the BUR coordinates, not passenger volume.
      </p>
      <div className="map-root">
        <MapContainer
          center={[CITY.center.lat, CITY.center.lng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution="&copy; OpenStreetMap &copy; CARTO"
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <LayerGroup>
            {on.earthquakes
              ? warehouse.earthquakes.map((e) => (
                  <CircleMarker
                    key={e.id}
                    center={[e.lat, e.lng]}
                    radius={8}
                    pathOptions={{ color: '#132f3c', weight: 2, fillOpacity: 0.2 }}
                  >
                    <Popup>
                      M{e.mag.toFixed(1)} — {e.place}
                      <br />
                      <a href={e.url}>USGS event</a>
                    </Popup>
                  </CircleMarker>
                ))
              : null}
            {on.collisions
              ? mappedCollisions.map((c) => (
                  <CircleMarker
                    key={c.id}
                    center={[c.geo.lat as number, c.geo.lng as number]}
                    radius={5}
                    pathOptions={{
                      color: SEVERITY_COLOR[c.severity] ?? '#5e574a',
                      weight: 1,
                      fillOpacity: 0.35,
                    }}
                  >
                    <Popup>
                      {c.date} · {c.severity}
                      <br />
                      {c.intersection}
                    </Popup>
                  </CircleMarker>
                ))
              : null}
            {on.airport ? (
              <CircleMarker
                center={[34.2006, -118.3587]}
                radius={14}
                pathOptions={{ color: '#5e574a', weight: 2, fillOpacity: 0.15 }}
              >
                <Popup>Hollywood Burbank Airport (BUR)</Popup>
              </CircleMarker>
            ) : null}
          </LayerGroup>
        </MapContainer>
      </div>
    </>
  )
}
