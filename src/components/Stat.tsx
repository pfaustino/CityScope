import type { Provenance } from '@shared/types.ts'
import { useProvenance } from './ProvenanceDrawer.tsx'

export function Stat({
  label,
  value,
  meta,
  provenance,
}: {
  label: string
  value: string
  meta?: string
  provenance?: Provenance
}) {
  const { open } = useProvenance()
  return (
    <button
      type="button"
      className="stat"
      onClick={() => {
        if (provenance) open(provenance)
      }}
      disabled={!provenance}
    >
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {meta ? <div className="meta">{meta}</div> : null}
    </button>
  )
}

export function Banner({
  kind,
  children,
}: {
  kind: 'demo' | 'live' | 'restricted'
  children: React.ReactNode
}) {
  return <div className={`banner ${kind}`}>{children}</div>
}
