import type { Warehouse } from './types.ts'
import { NEIGHBORHOODS } from './geo.ts'

export type EntityKind = 'business' | 'vendor' | 'neighborhood' | 'address' | 'intersection'

export type EntityBundle = {
  kind: EntityKind
  id: string
  title: string
  summary: string[]
  facts: { label: string; value: string }[]
  related: { kind: EntityKind; id: string; label: string }[]
  caveats: string[]
}

export function investigate(wh: Warehouse, kind: EntityKind, id: string): EntityBundle | null {
  if (kind === 'neighborhood') {
    const n = NEIGHBORHOODS.find((x) => x.id === id)
    if (!n) return null
    const crime = wh.crime.filter((c) => c.geo.neighborhood === n.name)
    const biz = wh.businesses.filter((b) => b.geo.neighborhood === n.name)
    const permits = wh.permits.filter((p) => p.geo.neighborhood === n.name)
    const possible = biz.filter((b) => b.status === 'possible_closure')
    return {
      kind,
      id,
      title: n.name,
      summary: [
        crime.length > 0
          ? `${crime.length} official crime records loaded for this neighborhood.`
          : 'No official crime records loaded (none until a public feed is connected).',
        biz.length > 0
          ? `${biz.length} official business records loaded (${possible.length} possible closure).`
          : 'No official business-license records loaded.',
        permits.length > 0
          ? `${permits.length} official permit records loaded.`
          : 'No official permit records loaded.',
      ],
      facts: [
        { label: 'Primary ZIP (approx.)', value: n.zipPrimary },
        { label: 'Centroid', value: `${n.lat.toFixed(4)}, ${n.lng.toFixed(4)}` },
        { label: 'Census tract (approx.)', value: crime[0]?.geo.censusTract ?? 'n/a until geocoded incidents exist' },
      ],
      related: biz.slice(0, 8).map((b) => ({ kind: 'business' as const, id: b.id, label: b.nameOriginal })),
      caveats: [
        'Neighborhood membership is nearest-centroid, not an official boundary file.',
        'Missing crime or license feeds are access gaps, not zero city statistics.',
      ],
    }
  }
  if (kind === 'business') {
    const b = wh.businesses.find((x) => x.id === id)
    if (!b) return null
    const nearbyCrime = wh.crime.filter(
      (c) => c.geo.neighborhood === b.geo.neighborhood && c.date >= '2026-01-01',
    ).length
    const permits = wh.permits.filter((p) => p.geo.neighborhood === b.geo.neighborhood).slice(0, 5)
    return {
      kind,
      id,
      title: b.nameOriginal,
      summary: [
        `Category ${b.category}; status ${b.status}.`,
        b.status === 'possible_closure' ? 'Status is possible closure — not a confirmed shutdown.' : `Opened ${b.openedOn}.`,
      ],
      facts: [
        { label: 'Address (original)', value: b.geo.addressOriginal ?? 'n/a' },
        { label: 'Neighborhood (approx.)', value: b.geo.neighborhood ?? 'n/a' },
        ...(wh.crime.length > 0
          ? [{ label: 'Nearby official crime records (same neighborhood, YTD)', value: String(nearbyCrime) }]
          : []),
      ],
      related: [
        b.geo.neighborhood
          ? {
              kind: 'neighborhood' as const,
              id: NEIGHBORHOODS.find((n) => n.name === b.geo.neighborhood)?.id ?? 'downtown',
              label: b.geo.neighborhood,
            }
          : null,
        ...permits.map((p) => ({ kind: 'address' as const, id: p.id, label: p.geo.addressNormalized ?? p.id })),
      ].filter((x): x is NonNullable<typeof x> => x !== null),
      caveats: ['Nearby crime is a neighborhood count, not a claim about this business.'],
    }
  }
  if (kind === 'vendor') {
    const rows = wh.expenditures.filter((e) => e.vendorId === id)
    if (rows.length === 0) return null
    const first = rows[0]
    if (!first) return null
    const total = rows.reduce((s, e) => s + e.amount, 0)
    const byDept: Record<string, number> = {}
    for (const e of rows) byDept[e.department] = (byDept[e.department] ?? 0) + e.amount
    return {
      kind,
      id,
      title: first.vendor,
      summary: [`${rows.length} official payment rows totaling ${usd(total)}.`],
      facts: Object.entries(byDept).map(([k, v]) => ({ label: k, value: usd(v) })),
      related: [],
      caveats: [
        'A payment increase is not evidence of fraud, abuse, or corruption.',
        'Each row needs a source URL from a parsed OpenGov extract.',
      ],
    }
  }
  if (kind === 'address') {
    const permit = wh.permits.find((p) => p.id === id)
    if (!permit) return null
    const related = wh.permits.filter((p) => p.geo.addressNormalized === permit.geo.addressNormalized)
    const project = wh.projects.find((p) => p.relatedPermitIds.includes(permit.id))
    return {
      kind,
      id,
      title: permit.geo.addressNormalized ?? permit.geo.addressOriginal ?? permit.id,
      summary: [
        `${related.length} official permits at this normalized address.`,
        project ? `Grouped as ${project.title}.` : 'Not part of a multi-permit cluster.',
      ],
      facts: related.map((p) => ({
        label: p.id,
        value: `${p.type} ${p.submittedOn} ${usd(p.estimatedValue)} (${p.status})`,
      })),
      related: [
        permit.geo.neighborhood
          ? {
              kind: 'neighborhood' as const,
              id: NEIGHBORHOODS.find((n) => n.name === permit.geo.neighborhood)?.id ?? 'downtown',
              label: permit.geo.neighborhood,
            }
          : null,
      ].filter((x): x is NonNullable<typeof x> => x !== null),
      caveats: ['Parcel/zoning are stubs. Address join uses normalized strings, not a geocoder service.'],
    }
  }
  if (kind === 'intersection') {
    const name = id === 'olive-glenoaks' ? 'Olive Avenue & Glenoaks Boulevard' : id
    const rows = wh.collisions.filter((c) => c.intersection === name)
    return {
      kind,
      id,
      title: name,
      summary: [`${rows.length} official collisions at this named intersection.`],
      facts: [
        { label: 'Injury-coded rows', value: String(rows.filter((r) => r.severity === 'injury').length) },
        { label: 'Since 2026-04-01', value: String(rows.filter((r) => r.date >= '2026-04-01').length) },
      ],
      related: [{ kind: 'neighborhood', id: 'downtown', label: 'Downtown (approx.)' }],
      caveats: [
        rows.length > 0
          ? 'Counts without traffic volume are not a “dangerous intersection” finding.'
          : 'No SWITRS/TIMS extract is loaded. Counts without traffic volume are not a “dangerous intersection” finding.',
      ],
    }
  }
  return null
}

function usd(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}
