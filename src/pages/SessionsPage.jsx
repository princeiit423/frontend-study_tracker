import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Clock, Trash2, Play } from 'lucide-react'
import { authAPI, examAPI, sessionAPI, subjectAPI, topicAPI } from '../lib/api'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import FancySelect from '../components/ui/FancySelect'
import StudyTimer from '../components/study/StudyTimer'
import { setCredentials } from '../store/slices/authSlice'
import { formatDuration, formatDate, formatRelativeTime, MOOD_COLORS } from '../lib/utils'

function ManualSessionModal({ open, onClose }) {
  const qc = useQueryClient()
  const dispatch = useDispatch()
  const { data: exams } = useQuery({ queryKey: ['exams'], queryFn: () => examAPI.getAll(), select: d => d.data.data.exams, enabled: open })
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: () => subjectAPI.getAll(), select: d => d.data.data.subjects, enabled: open })
  const [form, setForm] = useState({ examId: '', subjectId: '', topicId: '', title: '', startTime: '', endTime: '', notes: '', mood: 'neutral', focusScore: 7 })
  const { data: topics } = useQuery({ queryKey: ['topics', form.subjectId], queryFn: () => topicAPI.getAll({ subjectId: form.subjectId }), select: d => d.data.data.topics, enabled: open && !!form.subjectId })
  const [loading, setLoading] = useState(false)
  const examOptions = [{ value: '', label: 'No exam' }, ...(exams || []).map(exam => ({ value: exam._id, label: exam.name, color: exam.color }))]
  const subjectOptions = [{ value: '', label: 'No subject' }, ...(subjects || []).map(subject => ({ value: subject._id, label: subject.name, color: subject.color }))]
  const topicOptions = [{ value: '', label: 'No topic' }, ...(topics || []).map(topic => ({ value: topic._id, label: topic.name }))]
  const mutation = useMutation({
    mutationFn: sessionAPI.addManual,
    onSuccess: async () => {
      qc.invalidateQueries(['sessions'])
      qc.invalidateQueries(['dashboard-stats'])
      qc.invalidateQueries(['subjects'])
      qc.invalidateQueries(['topics'])
      qc.invalidateQueries(['exams'])
      const { data } = await authAPI.getMe()
      dispatch(setCredentials({ user: data.data.user }))
      onClose()
    }
  })
  const handleSubmit = async () => {
    if (!form.startTime || !form.endTime) return
    setLoading(true)
    try {
      await mutation.mutateAsync({
        ...form,
        examId: form.examId || undefined,
        subjectId: form.subjectId || undefined,
        topicId: form.topicId || undefined,
      })
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Manual Session</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Exam (optional)</Label>
            <FancySelect
              className="mt-1"
              value={form.examId}
              onChange={examId => setForm(p => ({...p, examId}))}
              options={examOptions}
              placeholder="Select exam..."
            />
          </div>
          <div>
            <Label>Subject (optional)</Label>
            <FancySelect
              className="mt-1"
              value={form.subjectId}
              onChange={subjectId => setForm(p => ({...p, subjectId, topicId: ''}))}
              options={subjectOptions}
              placeholder="Select subject..."
            />
          </div>
          {form.subjectId && topics?.length > 0 && (
            <div>
              <Label>Topic (optional)</Label>
              <FancySelect
                className="mt-1"
                value={form.topicId}
                onChange={topicId => setForm(p => ({...p, topicId}))}
                options={topicOptions}
                placeholder="Select topic..."
              />
            </div>
          )}
          <div>
            <Label>Session Title (optional)</Label>
            <Input className="mt-1" placeholder="e.g. Mock test review..." value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Time *</Label>
              <Input className="mt-1" type="datetime-local" value={form.startTime} onChange={e => setForm(p => ({...p, startTime: e.target.value}))} />
            </div>
            <div>
              <Label>End Time *</Label>
              <Input className="mt-1" type="datetime-local" value={form.endTime} onChange={e => setForm(p => ({...p, endTime: e.target.value}))} />
            </div>
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Textarea className="mt-1" rows={2} value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading || !form.startTime || !form.endTime} className="flex-1">Add Session</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function SessionsPage() {
  const qc = useQueryClient()
  const dispatch = useDispatch()
  const [showManual, setShowManual] = useState(false)
  const [page, setPage] = useState(1)

  const { data: activeSession } = useQuery({ queryKey: ['active-session'], queryFn: () => sessionAPI.getActive(), select: d => d.data.data.session, refetchInterval: 5000 })
  const { data, isLoading } = useQuery({
    queryKey: ['sessions', page],
    queryFn: () => sessionAPI.getAll({ page, limit: 20 }),
    select: d => d.data.data,
  })

  const deleteMutation = useMutation({
    mutationFn: sessionAPI.delete,
    onSuccess: async () => {
      qc.invalidateQueries(['sessions'])
      qc.invalidateQueries(['dashboard-stats'])
      qc.invalidateQueries(['subjects'])
      qc.invalidateQueries(['topics'])
      qc.invalidateQueries(['exams'])
      const { data } = await authAPI.getMe()
      dispatch(setCredentials({ user: data.data.user }))
    }
  })

  const sessions = data?.sessions || []
  const pagination = data?.pagination

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Sessions</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{pagination?.total || 0} total sessions</p>
        </div>
        <Button onClick={() => setShowManual(true)} variant="outline" size="sm" className="gap-2"><Plus size={14} /> Manual Entry</Button>
      </div>

      <StudyTimer activeSession={activeSession} />

      {sessions.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <Clock size={32} className="text-muted-foreground mx-auto mb-4" />
          <p className="font-medium mb-2">No sessions yet</p>
          <p className="text-muted-foreground text-sm">Start a session or add one manually</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s, i) => (
            <motion.div key={s._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors group">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.subject?.color || '#3b82f6' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{s.subject?.name || 'General Study'}</span>
                    {s.topic && <span className="text-xs text-muted-foreground">· {s.topic.name}</span>}
                    {s.exam && <span className="text-xs text-muted-foreground">· {s.exam.name}</span>}
                    {s.title && <span className="text-xs text-muted-foreground">· {s.title}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(s.startTime)}</span>
                    <Badge variant="outline" className="text-[10px] h-4 capitalize">{s.mode}</Badge>
                    {s.mood && <span className="text-[10px]" style={{ color: MOOD_COLORS[s.mood] }}>{s.mood}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono font-semibold text-sm text-primary">{formatDuration(s.duration)}</p>
                  {s.xpEarned > 0 && <p className="text-[10px] text-muted-foreground">+{s.xpEarned} XP</p>}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => deleteMutation.mutate(s._id)}>
                  <Trash2 size={12} />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground flex items-center">{page} / {pagination.pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      <ManualSessionModal open={showManual} onClose={() => setShowManual(false)} />
    </div>
  )
}
