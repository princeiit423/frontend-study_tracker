import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { analyticsAPI } from '../../lib/api'
import { format } from 'date-fns'

export default function DailyChart({ days = 14, height = 140 }) {
  const { data, isLoading } = useQuery({
    queryKey: ['daily-chart', days],
    queryFn: () => analyticsAPI.getDaily(days),
    select: d => d.data.data.chart.map(c => ({ ...c, label: format(new Date(c.date), 'MMM d') })),
  })

  if (isLoading) return <div style={{ height }} className="flex items-center justify-center"><div className="w-5 h-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" /></div>

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}h`} />
        <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}h`, 'Hours']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} cursor={{ fill: 'hsl(var(--accent))' }} />
        <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} maxBarSize={32} fillOpacity={0.85} />
      </BarChart>
    </ResponsiveContainer>
  )
}
