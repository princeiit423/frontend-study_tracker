import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Check, ChevronLeft, Trash2, Circle, CheckCircle2 } from 'lucide-react'
import { topicAPI, subjectAPI } from '../lib/api'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../components/ui/select'

const PRIORITY_COLORS = { low: 'secondary', medium: 'default', high: 'warning', critical: 'destructive' }
const DIFFICULTY_COLORS = { easy: 'success', medium: 'default', hard: 'warning', expert: 'destructive' }

function TopicForm({ subjectId, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', priority: 'medium', difficulty: 'medium', estimatedHours: 0 })
  const [loading, setLoading] = useState(false)
  const handleSubmit = async () => {
    if (!form.name) return
    setLoading(true)
    try { await onSave({ ...form, subjectId }); onClose() } catch (e) { console.error(e) } finally { setLoading(false) }
  }
  return (
    <div className="space-y-4">
      <div>
        <Label>Topic Name *</Label>
        <Input className="mt-1" placeholder="e.g. Integration, Pointers, Newton's Laws..." value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Priority</Label>
          <Select value={form.priority} onValueChange={v => setForm(p => ({...p, priority: v}))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['low','medium','high','critical'].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Difficulty</Label>
          <Select value={form.difficulty} onValueChange={v => setForm(p => ({...p, difficulty: v}))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['easy','medium','hard','expert'].map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Estimated Hours</Label>
        <Input className="mt-1" type="number" min={0} step={0.5} value={form.estimatedHours} onChange={e => setForm(p => ({...p, estimatedHours: Number(e.target.value)}))} />
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading || !form.name} className="flex-1">Add Topic</Button>
      </div>
    </div>
  )
}

export default function TopicsPage() {
  const { id: subjectId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)

  const { data: subjectData } = useQuery({ queryKey: ['subject', subjectId], queryFn: () => subjectAPI.getOne(subjectId), select: d => d.data.data })
  const { data: topics, isLoading } = useQuery({ queryKey: ['topics', subjectId], queryFn: () => topicAPI.getAll({ subjectId }), select: d => d.data.data.topics })

  const createMutation = useMutation({ mutationFn: topicAPI.create, onSuccess: () => { qc.invalidateQueries(['topics', subjectId]); qc.invalidateQueries(['subjects']) } })
  const updateMutation = useMutation({ mutationFn: ({ id, ...d }) => topicAPI.update(id, d), onSuccess: () => { qc.invalidateQueries(['topics', subjectId]); qc.invalidateQueries(['subjects']) } })
  const deleteMutation = useMutation({ mutationFn: topicAPI.delete, onSuccess: () => { qc.invalidateQueries(['topics', subjectId]); qc.invalidateQueries(['subjects']) } })

  const subject = subjectData?.subject
  const completed = topics?.filter(t => t.isCompleted).length || 0
  const total = topics?.length || 0

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/subjects')} className="shrink-0"><ChevronLeft size={16} /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {subject && <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: subject.color }} />}
            <h1 className="text-xl font-bold">{subject?.name || 'Topics'}</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">{completed}/{total} completed</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2"><Plus size={14} /> Add Topic</Button>
      </div>

      {total > 0 && (
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Overall Progress</span>
            <span>{total > 0 ? Math.round((completed / total) * 100) : 0}%</span>
          </div>
          <Progress value={total > 0 ? Math.round((completed / total) * 100) : 0} />
        </div>
      )}

      {topics?.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <p className="font-medium mb-2">No topics yet</p>
          <p className="text-muted-foreground text-sm mb-6">Break down your subject into topics for better tracking</p>
          <Button onClick={() => setShowCreate(true)}><Plus size={14} className="mr-2" /> Add Topic</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {topics.map((t, i) => (
            <motion.div key={t._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
              <div className={`flex items-center gap-3 p-4 rounded-xl border transition-colors group ${t.isCompleted ? 'bg-accent/30 border-border/50' : 'bg-card border-border hover:border-primary/30'}`}>
                <button onClick={() => updateMutation.mutate({ id: t._id, isCompleted: !t.isCompleted })}
                  className="shrink-0 text-muted-foreground hover:text-primary transition-colors">
                  {t.isCompleted ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Circle size={18} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${t.isCompleted ? 'line-through text-muted-foreground' : ''}`}>{t.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={PRIORITY_COLORS[t.priority]} className="text-[10px] h-4">{t.priority}</Badge>
                    <Badge variant={DIFFICULTY_COLORS[t.difficulty]} className="text-[10px] h-4">{t.difficulty}</Badge>
                    {t.estimatedHours > 0 && <span className="text-[10px] text-muted-foreground">{t.estimatedHours}h est.</span>}
                    {t.actualHours > 0 && <span className="text-[10px] text-muted-foreground">{t.actualHours.toFixed(1)}h actual</span>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={() => deleteMutation.mutate(t._id)}>
                  <Trash2 size={12} />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Topic</DialogTitle></DialogHeader>
          <TopicForm subjectId={subjectId} onClose={() => setShowCreate(false)} onSave={(data) => createMutation.mutateAsync(data)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
