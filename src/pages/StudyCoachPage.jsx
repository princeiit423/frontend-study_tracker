import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Flame,
  Import,
  Lightbulb,
  Pin,
  Plus,
  Sparkles,
  Target,
  Trash2,
  Zap,
} from 'lucide-react'
import { coachAPI, mistakeAPI, motivationAPI, subjectAPI } from '../lib/api'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select'
import { Textarea } from '../components/ui/textarea'

const reasonOptions = [
  { value: 'concept_gap', label: 'Concept gap' },
  { value: 'silly_mistake', label: 'Silly mistake' },
  { value: 'time_pressure', label: 'Time pressure' },
  { value: 'calculation', label: 'Calculation' },
  { value: 'memory', label: 'Memory' },
  { value: 'other', label: 'Other' },
]

const queueIcons = {
  task: ClipboardCheck,
  revision: Flame,
  goal: Target,
  topic: Lightbulb,
  exam: AlertTriangle,
}

const emptyMistakeForm = { subject: '__none', topic: '', question: '', mistake: '', reason: 'concept_gap', fix: '' }
const emptyMotivationForm = { title: '', body: '', type: 'reason' }

export default function StudyCoachPage() {
  const qc = useQueryClient()
  const [quickText, setQuickText] = useState('')
  const [motivationForm, setMotivationForm] = useState(emptyMotivationForm)
  const [mistakeForm, setMistakeForm] = useState(emptyMistakeForm)
  const [importForm, setImportForm] = useState({ subjectId: '', syllabus: '' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const { data: queue = [] } = useQuery({
    queryKey: ['coach-queue'],
    queryFn: () => coachAPI.queue(),
    select: d => d.data.data.queue,
  })
  const { data: weakness } = useQuery({
    queryKey: ['coach-weakness'],
    queryFn: () => coachAPI.weakness(),
    select: d => d.data.data,
  })
  const { data: weekly } = useQuery({
    queryKey: ['coach-weekly-report'],
    queryFn: () => coachAPI.weeklyReport(),
    select: d => d.data.data,
  })
  const { data: motivations = [] } = useQuery({
    queryKey: ['motivation'],
    queryFn: () => motivationAPI.getAll(),
    select: d => d.data.data.items,
  })
  const { data: mistakes = [] } = useQuery({
    queryKey: ['mistakes'],
    queryFn: () => mistakeAPI.getAll({ status: 'open' }),
    select: d => d.data.data.mistakes,
  })
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectAPI.getAll(),
    select: d => d.data.data.subjects,
  })

  const refreshCoach = () => {
    qc.invalidateQueries({ queryKey: ['coach-queue'] })
    qc.invalidateQueries({ queryKey: ['coach-weakness'] })
    qc.invalidateQueries({ queryKey: ['coach-weekly-report'] })
    qc.invalidateQueries({ queryKey: ['mistakes'] })
    qc.invalidateQueries({ queryKey: ['motivation'] })
    qc.invalidateQueries({ queryKey: ['subjects'] })
    qc.invalidateQueries({ queryKey: ['topics'] })
    qc.invalidateQueries({ queryKey: ['topics-all'] })
    qc.invalidateQueries({ queryKey: ['tasks'] })
    qc.invalidateQueries({ queryKey: ['notes'] })
  }

  const runAction = async (action, successMessage) => {
    setError('')
    setNotice('')
    try {
      await action()
      if (successMessage) setNotice(successMessage)
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed. Please try again.')
    }
  }

  const quickMutation = useMutation({ mutationFn: coachAPI.quickCapture, onSuccess: refreshCoach })
  const motivationCreate = useMutation({ mutationFn: motivationAPI.create, onSuccess: refreshCoach })
  const motivationUpdate = useMutation({ mutationFn: ({ id, ...data }) => motivationAPI.update(id, data), onSuccess: refreshCoach })
  const motivationDelete = useMutation({ mutationFn: motivationAPI.delete, onSuccess: refreshCoach })
  const mistakeCreate = useMutation({ mutationFn: mistakeAPI.create, onSuccess: refreshCoach })
  const mistakeUpdate = useMutation({ mutationFn: ({ id, ...data }) => mistakeAPI.update(id, data), onSuccess: refreshCoach })
  const mistakeDelete = useMutation({ mutationFn: mistakeAPI.delete, onSuccess: refreshCoach })
  const importMutation = useMutation({ mutationFn: coachAPI.importSyllabus, onSuccess: refreshCoach })

  const pinnedMotivations = useMemo(() => {
    return [...motivations].sort((a, b) => Number(b.isPinned) - Number(a.isPinned))
  }, [motivations])

  const addQuickCapture = async () => {
    if (!quickText.trim()) return
    await runAction(async () => {
      await quickMutation.mutateAsync({ text: quickText.trim() })
      setQuickText('')
    }, 'Captured successfully.')
  }

  const addMotivation = async () => {
    if (!motivationForm.title.trim()) return
    await runAction(async () => {
      await motivationCreate.mutateAsync({
        ...motivationForm,
        title: motivationForm.title.trim(),
        body: motivationForm.body.trim(),
      })
      setMotivationForm(emptyMotivationForm)
    }, 'Motivation added.')
  }

  const addMistake = async () => {
    if (!mistakeForm.mistake.trim()) return
    await runAction(async () => {
      await mistakeCreate.mutateAsync({
        ...mistakeForm,
        subject: mistakeForm.subject === '__none' ? null : mistakeForm.subject,
        topic: mistakeForm.topic.trim(),
        question: mistakeForm.question.trim(),
        mistake: mistakeForm.mistake.trim(),
        fix: mistakeForm.fix.trim(),
      })
      setMistakeForm(emptyMistakeForm)
    }, 'Mistake added.')
  }

  const importSyllabus = async () => {
    if (!importForm.subjectId || !importForm.syllabus.trim()) return
    await runAction(async () => {
      const response = await importMutation.mutateAsync(importForm)
      const created = response.data.data.created || 0
      const skipped = response.data.data.skipped || 0
      setImportForm({ subjectId: '', syllabus: '' })
      setNotice(`Imported ${created} topic${created === 1 ? '' : 's'}${skipped ? `, skipped ${skipped} duplicate${skipped === 1 ? '' : 's'}` : ''}.`)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-black">Study Coach</h1>
          <p className="mt-1 text-sm text-muted-foreground">Daily queue, weak areas, mistakes, motivation, and syllabus capture in one place.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border-[3px] border-foreground bg-primary/10 px-4 py-3 shadow-[4px_4px_0_hsl(var(--foreground))]">
          <Sparkles size={18} className="text-primary" />
          <span className="text-sm font-black">{weekly?.recommendation || 'Start with one focused block today.'}</span>
        </div>
      </div>

      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">{error}</div>}
      {notice && <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">{notice}</div>}

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <Input
              value={quickText}
              onChange={e => setQuickText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addQuickCapture()}
              placeholder="Quick capture: task revise limits, note formula shortcut, mistake forgot sign..."
            />
            <Button onClick={addQuickCapture} disabled={quickMutation.isPending || !quickText.trim()}>
              <Zap size={16} />
              {quickMutation.isPending ? 'Capturing...' : 'Capture'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck size={18} /> Smart Daily Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {queue.slice(0, 8).map((item, index) => {
              const Icon = queueIcons[item.type] || Lightbulb
              return (
                <div key={`${item.type}-${item.title}-${index}`} className="flex items-start gap-3 rounded-lg border border-border bg-background/70 p-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary"><Icon size={17} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{item.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'} className="capitalize">{item.priority}</Badge>
                </div>
              )
            })}
            {queue.length === 0 && <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">Nothing urgent. Add tasks, revisions, or topics to build your queue.</div>}
          </CardContent>
        </Card>

        <div className="grid gap-5 sm:grid-cols-3 xl:grid-cols-1">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">This Week</p>
              <p className="mt-1 text-2xl font-black">{weekly?.hours || 0}h</p>
              <p className="text-xs text-muted-foreground">{weekly?.sessions || 0} sessions completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Weak Topics</p>
              <p className="mt-1 text-2xl font-black">{weakness?.weakTopics?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Priority topics to fix first</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Open Mistakes</p>
              <p className="mt-1 text-2xl font-black">{weakness?.openMistakes?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Resolve them before the next mock</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle size={18} /> Weakness Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {weakness?.weakTopics?.slice(0, 6).map(topic => (
              <div key={topic.id} className="rounded-lg border border-border bg-background/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold">{topic.title}</p>
                  <Badge variant="outline">Score {topic.score}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{topic.subject?.name || 'No subject'} - {topic.reason}</p>
              </div>
            ))}
            {(!weakness?.weakTopics || weakness.weakTopics.length === 0) && <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">No weak topics detected yet.</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Flame size={18} /> Motivation Wall</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_130px]">
              <Input placeholder="Why are you studying?" value={motivationForm.title} onChange={e => setMotivationForm(p => ({ ...p, title: e.target.value }))} />
              <Select value={motivationForm.type} onValueChange={type => setMotivationForm(p => ({ ...p, type }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['reason', 'quote', 'goal', 'reward', 'promise'].map(type => <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>)}
                </SelectContent>
              </Select>
              <Textarea className="sm:col-span-2" placeholder="Add detail, reward, promise, or reminder..." value={motivationForm.body} onChange={e => setMotivationForm(p => ({ ...p, body: e.target.value }))} />
              <Button className="sm:col-span-2" onClick={addMotivation} disabled={motivationCreate.isPending || !motivationForm.title.trim()}>
                <Plus size={16} /> {motivationCreate.isPending ? 'Adding...' : 'Add Motivation'}
              </Button>
            </div>
            <div className="space-y-2">
              {pinnedMotivations.slice(0, 5).map(item => (
                <div key={item._id} className="flex items-start gap-3 rounded-lg border border-border bg-background/70 p-3">
                  <button disabled={motivationUpdate.isPending} onClick={() => runAction(() => motivationUpdate.mutateAsync({ id: item._id, isPinned: !item.isPinned }))} className="mt-0.5 text-primary disabled:opacity-50">
                    <Pin size={15} fill={item.isPinned ? 'currentColor' : 'none'} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{item.title}</p>
                    {item.body && <p className="mt-1 text-xs text-muted-foreground">{item.body}</p>}
                  </div>
                  <Button variant="ghost" size="icon" disabled={motivationDelete.isPending} onClick={() => runAction(() => motivationDelete.mutateAsync(item._id), 'Motivation deleted.')}><Trash2 size={14} /></Button>
                </div>
              ))}
              {motivations.length === 0 && <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">Add a reason, reward, or promise.</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 size={18} /> Mock Test Mistake Tracker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Select value={mistakeForm.subject} onValueChange={subject => setMistakeForm(p => ({ ...p, subject }))}>
                <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No subject</SelectItem>
                  {subjects.map(subject => <SelectItem key={subject._id} value={subject._id}>{subject.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={mistakeForm.reason} onValueChange={reason => setMistakeForm(p => ({ ...p, reason }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {reasonOptions.map(reason => <SelectItem key={reason.value} value={reason.value}>{reason.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Topic name" value={mistakeForm.topic} onChange={e => setMistakeForm(p => ({ ...p, topic: e.target.value }))} />
              <Input placeholder="Question or source" value={mistakeForm.question} onChange={e => setMistakeForm(p => ({ ...p, question: e.target.value }))} />
              <Textarea className="sm:col-span-2" placeholder="What went wrong?" value={mistakeForm.mistake} onChange={e => setMistakeForm(p => ({ ...p, mistake: e.target.value }))} />
              <Textarea className="sm:col-span-2" placeholder="Fix rule for next time..." value={mistakeForm.fix} onChange={e => setMistakeForm(p => ({ ...p, fix: e.target.value }))} />
              <Button className="sm:col-span-2" onClick={addMistake} disabled={mistakeCreate.isPending || !mistakeForm.mistake.trim()}>
                <Plus size={16} /> {mistakeCreate.isPending ? 'Adding...' : 'Add Mistake'}
              </Button>
            </div>
            <div className="space-y-2">
              {mistakes.slice(0, 5).map(item => (
                <div key={item._id} className="rounded-lg border border-border bg-background/70 p-3">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">{item.mistake}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.subject?.name || 'General'} - {item.topic?.name || item.topicText || 'No topic'} - {reasonOptions.find(r => r.value === item.reason)?.label || item.reason}</p>
                      {item.fix && <p className="mt-2 text-xs font-semibold text-primary">{item.fix}</p>}
                    </div>
                    <Button variant="ghost" size="icon" disabled={mistakeUpdate.isPending} onClick={() => runAction(() => mistakeUpdate.mutateAsync({ id: item._id, isResolved: true }), 'Mistake resolved.')}><CheckCircle2 size={14} /></Button>
                    <Button variant="ghost" size="icon" disabled={mistakeDelete.isPending} onClick={() => runAction(() => mistakeDelete.mutateAsync(item._id), 'Mistake deleted.')}><Trash2 size={14} /></Button>
                  </div>
                </div>
              ))}
              {mistakes.length === 0 && <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">No open mistakes. Nice.</div>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Import size={18} /> Syllabus Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Subject</Label>
              <Select value={importForm.subjectId} onValueChange={subjectId => setImportForm(p => ({ ...p, subjectId }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Choose subject..." /></SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => <SelectItem key={subject._id} value={subject._id}>{subject.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {subjects.length === 0 && <p className="mt-2 text-xs text-muted-foreground">Create a subject first, then import syllabus topics here.</p>}
            </div>
            <div>
              <Label>Topics</Label>
              <Textarea
                className="mt-1 min-h-[220px]"
                placeholder={'One topic per line\nLimits and continuity\nDifferentiation basics\nApplications of derivatives'}
                value={importForm.syllabus}
                onChange={e => setImportForm(p => ({ ...p, syllabus: e.target.value }))}
              />
            </div>
            <Button className="w-full" onClick={importSyllabus} disabled={importMutation.isPending || !importForm.subjectId || !importForm.syllabus.trim()}>
              <Import size={16} />
              {importMutation.isPending ? 'Importing...' : 'Import Topics'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
