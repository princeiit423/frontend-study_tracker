import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, CheckCircle2, HelpCircle, RotateCcw, Trash2 } from 'lucide-react'
import { revisionAPI, topicAPI } from '../lib/api'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select'

const todayKey = () => new Date().toISOString().split('T')[0]

export default function RevisionPage() {
  const qc = useQueryClient()
  const [topicId, setTopicId] = useState('')
  const [baseDate, setBaseDate] = useState(todayKey())
  const { data: revisions = [], isLoading } = useQuery({ queryKey: ['revisions'], queryFn: revisionAPI.getAll, select: d => d.data.data.revisions })
  const { data: topics = [] } = useQuery({ queryKey: ['topics-all'], queryFn: () => topicAPI.getAll({ all: true }), select: d => d.data.data.topics })
  const createMutation = useMutation({
    mutationFn: revisionAPI.create,
    onSuccess: () => {
      qc.invalidateQueries(['revisions'])
      setTopicId('')
    },
  })
  const updateMutation = useMutation({ mutationFn: ({ revisionId, slotId, ...data }) => revisionAPI.updateSlot(revisionId, slotId, data), onSuccess: () => qc.invalidateQueries(['revisions']) })
  const deleteMutation = useMutation({ mutationFn: revisionAPI.delete, onSuccess: () => qc.invalidateQueries(['revisions']) })

  const flatSlots = useMemo(() => revisions.flatMap(revision => revision.schedule.map(slot => ({ revision, slot }))), [revisions])
  const dueToday = flatSlots.filter(({ slot }) => slot.date <= todayKey() && !slot.isCompleted)
  const upcoming = flatSlots.filter(({ slot }) => slot.date > todayKey() && !slot.isCompleted).sort((a, b) => a.slot.date.localeCompare(b.slot.date)).slice(0, 8)

  const scheduleRevision = () => {
    if (!topicId) return
    createMutation.mutate({ topicId, baseDate })
  }

  const toggleSlot = (revision, slot) => {
    updateMutation.mutate({ revisionId: revision._id, slotId: slot._id, isCompleted: !slot.isCompleted })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Revision Scheduler</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Pick a topic once. AceStudy creates revision reminders for Day 1, Day 3, Day 7, and Day 15.</p>
      </div>

      <Card className="border-primary/20">
        <CardContent className="flex items-start gap-3 p-4">
          <HelpCircle size={18} className="mt-0.5 shrink-0 text-primary" />
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">How it works</p>
            <p className="mt-1">Choose the topic you studied and the date you learned it. The scheduler creates four revision dates. Click any date card to mark that revision done. These dates also appear in Calendar.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Schedule a Topic</CardTitle></CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-[1fr_180px_auto]">
          <div>
            <Label>Topic</Label>
            <Select value={topicId || '__none'} onValueChange={value => setTopicId(value === '__none' ? '' : value)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Choose topic" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Choose topic</SelectItem>
                {topics.map(topic => <SelectItem key={topic._id} value={topic._id}>{topic.subject?.name ? `${topic.subject.name} - ` : ''}{topic.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Learned on</Label>
            <Input className="mt-1" type="date" value={baseDate} onChange={e => setBaseDate(e.target.value)} />
          </div>
          <Button className="self-end" disabled={!topicId || createMutation.isPending} onClick={scheduleRevision}>
            <RotateCcw size={15} /> Create Schedule
          </Button>
        </CardContent>
      </Card>

      {topics.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <BookOpen size={28} className="mx-auto mb-3 text-muted-foreground" />
          <p className="font-semibold">No topics available yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create subjects and topics first, then come back to schedule revisions.</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Due Now</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {dueToday.length > 0 ? dueToday.map(({ revision, slot }) => (
              <button key={`${revision._id}-${slot._id}`} onClick={() => toggleSlot(revision, slot)} className="flex w-full items-center gap-3 rounded-lg border border-border bg-background/70 p-3 text-left">
                <CheckCircle2 size={17} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold">{revision.topic?.name || 'Topic'}</p>
                  <p className="text-xs text-muted-foreground">Day {slot.intervalDays} revision - {slot.date}</p>
                </div>
              </button>
            )) : <p className="text-sm text-muted-foreground">Nothing due right now.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Upcoming</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {upcoming.length > 0 ? upcoming.map(({ revision, slot }) => (
              <button key={`${revision._id}-${slot._id}`} onClick={() => toggleSlot(revision, slot)} className="flex w-full items-center gap-3 rounded-lg border border-border bg-background/70 p-3 text-left">
                <RotateCcw size={17} className="text-primary" />
                <div>
                  <p className="text-sm font-semibold">{revision.topic?.name || 'Topic'}</p>
                  <p className="text-xs text-muted-foreground">Day {slot.intervalDays} revision - {slot.date}</p>
                </div>
              </button>
            )) : <p className="text-sm text-muted-foreground">No upcoming revisions.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {isLoading ? <p className="text-sm text-muted-foreground">Loading schedules...</p> : revisions.map(revision => (
          <Card key={revision._id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span className="truncate">{revision.topic?.name || 'Topic'}</span>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(revision._id)}><Trash2 size={14} /></Button>
              </CardTitle>
              {revision.subject && <p className="text-xs text-muted-foreground">{revision.subject.name}</p>}
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {revision.schedule.map(slot => (
                <button key={slot._id} onClick={() => toggleSlot(revision, slot)}
                  className={`rounded-lg border border-border p-3 text-left transition-colors ${slot.isCompleted ? 'bg-primary/10' : slot.date <= todayKey() ? 'bg-destructive/10' : 'bg-background/70'}`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className={slot.isCompleted ? 'text-primary' : 'text-muted-foreground'} />
                    <div>
                      <p className="text-xs text-muted-foreground">Day {slot.intervalDays}</p>
                      <p className="text-sm font-semibold">{slot.date}</p>
                      <p className="text-[10px] text-muted-foreground">{slot.isCompleted ? 'Completed' : 'Pending'}</p>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
