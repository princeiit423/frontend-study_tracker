import { useQuery } from '@tanstack/react-query'
import { analyticsAPI } from '../../lib/api'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function getIntensity(hours) {
  if (!hours || hours === 0) return 0
  if (hours < 1) return 1
  if (hours < 2) return 2
  if (hours < 4) return 3
  return 4
}

function toDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeDateKey(value) {
  if (!value) return null
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : toDateKey(date)
}

function getCurrentStreakDates(streakCount) {
  const dates = new Set()
  const count = Number(streakCount) || 0

  for (let i = 0; i < count; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dates.add(toDateKey(date))
  }

  return dates
}

const intensityColors = {
  0: 'bg-background border-foreground/40',
  1: 'bg-lime-200 border-foreground',
  2: 'bg-emerald-300 border-foreground',
  3: 'bg-cyan-300 border-foreground',
  4: 'bg-primary border-foreground',
}

export default function HeatmapChart({ streak }) {
  const year = new Date().getFullYear()
  const { data, isLoading } = useQuery({
    queryKey: ['heatmap', year],
    queryFn: () => analyticsAPI.getHeatmap(year),
    select: d => {
      const map = {}
      d.data.data.heatmap.forEach(h => {
        const key = normalizeDateKey(h.date)
        if (key) map[key] = (map[key] || 0) + Number(h.hours || 0)
      })
      return map
    },
  })

  if (isLoading) {
    return <div className="h-28 flex items-center justify-center"><div className="w-5 h-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" /></div>
  }

  const activeDays = Object.values(data || {}).filter(v => v > 0).length
  const totalHours = Object.values(data || {}).reduce((sum, value) => sum + value, 0)
  const currentStreak = Number(streak?.current) || 0
  const longestStreak = Number(streak?.longest) || 0
  const streakDates = getCurrentStreakDates(currentStreak)

  const startOfYear = new Date(year, 0, 1)
  const endOfYear = new Date(year, 11, 31)
  const startPad = startOfYear.getDay()
  const weeks = []
  let current = new Date(year, 0, 1 - startPad)

  while (current <= endOfYear) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const dateStr = toDateKey(current)
      const inYear = current.getFullYear() === year
      const hours = inYear ? (data?.[dateStr] || 0) : null
      week.push({ date: dateStr, hours, isStreakDay: inYear && streakDates.has(dateStr), day: current.getDay() })
      current = new Date(current.getTime() + 86400000)
    }
    weeks.push(week)
  }

  const monthLabels = MONTHS.map((month, monthIndex) => {
    const indexes = weeks
      .map((week, index) => week.some(day => day.hours !== null && new Date(day.date).getMonth() === monthIndex) ? index : -1)
      .filter(index => index >= 0)

    return {
      month,
      start: indexes[0] || 0,
      span: indexes.length || 1,
    }
  })

  return (
    <div className="space-y-5">
      <div className="clay-card overflow-visible rounded-xl bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-normal text-muted-foreground">Study Streak</p>
            <h3 className="mt-1 text-2xl font-black tracking-normal text-foreground">
              {currentStreak > 0 ? `${currentStreak} day streak` : `${activeDays} active days`}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-right sm:flex sm:text-left">
            <div className="neo-pill rounded-lg px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-normal text-muted-foreground">Best</p>
              <p className="font-mono text-base font-bold text-foreground">{longestStreak || 0}d</p>
            </div>
            <div className="neo-pill rounded-lg px-3 py-2">
              <p className="text-[10px] font-black uppercase tracking-normal text-muted-foreground">Logged</p>
              <p className="font-mono text-base font-bold text-foreground">{totalHours.toFixed(1)}h</p>
            </div>
          </div>
        </div>
      </div>

      <div className="clay-card rounded-xl bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-foreground pb-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-normal text-muted-foreground">Year Heatmap</p>
            <h3 className="text-xl font-black tracking-normal text-foreground">{year} Study Flow</h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <span>Low</span>
            {[0,1,2,3,4].map(i => <span key={i} className={`h-4 w-4 rounded-[4px] border-2 ${intensityColors[i]}`} />)}
            <span className="h-4 w-4 rounded-[4px] border-2 border-foreground bg-orange-300 shadow-[2px_2px_0_hsl(var(--foreground))]" />
            <span>High</span>
          </div>
        </div>

        <div className="mt-4 w-full">
          <div
            className="grid w-full items-center gap-x-0.5 gap-y-1 sm:gap-x-1"
            style={{ gridTemplateColumns: `34px repeat(${weeks.length}, minmax(0, 1fr))` }}
          >
            <div className="h-6" />

            {monthLabels.map(({ month, start, span }) => (
              <div
                key={month}
                className="flex h-6 items-center justify-start overflow-hidden px-0.5 text-[9px] font-black uppercase leading-none tracking-normal text-muted-foreground sm:text-[11px]"
                style={{ gridColumn: `${start + 2} / span ${span}`, gridRow: 1 }}
              >
                {month}
              </div>
            ))}

            {DAYS.map((day, index) => (
              <div
                key={day}
                className="flex h-full items-center justify-end pr-1 text-[8px] font-black uppercase leading-none tracking-normal text-foreground sm:text-[10px]"
                style={{ gridColumn: 1, gridRow: index + 2 }}
              >
                {day}
              </div>
            ))}

            {weeks.map((week, wi) => (
              week.map((day, di) => (
                <div
                  key={`${wi}-${di}`}
                  title={day.date ? `${day.date}: ${day.hours?.toFixed(1) || 0}h / ${day.isStreakDay ? 'streak' : day.hours ? 'active' : 'rest'} day` : ''}
                  className={`aspect-square w-full rounded-[3px] border transition-transform duration-150 hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-[2px_2px_0_hsl(var(--foreground))] sm:rounded-[4px] ${day.hours === null ? 'opacity-0' : day.isStreakDay && !day.hours ? 'border-foreground bg-orange-300 shadow-[1px_1px_0_hsl(var(--foreground))]' : intensityColors[getIntensity(day.hours || 0)]}`}
                  style={{ gridColumn: wi + 2, gridRow: di + 2 }}
                />
              ))
            ))}
          </div>
        </div>

        <p className="mt-3 text-xs font-semibold tracking-normal text-muted-foreground">
          Each square is one day. Stronger color means more study hours; orange marks the current streak.
        </p>
      </div>
    </div>
  )
}
