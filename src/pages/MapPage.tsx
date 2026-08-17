import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { Banner } from '../components/Stat.tsx'
import { useCityData } from '../lib/data.ts'

const CityMap = lazy(() => import('../components/CityMap.tsx').then((m) => ({ default: m.CityMap })))

export function MapPage() {
  const { warehouse } = useCityData()
  const mapped = warehouse.collisions.filter((c) => c.geo.lat != null && c.geo.lng != null).length
  const fileName = warehouse.collisionsFile ?? 'Crashes.csv'
  return (
    <div className="page">
      <h1>Map</h1>
      {mapped > 0 ? (
        <Banner kind="live">
          {mapped} SWITRS collisions from {fileName} are plotted (Burbank extract). Crime, business,
          and permit points are not. USGS earthquakes and the BUR airport location are also shown.{' '}
          <Link to="/crashes">Crashes page</Link> has the full TIMS tables and Glendale, separately
          labeled.
        </Banner>
      ) : (
        <Banner kind="restricted">
          Crime, business, permit, and collision points are not plotted. Those feeds are not
          connected. USGS earthquakes and the BUR airport location are shown.
        </Banner>
      )}
      <Suspense fallback={<p>Loading map…</p>}>
        <CityMap />
      </Suspense>
    </div>
  )
}
