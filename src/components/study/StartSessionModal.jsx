import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select'
import { sessionAPI, subjectAPI, topicAPI } from '../../lib/api'
import { setActiveSession, setRunning, setElapsedSeconds } from '../../store/slices/sessionSlice'

const modes = [
  { value: 'standard', label: 'Standard' },
  { value: 'pomodoro', label: 'Pomodoro' },
  { value: 'deep_work', label: 'Deep Work' },
]

export default function StartSessionModal({ open, onClose }) {
  const dispatch = useDispatch()
  const qc = useQueryClient()
  const [form, setForm] = useState({ subjectId: '', topicId: '', title: '', mode: 'standard' })
  const [loading, setLoading] = useState(false)

  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: () => subjectAPI.getAll(), select: d => d.data.data.subjects, enabled: open })
  const { data: topics } = useQuery({ queryKey: ['topics', form.subjectId], queryFn: () => topicAPI.getAll({ subjectId: form.subjectId }), select: d => d.data.data.topics, enabled: !!form.subjectId })

  const handleStart = async () => {
    setLoading(true)
    try {
      const { data } = await sessionAPI.start({ subjectId: form.subjectId || undefined, topicId: form.topicId || undefined, title: form.title, mode: form.mode })
      dispatch(setActiveSession(data.data.session))
      dispatch(setRunning(true))
      dispatch(setElapsedSeconds(0))
      qc.invalidateQueries(['active-session'])
      onClose()
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Study Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Subject (optional)</Label>
            <Select value={form.subjectId} onValueChange={v => setForm(p => ({...p, subjectId: v, topicId: ''}))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select subject..." /></SelectTrigger>
              <SelectContent>
                {subjects?.map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {form.subjectId && topics?.length > 0 && (
            <div>
              <Label>Topic (optional)</Label>
              <Select value={form.topicId} onValueChange={v => setForm(p => ({...p, topicId: v}))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select topic..." /></SelectTrigger>
                <SelectContent>
                  {topics.map(t => <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Session Title (optional)</Label>
            <Input className="mt-1" placeholder="e.g. Chapter 5 revision..." value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} />
          </div>
          <div>
            <Label>Mode</Label>
            <Select value={form.mode} onValueChange={v => setForm(p => ({...p, mode: v}))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {modes.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleStart} disabled={loading} className="flex-1">
              {loading ? 'Starting...' : 'Start Session'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
