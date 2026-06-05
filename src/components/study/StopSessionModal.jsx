import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { authAPI, sessionAPI } from '../../lib/api'
import { clearActiveSession } from '../../store/slices/sessionSlice'
import { setCredentials } from '../../store/slices/authSlice'
import { formatDuration } from '../../lib/utils'

const moods = ['terrible','bad','neutral','good','great']

const getQualityScore = (form, elapsed) => {
  const focusPart = Number(form.focusScore) * 4
  const productivityPart = Number(form.productivityRating) * 4
  const durationPart = Math.min(20, Math.round((elapsed || 0) / 1800) * 5)
  const reflectionPart = form.reflection.completed.trim() || form.reflection.nextAction.trim() ? 10 : 0
  const distractionPenalty = Math.min(20, Number(form.reflection.distractions || 0) * 3)
  return Math.max(0, Math.min(100, focusPart + productivityPart + durationPart + reflectionPart - distractionPenalty))
}

export default function StopSessionModal({ open, onClose, session, elapsed, extraData = {} }) {
  const dispatch = useDispatch()
  const qc = useQueryClient()
  const [form, setForm] = useState({
    notes: '',
    mood: 'neutral',
    focusScore: 7,
    productivityRating: 7,
    reflection: { completed: '', blockers: '', nextAction: '', distractions: 0 },
  })
  const [loading, setLoading] = useState(false)
  const qualityScore = getQualityScore(form, elapsed)

  const handleStop = async () => {
    setLoading(true)
    try {
      await sessionAPI.stop(session._id, { ...form, ...extraData })
      dispatch(clearActiveSession())
      qc.invalidateQueries(['active-session'])
      qc.invalidateQueries(['sessions'])
      qc.invalidateQueries(['dashboard-stats'])
      qc.invalidateQueries(['subjects'])
      qc.invalidateQueries(['topics'])
      qc.invalidateQueries(['exams'])
      const { data } = await authAPI.getMe()
      dispatch(setCredentials({ user: data.data.user }))
      onClose()
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-accent/50 text-center">
            <p className="text-2xl font-mono font-bold text-primary">{formatDuration(elapsed)}</p>
            <p className="text-xs text-muted-foreground mt-1">Session Duration</p>
          </div>
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-border bg-background/70 p-3">
            <div>
              <p className="text-sm font-semibold">Session Quality</p>
              <p className="text-xs text-muted-foreground">Focus, output, time, reflection, and distractions</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-primary">{qualityScore}</p>
              <p className="text-[10px] text-muted-foreground">/100</p>
            </div>
          </div>
          <div>
            <Label>How was your mood?</Label>
            <div className="flex gap-2 mt-2">
              {moods.map(m => (
                <button key={m} onClick={() => setForm(p => ({...p, mood: m}))}
                  className={`flex-1 py-2 rounded-lg text-xs capitalize transition-all border ${form.mood === m ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Focus Score: {form.focusScore}/10</Label>
            <input type="range" min={1} max={10} value={form.focusScore} onChange={e => setForm(p => ({...p, focusScore: Number(e.target.value)}))} className="w-full mt-2 accent-blue-500" />
          </div>
          <div>
            <Label>Productivity: {form.productivityRating}/10</Label>
            <input type="range" min={1} max={10} value={form.productivityRating} onChange={e => setForm(p => ({...p, productivityRating: Number(e.target.value)}))} className="w-full mt-2 accent-blue-500" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>What did you complete?</Label>
              <Textarea className="mt-1" placeholder="Concrete output from this session..." value={form.reflection.completed} onChange={e => setForm(p => ({...p, reflection: {...p.reflection, completed: e.target.value}}))} rows={2} />
            </div>
            <div>
              <Label>What blocked you?</Label>
              <Textarea className="mt-1" placeholder="Confusion, distraction, missing resource..." value={form.reflection.blockers} onChange={e => setForm(p => ({...p, reflection: {...p.reflection, blockers: e.target.value}}))} rows={2} />
            </div>
            <div>
              <Label>Next action</Label>
              <Textarea className="mt-1" placeholder="The next tiny step..." value={form.reflection.nextAction} onChange={e => setForm(p => ({...p, reflection: {...p.reflection, nextAction: e.target.value}}))} rows={2} />
            </div>
            <div className="sm:col-span-2">
              <Label>Distractions: {form.reflection.distractions}</Label>
              <input type="range" min={0} max={10} value={form.reflection.distractions} onChange={e => setForm(p => ({...p, reflection: {...p.reflection, distractions: Number(e.target.value)}}))} className="w-full mt-2 accent-blue-500" />
            </div>
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Textarea className="mt-1" placeholder="What did you study? Any insights..." value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} rows={3} />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleStop} disabled={loading} className="flex-1">
              {loading ? 'Saving...' : 'Complete Session'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
