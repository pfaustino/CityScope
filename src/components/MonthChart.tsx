import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export function MonthChart({ data, color = '#1f4d62' }: { data: Record<string, number>; color?: string }) {
  const rows = Object.keys(data)
    .sort()
    .map((month) => ({ month, value: data[month] ?? 0 }))
  return (
    <div style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#c9bfa8" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={3} />
          <YAxis tick={{ fontSize: 10 }} width={40} />
          <Tooltip />
          <Bar dataKey="value" fill={color} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CountChart({
  data,
  color = '#1f4d62',
  height = 220,
}: {
  data: { label: string; value: number }[]
  color?: string
  height?: number
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#c9bfa8" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} />
          <YAxis tick={{ fontSize: 10 }} width={40} />
          <Tooltip />
          <Bar dataKey="value" fill={color} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

