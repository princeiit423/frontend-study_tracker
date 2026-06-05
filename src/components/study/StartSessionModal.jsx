import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import FancySelect from '../ui/FancySelect'
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
  const [form, setForm] = useState({ subjectId: '', topicId: '', title: '', intent: '', mode: 'standard' })
  const [loading, setLoading] = useState(false)

  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: () => subjectAPI.getAll(), select: d => d.data.data.subjects, enabled: open })
  const { data: topics } = useQuery({ queryKey: ['topics', form.subjectId], queryFn: () => topicAPI.getAll({ subjectId: form.subjectId }), select: d => d.data.data.topics, enabled: !!form.subjectId })
  const subjectOptions = [{ value: '', label: 'No subject' }, ...(subjects || []).map(subject => ({ value: subject._id, label: subject.name, color: subject.color }))]
  const topicOptions = [{ value: '', label: 'No topic' }, ...(topics || []).map(topic => ({ value: topic._id, label: topic.name }))]
  const modeOptions = modes.map(mode => ({ value: mode.value, label: mode.label }))

  const handleStart = async () => {
    setLoading(true)
    try {
      const title = form.title.trim() || form.intent.trim()
      const { data } = await sessionAPI.start({ subjectId: form.subjectId || undefined, topicId: form.topicId || undefined, title, mode: form.mode })
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
            <FancySelect
              className="mt-1"
              value={form.subjectId}
              onChange={subjectId => setForm(p => ({ ...p, subjectId, topicId: '' }))}
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
                onChange={topicId => setForm(p => ({ ...p, topicId }))}
                options={topicOptions}
                placeholder="Select topic..."
              />
            </div>
          )}
          <div>
            <Label>Session Title (optional)</Label>
            <Input className="mt-1" placeholder="e.g. Chapter 5 revision..." value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} />
          </div>
          <div>
            <Label>Focus Intent</Label>
            <Textarea
              className="mt-1 min-h-[86px] resize-none"
              placeholder="What exactly will you finish before this session ends?"
              value={form.intent}
              onChange={e => setForm(p => ({...p, intent: e.target.value}))}
            />
          </div>
          <div>
            <Label>Mode</Label>
            <FancySelect
              className="mt-1"
              value={form.mode}
              onChange={mode => setForm(p => ({ ...p, mode }))}
              options={modeOptions}
            />
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
