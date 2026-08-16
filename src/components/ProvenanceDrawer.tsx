import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { CLAIM_LABEL, type Provenance } from '@shared/types.ts'

type Ctx = {
  current: Provenance | null
  open: (p: Provenance) => void
  close: () => void
}

const ProvenanceContext = createContext<Ctx | null>(null)

export function ProvenanceProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Provenance | null>(null)
  const value = useMemo(
    () => ({
      current,
      open: setCurrent,
      close: () => setCurrent(null),
    }),
    [current],
  )
  return (
    <ProvenanceContext.Provider value={value}>
      {children}
      {current ? <Drawer p={current} onClose={() => setCurrent(null)} /> : null}
    </ProvenanceContext.Provider>
  )
}

export function useProvenance(): Ctx {
  const ctx = useContext(ProvenanceContext)
  if (!ctx) throw new Error('ProvenanceProvider missing')
  return ctx
}

function Drawer({ p, onClose }: { p: Provenance; onClose: () => void }) {
  return (
    <aside className="drawer" role="dialog" aria-label="Statistic provenance">
      <button className="btn ghost" type="button" onClick={onClose}>
        Close
      </button>
      <h2>{p.label}</h2>
      <p className="lede">
        {String(p.value)}
        {p.unit ? ` ${p.unit}` : ''}
      </p>
      <p>
        <span className={`pill ${p.claimType}`}>{CLAIM_LABEL[p.claimType]}</span>
        <span className={`pill ${p.dataClass}`}>{p.dataClass}</span>
      </p>
      <dl className="quality">
        <dt>Source</dt>
        <dd>
          {p.sourceName} ({p.sourceId})
        </dd>
        <dt>Dataset</dt>
        <dd>{p.dataset}</dd>
        <dt>Retrieved</dt>
        <dd>{p.retrievedAt}</dd>
        <dt>Geography</dt>
        <dd>{p.geographicFilter}</dd>
        <dt>Period</dt>
        <dd>
          {p.timePeriod.start} → {p.timePeriod.end}
        </dd>
        <dt>Transformation</dt>
        <dd>{p.transformation}</dd>
        <dt>Query</dt>
        <dd>
          <pre>{JSON.stringify(p.query, null, 2)}</pre>
        </dd>
        <dt>Limitations</dt>
        <dd>
          <ul>
            {p.limitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </dd>
      </dl>
    </aside>
  )
}
