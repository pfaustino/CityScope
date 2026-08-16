import { sourceById } from './catalog.ts'
import type { ClaimType, DataClass, Provenance } from './types.ts'

let seq = 0

export function makeProvenance(input: {
  label: string
  value: number | string
  unit?: string
  sourceId: string
  dataset: string
  query?: Record<string, string>
  geographicFilter?: string
  timePeriod: { start: string; end: string }
  transformation: string
  claimType: ClaimType
  dataClass: DataClass
  limitations?: string[]
  retrievedAt?: string
}): Provenance {
  seq += 1
  const source = sourceById(input.sourceId)
  return {
    statisticId: `stat-${seq}`,
    label: input.label,
    value: input.value,
    unit: input.unit,
    sourceId: input.sourceId,
    sourceName: source?.name ?? input.sourceId,
    dataset: input.dataset,
    retrievedAt: input.retrievedAt ?? new Date().toISOString(),
    query: input.query ?? {},
    geographicFilter: input.geographicFilter ?? 'City of Burbank, California',
    timePeriod: input.timePeriod,
    transformation: input.transformation,
    claimType: input.claimType,
    dataClass: input.dataClass,
    limitations: input.limitations ?? [],
  }
}

export function resetProvenanceSeq(): void {
  seq = 0
}
