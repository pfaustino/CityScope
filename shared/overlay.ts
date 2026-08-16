import type { LiveOverlay, Warehouse } from './types.ts'

export function applyOverlay(base: Warehouse, overlay: LiveOverlay): Warehouse {
  const next: Warehouse = {
    ...base,
    generatedAt: overlay.retrievedAt || base.generatedAt,
    airQuality: overlay.airQuality ?? base.airQuality,
    climate: overlay.climate ?? base.climate,
    crimeAnnual: overlay.crimeAnnual && overlay.crimeAnnual.length > 0 ? overlay.crimeAnnual : base.crimeAnnual,
    fbiAnnual: overlay.fbiAnnual && overlay.fbiAnnual.length > 0 ? overlay.fbiAnnual : base.fbiAnnual,
    collisions: overlay.collisions && overlay.collisions.length > 0 ? overlay.collisions : base.collisions,
    collisionsFile: overlay.collisionsFile ?? base.collisionsFile,
  }
  if (overlay.census && overlay.census.length > 0) {
    const liveYears = new Set(overlay.census.map((c) => c.year))
    next.census = [...overlay.census, ...base.census.filter((c) => !liveYears.has(c.year))]
    const acs2023 = next.census.find((c) => c.year === '2023')
    if (acs2023) next.populationForRates = acs2023.population
  }
  if (overlay.weather && overlay.weather.length > 0) next.weather = overlay.weather
  if (overlay.earthquakes && overlay.earthquakes.length > 0) next.earthquakes = overlay.earthquakes
  return next
}
