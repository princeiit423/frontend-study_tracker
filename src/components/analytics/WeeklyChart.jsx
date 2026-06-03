import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { analyticsAPI } from '../../lib/api'
import { format } from 'date-fns'

export default function WeeklyChart({ weeks = 12, height = 200 }) {
  const { data, isLoading } = useQuery({
    queryKey: ['weekly-chart', weeks],
    queryFn: () => analyticsAPI.getWeekly(weeks),
    select: d => d.data.data.chart.map(c => ({ ...c, label: format(new Date(c.week), 'MMM d') })),
  })

  if (isLoading) return <div style={{ height }} className="flex items-center justify-center"><div className="w-5 h-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" /></div>

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data || []} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}h`} />
        <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}h`, 'Hours']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
        <Area type="monotone" dataKey="hours" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorHours)" dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
