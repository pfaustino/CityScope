import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatUsdCompact } from '@shared/opengov.ts'
import { usd } from '../lib/data.ts'

function usdTooltip(value: number): string {
  return usd(value)
}

export function HorizontalMoneyChart({
  data,
  color = '#1f4d62',
  yAxisWidth = 168,
}: {
  data: { label: string; value: number }[]
  color?: string
  yAxisWidth?: number
}) {
  const height = Math.max(280, data.length * 28 + 24)
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="#c9bfa8" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={formatUsdCompact} />
          <YAxis type="category" dataKey="label" width={yAxisWidth} tick={{ fontSize: 10 }} interval={0} />
          <Tooltip formatter={(value) => usdTooltip(Number(value))} />
          <Bar dataKey="value" name="Amount" fill={color} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function BudgetActualChart({
  data,
}: {
  data: { label: string; budget: number; actual: number }[]
}) {
  return (
    <div style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="#c9bfa8" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 10 }} width={56} tickFormatter={formatUsdCompact} />
          <Tooltip formatter={(value) => usdTooltip(Number(value))} />
          <Legend />
          <Bar dataKey="budget" name="Budget" fill="#1f4d62" />
          <Bar dataKey="actual" name="Year-end actual" fill="#8a5310" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
