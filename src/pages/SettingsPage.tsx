import { CITY } from '@shared/types.ts'

export function SettingsPage() {
  return (
    <div className="page">
      <h1>Settings</h1>
      <p className="lede">
        Default geography is the City of {CITY.name}, {CITY.state}. Architecture allows later
        expansion to Glendale, Pasadena, Los Angeles, the San Fernando Valley, Los Angeles County,
        and California.
      </p>
      <dl className="quality">
        <dt>Default city</dt>
        <dd>
          {CITY.name}, {CITY.state} (locked for this release)
        </dd>
        <dt>Census API key</dt>
        <dd>Set CENSUS_API_KEY in the environment, then run ingest. Live ACS is not required for snapshots.</dd>
        <dt>NOAA CDO token</dt>
        <dd>Set NOAA_CDO_TOKEN when adding the climate-archive connector. Forecast uses public NWS.</dd>
        <dt>AI narratives</dt>
        <dd>
          This release uses rule-based interpretation tied to computed statistics only. It will not
          invent facts or sources. An optional model key can be added later without changing source
          data.
        </dd>
        <dt>Privacy</dt>
        <dd>Do not publish names of private individuals unless the underlying source is already lawfully public.</dd>
      </dl>
    </div>
  )
}
