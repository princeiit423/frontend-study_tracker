import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select'
import { sessionAPI } from '../../lib/api'
import { clearActiveSession } from '../../store/slices/sessionSlice'
import { formatDuration } from '../../lib/utils'

const moods = ['terrible','bad','neutral','good','great']
const moodColors = { terrible: 'bg-red-500', bad: 'bg-orange-500', neutral: 'bg-gray-400', good: 'bg-green-500', great: 'bg-blue-500' }

export default function StopSessionModal({ open, onClose, session, elapsed }) {
  const dispatch = useDispatch()
  const qc = useQueryClient()
  const [form, setForm] = useState({ notes: '', mood: 'neutral', focusScore: 7, productivityRating: 7 })
  const [loading, setLoading] = useState(false)

  const handleStop = async () => {
    setLoading(true)
    try {
      await sessionAPI.stop(session._id, form)
      dispatch(clearActiveSession())
      qc.invalidateQueries(['active-session'])
      qc.invalidateQueries(['sessions'])
      qc.invalidateQueries(['dashboard-stats'])
      onClose()
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-accent/50 text-center">
            <p className="text-2xl font-mono font-bold text-primary">{formatDuration(elapsed)}</p>
            <p className="text-xs text-muted-foreground mt-1">Session Duration</p>
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
