import { Link } from 'react-router-dom'
import {
  BURBANK_HATE_CRIME_NCIC,
  HATE_CRIME_2023_LIMITATION,
  HATE_CRIME_BLANK_CELL,
  HATE_CRIME_COLUMNS_USED,
  HATE_CRIME_SMALL_N_LIMITATION,
  hateCrimeAnnual,
  hateCrimeBiasTypeCounts,
  hateCrimeEventProvenance,
  hateCrimeLocationCounts,
  hateCrimeMonthCounts,
  hateCrimeOffensiveActCounts,
  hateCrimeSumProvenance,
  hateCrimeUcrCounts,
  hateCrimeWeaponCounts,
  monthOccurrenceLabel,
  type HateCrimeCountRow,
} from '@shared/hateCrime.ts'
import { CLAIM_LABEL } from '@shared/types.ts'
import { CountChart } from '../components/MonthChart.tsx'
import { Banner, Stat } from '../components/Stat.tsx'
import { num, useCityData } from '../lib/data.ts'

const BIAS_TYPE_COUNT_CAP = 30
const SMALL_N = 20

export function HateCrimesPage() {
  const { warehouse } = useCityData()
  const events = warehouse.hateCrimeEvents
  if (events.length === 0) {
    return (
      <div className="page">
        <h1>Hate crimes</h1>
        <p>
          OpenJustice hate-crime events for Burbank PD (NCIC {BURBANK_HATE_CRIME_NCIC}) are not loaded
          yet. Start the API or run ingest, then bake.
        </p>
        <p>
          <Link to="/crime">Crime & public safety</Link>
          {' · '}
          <Link to="/sources">Data sources</Link>
        </p>
      </div>
    )
  }
  const years = hateCrimeAnnual(events)
  const latestYear = years[0]
  const biasRows =
    latestYear && latestYear.events > 0 && latestYear.events <= BIAS_TYPE_COUNT_CAP
      ? hateCrimeBiasTypeCounts(events, latestYear.year)
      : []
  const eventProv = hateCrimeEventProvenance(events, warehouse.generatedAt, latestYear?.year)
  const allEventProv = hateCrimeEventProvenance(events, warehouse.generatedAt)
  const victimProv =
    latestYear != null
      ? hateCrimeSumProvenance(events, warehouse.generatedAt, latestYear.year, 'victims', latestYear.victims)
      : undefined
  const suspectProv =
    latestYear != null
      ? hateCrimeSumProvenance(events, warehouse.generatedAt, latestYear.year, 'suspects', latestYear.suspects)
      : undefined
  const monthAll = hateCrimeMonthCounts(events)
  const monthLatest = latestYear ? hateCrimeMonthCounts(events, latestYear.year) : []
  const newestFirst = [...events].sort(
    (a, b) => b.year - a.year || b.month - a.month || a.id.localeCompare(b.id),
  )
  return (
    <div className="page">
      <h1>Hate crimes</h1>
      <p className="lede">
        Reported hate-crime events from CA DOJ OpenJustice for Burbank PD (NCIC {BURBANK_HATE_CRIME_NCIC}
        ). The CSV has no city name and no coordinates. These are not geocoded incidents and not a
        finding about a group or about BPD.
      </p>
      <Banner kind="live">
        Event counts are {CLAIM_LABEL.fact} (CSV rows after NCIC={BURBANK_HATE_CRIME_NCIC}). Victim and
        suspect totals are {CLAIM_LABEL.calculation} (sums of event fields). Month, location, weapon,
        UCR, and offensive act are CSV cells, not neighborhoods or map points.
      </Banner>
      <p>
        <span className="pill fact">{CLAIM_LABEL.fact}</span>
        <span className="pill calculation">{CLAIM_LABEL.calculation}</span>
        <span className="pill snapshot">snapshot</span>
      </p>
      {latestYear ? (
        <div className="grid stats">
          <Stat
            label={`${latestYear.year} events`}
            value={num(latestYear.events)}
            meta={smallNMeta(latestYear.events)}
            provenance={eventProv}
          />
          <Stat
            label={`${latestYear.year} victims (sum)`}
            value={num(latestYear.victims)}
            provenance={victimProv}
          />
          <Stat
            label={`${latestYear.year} suspects (sum)`}
            value={num(latestYear.suspects)}
            provenance={suspectProv}
          />
          <Stat
            label="Events (all ClosedYear)"
            value={num(events.length)}
            provenance={allEventProv}
          />
        </div>
      ) : null}
      <h2>Annual counts (ClosedYear)</h2>
      <p className="meta">
        {CLAIM_LABEL.fact} for events. Victims and suspects are {CLAIM_LABEL.calculation.toLowerCase()}s.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th>Events</th>
              <th>Victims (sum)</th>
              <th>Suspects (sum)</th>
            </tr>
          </thead>
          <tbody>
            {years.map((row) => (
              <tr key={`hate-${row.year}`}>
                <td>
                  {row.year}
                  {row.events > 0 && row.events < SMALL_N ? (
                    <span className="meta"> · small n</span>
                  ) : null}
                </td>
                <td>{num(row.events)}</td>
                <td>{num(row.victims)}</td>
                <td>{num(row.suspects)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {latestYear && biasRows.length > 0 ? (
        <>
          <h2>{latestYear.year} by most serious bias type</h2>
          <p className="meta">
            CSV MostSeriousBiasType. Counts, not percentages. {smallNMeta(latestYear.events)}.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Most serious bias type</th>
                  <th>Events</th>
                </tr>
              </thead>
              <tbody>
                {biasRows.map((row) => (
                  <tr key={row.biasType}>
                    <td>{row.biasType}</td>
                    <td>{num(row.events)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
      <h2>Month of occurrence (MonthOccurrence)</h2>
      <p className="meta">
        Numeric month from the CSV (1 = January … 12 = December). {CLAIM_LABEL.fact} row counts. Latest
        ClosedYear zeros mean no row in that month in this file, not a finding that none occurred.
      </p>
      <CountChart data={monthAll.map((row) => ({ label: String(row.month), value: row.events }))} />
      <DualCountTable
        field="MonthOccurrence"
        latestYear={latestYear?.year}
        rows={mergeMonthCounts(monthAll, monthLatest)}
      />
      <h2>Location (MostSeriousLocation)</h2>
      <p className="meta">
        Location category in the CSV, not an address or map point. The file has no coordinates.
      </p>
      <DualCountTable
        field="MostSeriousLocation"
        latestYear={latestYear?.year}
        rows={mergeCounts(hateCrimeLocationCounts(events), hateCrimeLocationCounts(events, latestYear?.year))}
      />
      <h2>Weapon (WeaponType)</h2>
      <p className="meta">
        {HATE_CRIME_BLANK_CELL} means the WeaponType cell was empty. That is not the same as CSV value
        “Unknown” or “None (Mutually Exclusive).”
      </p>
      <DualCountTable
        field="WeaponType"
        latestYear={latestYear?.year}
        rows={mergeCounts(hateCrimeWeaponCounts(events), hateCrimeWeaponCounts(events, latestYear?.year))}
      />
      <h2>Most serious UCR (MostSeriousUcr)</h2>
      <p className="meta">Offense category already on each ingested event. Not a CityScope grouping.</p>
      <DualCountTable
        field="MostSeriousUcr"
        latestYear={latestYear?.year}
        rows={mergeCounts(hateCrimeUcrCounts(events), hateCrimeUcrCounts(events, latestYear?.year))}
      />
      <h2>Offensive act (Offensive_Act)</h2>
      <p className="meta">CSV Offensive_Act as written. {HATE_CRIME_BLANK_CELL} means the cell was empty.</p>
      <DualCountTable
        field="Offensive_Act"
        latestYear={latestYear?.year}
        rows={mergeCounts(
          hateCrimeOffensiveActCounts(events),
          hateCrimeOffensiveActCounts(events, latestYear?.year),
        )}
      />
      <h2>Events with month, location, and weapon</h2>
      <p className="meta">
        One row per reported event. Newest ClosedYear first. No map: the file has no coordinates.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ClosedYear</th>
              <th>MonthOccurrence</th>
              <th>MostSeriousLocation</th>
              <th>WeaponType</th>
              <th>MostSeriousUcr</th>
              <th>Offensive_Act</th>
              <th>MostSeriousBiasType</th>
              <th>Victims</th>
              <th>Suspects</th>
            </tr>
          </thead>
          <tbody>
            {newestFirst.map((event) => (
              <tr key={event.id}>
                <td>{event.year}</td>
                <td>{monthOccurrenceLabel(event.month)}</td>
                <td>{displayCell(event.mostSeriousLocation)}</td>
                <td>{displayCell(event.weaponType)}</td>
                <td>{displayCell(event.mostSeriousUcr)}</td>
                <td>{displayCell(event.offensiveAct)}</td>
                <td>{displayCell(event.mostSeriousBiasType)}</td>
                <td>{num(event.victims)}</td>
                <td>{num(event.suspects)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>Columns used</h2>
      <p className="meta">
        Parsed from the OpenJustice header, not invented: {HATE_CRIME_COLUMNS_USED.join(', ')}. Other
        CSV columns (including individual-victim splits, suspect race/ethnicity group, UCR type, victim
        type, and multiple-bias flag) are not charted.
      </p>
      <p className="meta">
        {HATE_CRIME_SMALL_N_LIMITATION} {HATE_CRIME_2023_LIMITATION} 2024 CSV counts are 9 events, 9
        victims, and 6 suspects, matching Table 6’s events/victims/suspects (Table 6 also lists 9
        offenses). CityScope displays the CSV and does not silently pick the printed table. ClosedYear
        2025 in this file may be incomplete.
      </p>
      <p>
        <Link to="/crime">Crime & public safety (agency totals)</Link>
        {' · '}
        <Link to="/sources">Data sources</Link>
      </p>
    </div>
  )
}

type DualRow = { label: string; allYears: number; latest: number }

function DualCountTable({
  field,
  latestYear,
  rows,
}: {
  field: string
  latestYear?: number
  rows: DualRow[]
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{field}</th>
            <th>All ClosedYear</th>
            <th>{latestYear != null ? `${latestYear}` : 'Latest year'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td>{num(row.allYears)}</td>
              <td>{num(row.latest)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function mergeCounts(all: HateCrimeCountRow[], latest: HateCrimeCountRow[]): DualRow[] {
  const latestMap = new Map(latest.map((row) => [row.label, row.events]))
  return all.map((row) => ({
    label: row.label,
    allYears: row.events,
    latest: latestMap.get(row.label) ?? 0,
  }))
}

function mergeMonthCounts(
  all: { month: number; label: string; events: number }[],
  latest: { month: number; events: number }[],
): DualRow[] {
  const latestMap = new Map(latest.map((row) => [row.month, row.events]))
  return all.map((row) => ({
    label: row.label,
    allYears: row.events,
    latest: latestMap.get(row.month) ?? 0,
  }))
}

function displayCell(value: string): string {
  return value.trim() ? value : '—'
}

function smallNMeta(n: number): string | undefined {
  if (n > 0 && n < SMALL_N) return `Small n (${n})`
  return undefined
}
