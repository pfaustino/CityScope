import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { gapFor } from '@shared/accessGaps.ts'
import { topN } from '@shared/analysis.ts'
import {
  collisionsProvenance,
  glendaleCollisionsProvenance,
  hourBars,
  rollupCollisions,
  shareOf,
  SWITRS_COLUMNS_USED,
  TIMS_COLLISION_TYPE,
  TIMS_HIT_AND_RUN,
  TIMS_LIGHTING,
  TIMS_PCF_CATEGORY,
  TIMS_SEVERITY,
  TIMS_WEATHER,
  timsLabel,
  weekdayBars,
  yearBars,
} from '@shared/switrs.ts'
import { CLAIM_LABEL, type Collision, type Provenance } from '@shared/types.ts'
import { AccessPanel } from '../components/AccessPanel.tsx'
import { CountChart } from '../components/MonthChart.tsx'
import { Banner, Stat } from '../components/Stat.tsx'
import { num, useCityData } from '../lib/data.ts'

const CrashMap = lazy(() => import('../components/CrashMap.tsx').then((m) => ({ default: m.CrashMap })))

const SMALL_N = 20

export function CrashesPage() {
  const { warehouse } = useCityData()
  const gap = gapFor('collisions')
  const burbank = warehouse.collisions
  const glendale = warehouse.collisionsGlendale
  if (burbank.length === 0 && glendale.length === 0) {
    if (!gap) return null
    return (
      <div className="page">
        <h1>Crashes</h1>
        <AccessPanel gap={gap} />
      </div>
    )
  }
  const burbankFile = warehouse.collisionsFile ?? 'Crashes.csv'
  const glendaleFile = warehouse.collisionsGlendaleFile ?? 'Crashes-Glendale.csv'
  const burbankProv = collisionsProvenance(warehouse, burbankFile)
  const glendaleProv =
    glendale.length > 0 ? glendaleCollisionsProvenance(warehouse, glendaleFile) : null
  const mapRows = [...burbank, ...glendale]
  return (
    <div className="page">
      <h1>Crashes</h1>
      <p className="lede">
        SWITRS/TIMS collision records from local extracts. Burbank and Glendale are labeled and
        totaled separately. Not demonstration data. Not a live CAD feed.
      </p>
      <Banner kind="live">
        {CLAIM_LABEL.fact} / snapshot. These extracts have no property-damage-only (PDO) rows —
        severity codes are fatal, severe injury, other visible injury, and complaint of pain.
        Correlation is not causation. Counts without traffic volume are not a dangerous-intersection
        finding.
      </Banner>
      <p>
        <span className="pill fact">{CLAIM_LABEL.fact}</span>
        <span className="pill calculation">{CLAIM_LABEL.calculation}</span>
        <span className="pill snapshot">snapshot</span>
      </p>
      {mapRows.some((c) => c.geo.lat != null) ? (
        <>
          <h2>Mapped collisions</h2>
          <Suspense fallback={<p>Loading map…</p>}>
            <CrashMap rows={mapRows} />
          </Suspense>
        </>
      ) : null}
      {burbank.length > 0 ? (
        <CitySection
          city="Burbank"
          fileName={burbankFile}
          rows={burbank}
          provenance={burbankProv}
          showYear={false}
        />
      ) : null}
      {glendale.length > 0 && glendaleProv ? (
        <CitySection
          city="Glendale"
          fileName={glendaleFile}
          rows={glendale}
          provenance={glendaleProv}
          showYear
        />
      ) : null}
      <h2>Columns used</h2>
      <p className="meta">
        Parsed from the TIMS header, not invented: {SWITRS_COLUMNS_USED.join(', ')}. Other columns in
        the files (officer ID, beat, Caltrans postmile, ramps, and similar) are not charted.
      </p>
      <p>
        <Link to="/map">City map (Burbank collisions with USGS and BUR)</Link>
        {' · '}
        <Link to="/reports/transport">Transportation report</Link>
      </p>
    </div>
  )
}

function CitySection({
  city,
  fileName,
  rows,
  provenance,
  showYear,
}: {
  city: string
  fileName: string
  rows: Collision[]
  provenance: Provenance
  showYear: boolean
}) {
  const roll = rollupCollisions(rows)
  const pdo = roll.bySeverityCode['0'] ?? 0
  const fatal = roll.bySeverityCode['1'] ?? 0
  const intersections = topN(roll.byIntersection, 12)
  return (
    <section>
      <h2>
        {city}{' '}
        <span className="meta">
          ({fileName}
          {roll.dates ? `; ${roll.dates.start} to ${roll.dates.end}` : ''})
        </span>
      </h2>
      <div className="grid stats">
        <Stat label={`${city} records`} value={num(roll.n)} provenance={provenance} />
        <Stat label="Mapped (lat/lng)" value={num(roll.mapped)} />
        <Stat label="Counted only (no coordinates)" value={num(roll.unmapped)} />
        <Stat
          label="People killed (sum of NUMBER_KILLED)"
          value={num(roll.killed)}
          meta={smallNMeta(roll.killed)}
        />
        <Stat label="People injured (sum of NUMBER_INJURED)" value={num(roll.injured)} />
        <Stat
          label="Fatal (severity 1)"
          value={num(fatal)}
          meta={smallNMeta(fatal)}
        />
        <Stat label="PDO (severity 0)" value={num(pdo)} meta={pdo === 0 ? 'None in this extract' : undefined} />
      </div>
      <h3>Severity (TIMS COLLISION_SEVERITY)</h3>
      <p className="meta">
        {CLAIM_LABEL.fact}. Code 0 is PDO and is absent here. Codes 2–4 are injury, not a single
        “injury” invented by CityScope. Fatal n={fatal} is a small count.
      </p>
      <CodeTable
        counts={roll.bySeverityCode}
        labels={TIMS_SEVERITY}
        order={['1', '2', '3', '4', '0']}
        total={roll.n}
      />
      <h3>Party flags and hit-and-run</h3>
      <p className="meta">
        Flag columns are Y or blank in TIMS. Percents are {CLAIM_LABEL.calculation.toLowerCase()}s
        (count ÷ {city} records). Blank is not charted as “no.”
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Yes (Y)</th>
              <th>Share of {city} records</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            <FlagRow field="ALCOHOL_INVOLVED" n={roll.alcohol} total={roll.n} />
            <FlagRow field="PEDESTRIAN_ACCIDENT" n={roll.pedestrian} total={roll.n} />
            <FlagRow field="BICYCLE_ACCIDENT" n={roll.bicycle} total={roll.n} />
            <FlagRow field="MOTORCYCLE_ACCIDENT" n={roll.motorcycle} total={roll.n} />
            <FlagRow field="TRUCK_ACCIDENT" n={roll.truck} total={roll.n} />
            <FlagRow
              field="HIT_AND_RUN (F or M)"
              n={roll.hitAndRun}
              total={roll.n}
              note="Felony + misdemeanor; N is not hit-and-run"
            />
            <FlagRow field="INTERSECTION = Y" n={roll.atIntersection} total={roll.n} />
            <FlagRow field="TOW_AWAY = Y" n={roll.towAway} total={roll.n} />
          </tbody>
        </table>
      </div>
      <h3>Hit-and-run (HIT_AND_RUN)</h3>
      <CodeTable counts={roll.byHitAndRun} labels={TIMS_HIT_AND_RUN} total={roll.n} />
      {showYear && Object.keys(roll.byYear).length > 1 ? (
        <>
          <h3>Year (ACCIDENT_YEAR)</h3>
          <p className="meta">
            {CLAIM_LABEL.fact}. {city} years are not added into Burbank totals.
          </p>
          <CountChart data={yearBars(roll.byYear)} />
          <CodeTable counts={roll.byYear} labels={{}} total={roll.n} />
        </>
      ) : null}
      <h3>Time of day (COLLISION_TIME)</h3>
      <p className="meta">
        Hour parsed from TIMS HHMM. {roll.hourUnknown > 0 ? `${roll.hourUnknown} rows have no usable time and are omitted from the bars. ` : ''}
        {CLAIM_LABEL.fact}.
      </p>
      <CountChart data={hourBars(roll.byHour)} />
      <h3>Day of week (DAY_OF_WEEK)</h3>
      <p className="meta">TIMS convention: 1 = Monday … 7 = Sunday. {CLAIM_LABEL.fact}.</p>
      <CountChart data={weekdayBars(roll.byDayOfWeek)} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Records</th>
            </tr>
          </thead>
          <tbody>
            {weekdayBars(roll.byDayOfWeek).map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td>{num(row.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>Named locations (PRIMARY_RD & SECONDARY_RD)</h3>
      <p className="meta">
        {CLAIM_LABEL.fact} counts at the named pair. Not a ranking of danger. Small-n locations are
        still listed.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Location</th>
              <th>Records</th>
              <th>Killed (sum)</th>
              <th>Injured (sum)</th>
            </tr>
          </thead>
          <tbody>
            {intersections.map(([name, n]) => {
              const here = rows.filter((c) => c.intersection === name)
              const killed = here.reduce((sum, c) => sum + c.killed, 0)
              const injured = here.reduce((sum, c) => sum + c.injured, 0)
              return (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{num(n)}</td>
                  <td>{num(killed)}</td>
                  <td>{num(injured)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <h3>Lighting (LIGHTING)</h3>
      <CodeTable counts={roll.byLighting} labels={TIMS_LIGHTING} total={roll.n} />
      <h3>Weather (WEATHER_1)</h3>
      <CodeTable counts={roll.byWeather} labels={TIMS_WEATHER} total={roll.n} />
      <h3>Type of collision (TYPE_OF_COLLISION)</h3>
      <CodeTable counts={roll.byCollisionType} labels={TIMS_COLLISION_TYPE} total={roll.n} />
      <h3>Primary collision factor (PCF_VIOL_CATEGORY)</h3>
      <p className="meta">
        Coded category from the TIMS extract, not a finding of fault by CityScope. Unlisted codes
        are shown raw.
      </p>
      <CodeTable counts={roll.byPcf} labels={TIMS_PCF_CATEGORY} total={roll.n} />
    </section>
  )
}

function FlagRow({
  field,
  n,
  total,
  note,
}: {
  field: string
  n: number
  total: number
  note?: string
}) {
  const share = shareOf(n, total)
  return (
    <tr>
      <td>{field}</td>
      <td>{num(n)}</td>
      <td>{share ?? '—'}</td>
      <td>{[smallNMeta(n), note].filter(Boolean).join(' · ') || '—'}</td>
    </tr>
  )
}

function CodeTable({
  counts,
  labels,
  total,
  order,
}: {
  counts: Record<string, number>
  labels: Record<string, string>
  total: number
  order?: string[]
}) {
  const keys = order
    ? order.filter((k) => (counts[k] ?? 0) > 0 || k === '0')
    : Object.keys(counts).sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0))
  if (keys.length === 0) return <p className="meta">No values in this extract.</p>
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>TIMS label</th>
            <th>Records</th>
            <th>Share</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((code) => {
            const n = counts[code] ?? 0
            return (
              <tr key={code}>
                <td>{code}</td>
                <td>{Object.keys(labels).length > 0 ? timsLabel(labels, code) : code}</td>
                <td>{num(n)}</td>
                <td>{shareOf(n, total) ?? '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function smallNMeta(n: number): string | undefined {
  if (n > 0 && n < SMALL_N) return `Small n (${n})`
  return undefined
}
