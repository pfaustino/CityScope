import { assert } from './assert.ts'

const MAX_SERIES = 10_000

export function percentChange(current: number, baseline: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(baseline)) return null
  if (baseline === 0) return null
  return ((current - baseline) / Math.abs(baseline)) * 100
}

export function monthOverMonth(current: number, previous: number): number | null {
  return percentChange(current, previous)
}

export function yearOverYear(current: number, previousYear: number): number | null {
  return percentChange(current, previousYear)
}

export function rollingAverage(values: number[], window: number): number | null {
  assert(window > 0, 'ROLLING_WINDOW', 'window must be positive')
  assert(values.length <= MAX_SERIES, 'SERIES_CAP', `series exceeds ${MAX_SERIES}`)
  if (values.length < window) return null
  const slice = values.slice(-window)
  const sum = slice.reduce((acc, n) => acc + n, 0)
  return sum / window
}

export function ratePerPopulation(count: number, population: number, per = 1000): number | null {
  if (population <= 0) return null
  return (count / population) * per
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((acc, n) => acc + n, 0) / values.length
}

export function stddev(values: number[]): number | null {
  if (values.length < 2) return null
  const m = mean(values)
  if (m === null) return null
  const variance = values.reduce((acc, n) => acc + (n - m) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

export function zScore(value: number, sample: number[]): number | null {
  const m = mean(sample)
  const sd = stddev(sample)
  if (m === null || sd === null || sd === 0) return null
  return (value - m) / sd
}

export function pearson(x: number[], y: number[]): number | null {
  if (x.length !== y.length || x.length < 3) return null
  const mx = mean(x)
  const my = mean(y)
  if (mx === null || my === null) return null
  let num = 0
  let dx = 0
  let dy = 0
  for (let i = 0; i < x.length; i += 1) {
    const xi = x[i]
    const yi = y[i]
    if (xi === undefined || yi === undefined) return null
    const a = xi - mx
    const b = yi - my
    num += a * b
    dx += a * a
    dy += b * b
  }
  if (dx === 0 || dy === 0) return null
  return num / Math.sqrt(dx * dy)
}

export function countBy<T>(items: T[], keyFn: (item: T) => string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const item of items) {
    const key = keyFn(item)
    out[key] = (out[key] ?? 0) + 1
  }
  return out
}

export function groupByMonth<T>(items: T[], dateFn: (item: T) => string): Record<string, number> {
  return countBy(items, (item) => dateFn(item).slice(0, 7))
}

export function sumBy<T>(items: T[], keyFn: (item: T) => string, valFn: (item: T) => number): Record<string, number> {
  const out: Record<string, number> = {}
  for (const item of items) {
    const key = keyFn(item)
    out[key] = (out[key] ?? 0) + valFn(item)
  }
  return out
}

export function sortedEntries(record: Record<string, number>): [string, number][] {
  return Object.entries(record).sort((a, b) => b[1] - a[1])
}

export function monthsBetween(start: string, end: string): string[] {
  const out: string[] = []
  const [sy, sm] = start.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)
  if (sy === undefined || sm === undefined || ey === undefined || em === undefined) return out
  let y = sy
  let m = sm
  let guard = 0
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`)
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
    guard += 1
    if (guard > 240) break
  }
  return out
}

export function previousMonth(month: string): string | null {
  const [y, m] = month.split('-').map(Number)
  if (y === undefined || m === undefined) return null
  if (m === 1) return `${y - 1}-12`
  return `${y}-${String(m - 1).padStart(2, '0')}`
}

export function previousYearMonth(month: string): string | null {
  const [y, m] = month.split('-').map(Number)
  if (y === undefined || m === undefined) return null
  return `${y - 1}-${String(m).padStart(2, '0')}`
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function round0(n: number): number {
  return Math.round(n)
}
