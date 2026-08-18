import type { LiveOverlay, Warehouse } from './types.ts'

export function applyOverlay(base: Warehouse, overlay: LiveOverlay): Warehouse {
  const next: Warehouse = {
    ...base,
    generatedAt: overlay.retrievedAt || base.generatedAt,
    airQuality: overlay.airQuality ?? base.airQuality,
    climate: overlay.climate ?? base.climate,
    crimeAnnual: overlay.crimeAnnual && overlay.crimeAnnual.length > 0 ? overlay.crimeAnnual : base.crimeAnnual,
    fbiAnnual: overlay.fbiAnnual && overlay.fbiAnnual.length > 0 ? overlay.fbiAnnual : base.fbiAnnual,
    crimeAnnualGlendale:
      overlay.crimeAnnualGlendale && overlay.crimeAnnualGlendale.length > 0
        ? overlay.crimeAnnualGlendale
        : base.crimeAnnualGlendale,
    fbiAnnualGlendale:
      overlay.fbiAnnualGlendale && overlay.fbiAnnualGlendale.length > 0
        ? overlay.fbiAnnualGlendale
        : base.fbiAnnualGlendale,
    collisions: overlay.collisions && overlay.collisions.length > 0 ? overlay.collisions : base.collisions,
    collisionsFile: overlay.collisionsFile ?? base.collisionsFile,
    collisionsGlendale:
      overlay.collisionsGlendale && overlay.collisionsGlendale.length > 0
        ? overlay.collisionsGlendale
        : base.collisionsGlendale,
    collisionsGlendaleFile: overlay.collisionsGlendaleFile ?? base.collisionsGlendaleFile,
    hateCrimeEvents:
      overlay.hateCrimeEvents && overlay.hateCrimeEvents.length > 0
        ? overlay.hateCrimeEvents
        : base.hateCrimeEvents,
    budgetAnnual: overlay.budgetAnnual ?? base.budgetAnnual,
    payments: overlay.payments ?? base.payments,
  }
  if (overlay.census && overlay.census.length > 0) {
    const liveYears = new Set(overlay.census.map((c) => c.year))
    next.census = [...overlay.census, ...base.census.filter((c) => !liveYears.has(c.year))]
    const acs2023 = next.census.find((c) => c.year === '2023')
    if (acs2023) next.populationForRates = acs2023.population
  }
  if (overlay.censusGlendale && overlay.censusGlendale.length > 0) {
    const liveYears = new Set(overlay.censusGlendale.map((c) => c.year))
    next.censusGlendale = [
      ...overlay.censusGlendale,
      ...base.censusGlendale.filter((c) => !liveYears.has(c.year)),
    ]
    const acs2023 = next.censusGlendale.find((c) => c.year === '2023')
    if (acs2023) next.populationGlendaleForRates = acs2023.population
  }
  if (overlay.weather && overlay.weather.length > 0) next.weather = overlay.weather
  if (overlay.earthquakes && overlay.earthquakes.length > 0) next.earthquakes = overlay.earthquakes
  return next
}
