import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { analyticsAPI } from '../../lib/api'

const FALLBACK_COLORS = ['#3b82f6','#8b5cf6','#22c55e','#f97316','#ec4899','#14b8a6','#eab308']

export default function SubjectDistributionChart({ height = 200 }) {
  const { data, isLoading } = useQuery({
    queryKey: ['subject-distribution'],
    queryFn: () => analyticsAPI.getSubjects(30),
    select: d => d.data.data.distribution,
  })

  if (isLoading) return <div style={{ height }} className="flex items-center justify-center"><div className="w-5 h-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" /></div>
  if (!data?.length) return <div style={{ height }} className="flex items-center justify-center text-sm text-muted-foreground">No study data yet</div>

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius="55%" outerRadius="75%" dataKey="hours" nameKey="name" paddingAngle={2}>
          {data.map((entry, i) => <Cell key={i} fill={entry.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v) => [`${v.toFixed(1)}h`, 'Hours']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
        <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  )
}
