import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarPlus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { calendarAPI } from '../lib/api'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select'

const key = (date) => date.toISOString().split('T')[0]

const EVENT_COLORS = ['#EC4899', '#8B5CF6', '#06B6D4', '#22C55E', '#F59E0B', '#EF4444']

export default function CalendarPage() {
  const qc = useQueryClient()
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [form, setForm] = useState({ title: '', date: key(new Date()), type: 'event', color: EVENT_COLORS[0], notes: '' })
  const start = new Date(month.getFullYear(), month.getMonth(), 1)
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  const gridStart = new Date(start)
  gridStart.setDate(start.getDate() - start.getDay())
  const gridDays = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    return d
  })

  const queryKey = ['calendar', key(start), key(end)]
  const { data: events = [] } = useQuery({
    queryKey,
    queryFn: () => calendarAPI.getEvents({ start: key(start), end: key(end) }),
    select: d => d.data.data.events,
  })

  const createMutation = useMutation({ mutationFn: calendarAPI.createEvent, onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['calendar'] })
    setForm(p => ({ ...p, title: '', notes: '' }))
  } })
  const deleteMutation = useMutation({ mutationFn: calendarAPI.deleteEvent, onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar'] }) })

  const byDate = useMemo(() => events.reduce((acc, event) => {
    acc[event.date] = acc[event.date] || []
    acc[event.date].push(event)
    return acc
  }, {}), [events])

  const shiftMonth = (delta) => setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1))
  const addEvent = () => {
    if (!form.title.trim() || !form.date) return
    createMutation.mutate({ ...form, title: form.title.trim() })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Sessions, tasks, exams, goals, revisions, and your own important dates.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)}><ChevronLeft size={16} /></Button>
          <p className="w-40 text-center text-sm font-bold">{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          <Button variant="outline" size="icon" onClick={() => shiftMonth(1)}><ChevronRight size={16} /></Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 lg:grid-cols-[1fr_160px_140px_130px_auto]">
          <div>
            <Label>Important Date</Label>
            <Input className="mt-1" placeholder="Scholarship deadline, college form..." value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div>
            <Label>Date</Label>
            <Input className="mt-1" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={form.type} onValueChange={type => setForm(p => ({ ...p, type }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['event', 'deadline', 'holiday', 'reminder'].map(type => <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Color</Label>
            <div className="mt-2 flex gap-2">
              {EVENT_COLORS.map(color => (
                <button key={color} type="button" onClick={() => setForm(p => ({ ...p, color }))} className={`h-7 w-7 rounded-full border-2 ${form.color === color ? 'border-foreground' : 'border-border'}`} style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
          <Button onClick={addEvent} className="self-end" disabled={createMutation.isPending}><CalendarPlus size={15} /> Add</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-border bg-card">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="border-b border-border p-3 text-center text-xs font-bold text-muted-foreground">{day}</div>)}
        {gridDays.map(day => {
          const dateKey = key(day)
          const dayEvents = byDate[dateKey] || []
          const muted = day.getMonth() !== month.getMonth()
          return (
            <div key={dateKey} className={`min-h-[132px] border-b border-r border-border p-2 ${muted ? 'bg-muted/30 text-muted-foreground' : ''}`}>
              <p className="mb-2 text-xs font-bold">{day.getDate()}</p>
              <div className="space-y-1">
                {dayEvents.slice(0, 5).map(event => (
                  <div key={`${event.type}-${event.id}`} className="group flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-white" style={{ backgroundColor: event.color }}>
                    <span className="min-w-0 flex-1 truncate">{event.title}</span>
                    {event.editable && (
                      <button type="button" onClick={() => deleteMutation.mutate(event.id)} className="opacity-0 group-hover:opacity-100">
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                ))}
                {dayEvents.length > 5 && <p className="text-[10px] text-muted-foreground">+{dayEvents.length - 5} more</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
