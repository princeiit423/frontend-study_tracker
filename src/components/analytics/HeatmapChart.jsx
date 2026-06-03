import { useQuery } from '@tanstack/react-query'
import { analyticsAPI } from '../../lib/api'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS = ['','Mon','','Wed','','Fri','']

function getIntensity(hours) {
  if (!hours || hours === 0) return 0
  if (hours < 1) return 1
  if (hours < 2) return 2
  if (hours < 4) return 3
  return 4
}

const intensityColors = {
  0: 'bg-muted/30 border border-border/60',
  1: 'bg-emerald-400/12 border border-emerald-400/20',
  2: 'bg-emerald-400/30 border border-emerald-400/35',
  3: 'bg-emerald-400/55 border border-emerald-400/60',
  4: 'bg-emerald-500 border border-emerald-400/70 shadow-sm shadow-emerald-500/15',
}

export default function HeatmapChart() {
  const year = new Date().getFullYear()
  const { data, isLoading } = useQuery({
    queryKey: ['heatmap', year],
    queryFn: () => analyticsAPI.getHeatmap(year),
    select: d => {
      const map = {}
      d.data.data.heatmap.forEach(h => { map[h.date] = h.hours })
      return map
    },
  })

  if (isLoading) {
    return <div className="h-28 flex items-center justify-center"><div className="w-5 h-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" /></div>
  }

  const activeDays = Object.values(data || {}).filter(v => v > 0).length
  const totalHours = Object.values(data || {}).reduce((sum, value) => sum + value, 0)

  // Build weeks grid
  const startOfYear = new Date(year, 0, 1)
  const endOfYear = new Date(year, 11, 31)
  const startPad = startOfYear.getDay()
  const weeks = []
  let current = new Date(year, 0, 1 - startPad)
  while (current <= endOfYear) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const dateStr = current.toISOString().split('T')[0]
      const inYear = current.getFullYear() === year
      week.push({ date: dateStr, hours: inYear ? (data?.[dateStr] || 0) : null, day: current.getDay() })
      current = new Date(current.getTime() + 86400000)
    }
    weeks.push(week)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/20 p-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Study streak</p>
          <p className="text-sm font-semibold text-foreground">{activeDays} active days · {totalHours.toFixed(1)}h logged</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="rounded-full border border-border bg-background px-2 py-1">Less</span>
          {[0,1,2,3,4].map(i => <span key={i} className={`h-3 w-3 rounded-sm ${intensityColors[i]}`} />)}
          <span className="rounded-full border border-border bg-background px-2 py-1">More</span>
        </div>
      </div>
      <div className="overflow-x-auto no-scrollbar">
        <div className="min-w-[720px] rounded-2xl border border-border bg-card/70 p-3 shadow-sm">
          <div className="flex gap-1.5">
            {/* Day labels */}
            <div className="flex flex-col gap-1.5 mr-3 mt-6">
              {DAYS.map((d, i) => <div key={i} className="h-3 text-[10px] text-muted-foreground flex items-center">{d}</div>)}
            </div>
            {/* Month labels + grid */}
            <div className="flex-1">
              <div className="flex gap-1.5 mb-1.5">
                {weeks.map((week, wi) => {
                  const firstDayOfMonth = week.find(d => d.date && new Date(d.date).getDate() === 1)
                  return (
                    <div key={wi} className="w-4 text-[10px] text-muted-foreground truncate">
                      {firstDayOfMonth ? MONTHS[new Date(firstDayOfMonth.date).getMonth()] : ''}
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-1.5">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-1.5">
                    {week.map((day, di) => (
                      <div
                        key={di}
                        title={day.date ? `${day.date}: ${day.hours?.toFixed(1) || 0}h / ${day.hours ? 'active' : 'rest'} day` : ''}
                        className={`h-3.5 w-3.5 rounded-[4px] transition-all duration-200 hover:scale-110 hover:z-10 ${day.hours === null ? 'opacity-0' : intensityColors[getIntensity(day.hours || 0)]}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
