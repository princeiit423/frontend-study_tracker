import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Target, CheckCircle2, Trash2, RefreshCw } from 'lucide-react'
import { goalAPI, subjectAPI, examAPI } from '../lib/api'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../components/ui/Select'
import { formatDate } from '../lib/utils'

const TYPES = ['daily','weekly','monthly','yearly','custom']
const CATEGORIES = ['hours','topics','sessions','score','custom']

function GoalForm({ onClose, onSave }) {
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: () => subjectAPI.getAll(), select: d => d.data.data.subjects })
  const [form, setForm] = useState({ title: '', type: 'monthly', category: 'hours', targetValue: 100, unit: 'hours', startDate: new Date().toISOString().split('T')[0], endDate: '', subject: '', color: '#3b82f6' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.title || !form.targetValue || !form.endDate) return
    setLoading(true)
    try { await onSave({ ...form, subject: form.subject || undefined }); onClose() } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Goal Title *</Label>
        <Input className="mt-1" placeholder="e.g. Study 100 hours this month..." value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Type</Label>
          <Select value={form.type} onValueChange={v => setForm(p => ({...p, type: v}))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Category</Label>
          <Select value={form.category} onValueChange={v => setForm(p => ({...p, category: v}))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Target Value *</Label>
          <Input className="mt-1" type="number" min={1} value={form.targetValue} onChange={e => setForm(p => ({...p, targetValue: Number(e.target.value)}))} />
        </div>
        <div>
          <Label>Unit</Label>
          <Input className="mt-1" placeholder="hours, topics..." value={form.unit} onChange={e => setForm(p => ({...p, unit: e.target.value}))} />
        </div>
        <div>
          <Label>Start Date</Label>
          <Input className="mt-1" type="date" value={form.startDate} onChange={e => setForm(p => ({...p, startDate: e.target.value}))} />
        </div>
        <div>
          <Label>End Date *</Label>
          <Input className="mt-1" type="date" value={form.endDate} onChange={e => setForm(p => ({...p, endDate: e.target.value}))} min={form.startDate} />
        </div>
      </div>
      <div>
        <Label>Subject (optional)</Label>
        <Select value={form.subject} onValueChange={v => setForm(p => ({...p, subject: v}))}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="All subjects" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All subjects</SelectItem>
            {subjects?.map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading || !form.title || !form.endDate} className="flex-1">
          {loading ? 'Creating...' : 'Create Goal'}
        </Button>
      </div>
    </div>
  )
}

export default function GoalsPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [filter, setFilter] = useState('active')

  const { data: goals, isLoading } = useQuery({ queryKey: ['goals'], queryFn: () => goalAPI.getAll(), select: d => d.data.data.goals })
  const createMutation = useMutation({ mutationFn: goalAPI.create, onSuccess: () => qc.invalidateQueries(['goals']) })
  const deleteMutation = useMutation({ mutationFn: goalAPI.delete, onSuccess: () => qc.invalidateQueries(['goals']) })

  const handleSync = async () => {
    setSyncing(true)
    try { await goalAPI.sync(); qc.invalidateQueries(['goals']) } catch (e) { console.error(e) } finally { setSyncing(false) }
  }

  const filtered = goals?.filter(g => {
    if (filter === 'active') return !g.isCompleted && g.isActive
    if (filter === 'completed') return g.isCompleted
    return true
  }) || []

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Goals</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{goals?.filter(g => !g.isCompleted).length || 0} active goals</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing} className="gap-2">
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} /> Sync
          </Button>
          <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2"><Plus size={14} /> New Goal</Button>
        </div>
      </div>

      <div className="flex gap-2">
        {['active','completed','all'].map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize">{f}</Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <Target size={32} className="text-muted-foreground mx-auto mb-4" />
          <p className="font-medium mb-2">No {filter} goals</p>
          <p className="text-muted-foreground text-sm mb-6">Set goals to stay focused and motivated</p>
          <Button onClick={() => setShowCreate(true)}><Plus size={14} className="mr-2" /> Create Goal</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((g, i) => {
            const progress = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100))
            return (
              <motion.div key={g._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className={g.isCompleted ? 'opacity-70' : ''}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        {g.isCompleted ? <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" /> : <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: g.color }} />}
                        <div>
                          <p className="font-semibold text-sm">{g.title}</p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-[10px] h-4 capitalize">{g.type}</Badge>
                            <Badge variant="outline" className="text-[10px] h-4 capitalize">{g.category}</Badge>
                            {g.subject && <Badge variant="secondary" className="text-[10px] h-4">{g.subject.name}</Badge>}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => deleteMutation.mutate(g._id)}>
                        <Trash2 size={12} />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{g.currentValue} / {g.targetValue} {g.unit}</span>
                        <span className="font-semibold">{progress}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>

                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <span>Ends {formatDate(g.endDate)}</span>
                      {g.isCompleted && <span className="text-emerald-500 font-medium">Completed!</span>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Goal</DialogTitle></DialogHeader>
          <GoalForm onClose={() => setShowCreate(false)} onSave={(data) => createMutation.mutateAsync(data)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
