import { useEffect, useState, type ReactNode } from 'react'
import { ACCESS_LABEL, STATUS_LABEL, type SourceStatus } from '@shared/types.ts'
import { SOURCES, statusFor, type SourceLiveRow } from '@shared/catalog.ts'
import { Banner } from '../components/Stat.tsx'
import { fetchLiveOrBaked } from '../lib/staticFiles.ts'

type Access = {
  CENSUS_API_KEY: boolean
  NOAA_CDO_TOKEN: boolean
  AIRNOW_API_KEY: boolean
  DATA_GOV_API_KEY: boolean
  signup: { census: string; noaa: string; airnow: string; fbiCde: string }
}

function fallbackRows(): SourceLiveRow[] {
  return SOURCES.map((s) => ({ ...s, status: statusFor(s), statusDetail: null }))
}

function accessLinkLabel(status: SourceStatus): string | null {
  switch (status) {
    case 'connected':
      return null
    case 'needs_api_key':
    case 'key_invalid':
      return 'Request API key'
    case 'needs_registration':
      return 'Register for access'
    case 'needs_cpra':
      return 'Submit a CPRA request'
    case 'restricted':
      return 'How access could be obtained'
    case 'unavailable':
      return 'Open the dataset portal'
    default:
      return 'Request access'
  }
}

function LinkedHowTo({ text }: { text: string }) {
  const nodes: ReactNode[] = []
  const re = /https?:\/\/[^\s]+/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    const raw = match[0]
    const href = raw.replace(/[),.;:]+$/g, '')
    if (match.index > last) nodes.push(text.slice(last, match.index))
    nodes.push(
      <a key={`${href}-${match.index}`} href={href}>
        {href}
      </a>,
    )
    last = match.index + href.length
    if (raw.length > href.length) {
      nodes.push(raw.slice(href.length))
      last = match.index + raw.length
    }
  }
  if (last < text.length) nodes.push(text.slice(last))
  return <>{nodes}</>
}

export function SourcesPage() {
  const [ingest, setIngest] = useState('')
  const [access, setAccess] = useState<Access | null>(null)
  const [rows, setRows] = useState<SourceLiveRow[] | null>(null)
  const [apiUp, setApiUp] = useState(false)

  useEffect(() => {
    void fetch('/api/health')
      .then((res) => setApiUp(res.ok))
      .catch(() => setApiUp(false))
    void fetch('/api/access')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('access'))))
      .then((body: Access) => setAccess(body))
      .catch(() => setAccess(null))
    void fetchLiveOrBaked<SourceLiveRow[]>('/api/sources', 'sources.json').then((body) => {
      setRows(body ?? fallbackRows())
    })
  }, [])

  return (
    <div className="page">
      <h1>Data sources</h1>
      <Banner kind="live">
        Phase 1 priority: Burbank GIS, business, permits, finance, police, Census, CA open data, LA
        County GIS, NOAA/NWS, USGS. Flock/ALPR stays restricted.
      </Banner>
      <section className="card">
        <h2>{apiUp ? 'API keys on this machine' : 'Published snapshots'}</h2>
        {apiUp && access ? (
          <ul>
            <li>
              Census: {access.CENSUS_API_KEY ? 'set' : 'missing'} —{' '}
              <a href={access.signup.census}>request key</a>
            </li>
            <li>
              NOAA CDO: {access.NOAA_CDO_TOKEN ? 'set' : 'missing'} —{' '}
              <a href={access.signup.noaa}>request token</a>
            </li>
            <li>
              AirNow: {access.AIRNOW_API_KEY ? 'set' : 'missing'} —{' '}
              <a href={access.signup.airnow}>request account</a>
            </li>
            <li>
              FBI CDE: {access.DATA_GOV_API_KEY ? 'set' : 'missing'} —{' '}
              <a href={access.signup.fbiCde}>request api.data.gov key</a>
            </li>
          </ul>
        ) : (
          <p>
            This public site reads baked snapshots (OpenJustice, SWITRS/Crashes.csv, Census, USGS,
            NWS, and other already-ingested public series). Live keyed ingest (Census / NOAA /
            AirNow / FBI CDE) stays on a local machine with `.env` — never in the browser bundle.
            Run `npm run ingest` locally to refresh snapshots, then rebuild.
          </p>
        )}
      </section>
      {apiUp ? (
        <p>
          <button
            className="btn"
            type="button"
            onClick={async () => {
              setIngest('Running…')
              try {
                const res = await fetch('/api/ingest', { method: 'POST' })
                const body: unknown = await res.json()
                setIngest(JSON.stringify(body, null, 2))
              } catch (err) {
                setIngest(err instanceof Error ? err.message : String(err))
              }
            }}
          >
            Run live ingest (USGS, NWS, Census, NOAA)
          </button>
        </p>
      ) : null}
      {ingest ? <pre>{ingest}</pre> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Status</th>
              <th>Authentication</th>
              <th>Frequency</th>
              <th>Last update</th>
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <tr>
                <td colSpan={5}>Loading live source status…</td>
              </tr>
            ) : (
              rows.map((s) => {
                const st: SourceStatus = s.status
                const accessLabel = accessLinkLabel(st)
                return (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.name}</strong>
                      <div className="meta">
                        {s.agency} · <a href={s.url}>{s.url}</a>
                      </div>
                      {accessLabel ? (
                        <div className="meta">
                          <a href={s.url}>{accessLabel}</a>
                        </div>
                      ) : null}
                      <div className="meta">
                        <LinkedHowTo text={s.howToObtain} />
                      </div>
                    </td>
                    <td>
                      <span className={`status ${st}`} />
                      {STATUS_LABEL[st]}
                      {s.statusDetail ? <div className="meta">{s.statusDetail}</div> : null}
                    </td>
                    <td>{ACCESS_LABEL[s.legalAccess]}</td>
                    <td>{s.updateFrequency}</td>
                    <td>{s.lastSuccessfulRetrieval ?? '—'}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
