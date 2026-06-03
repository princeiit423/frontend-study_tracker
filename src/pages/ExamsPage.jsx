import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, BookMarked, Calendar, Target, Trash2, Edit2, TrendingUp, ChevronRight } from 'lucide-react'
import { examAPI } from '../lib/api'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { getDaysUntil, formatDate } from '../lib/utils'

function ExamForm({ exam, onClose, onSave }) {
  const [form, setForm] = useState(exam ? {
    name: exam.name, examDate: exam.examDate?.split('T')[0] || '', targetScore: exam.targetScore || '',
    targetRank: exam.targetRank || '', category: exam.category || '', isPrimary: exam.isPrimary || false,
  } : { name: '', examDate: '', targetScore: '', targetRank: '', category: '', isPrimary: false })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.name || !form.examDate) return
    setLoading(true)
    try { await onSave(form); onClose() } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Exam Name *</Label>
          <Input className="mt-1" placeholder="e.g. JEE Advanced 2025" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
        </div>
        <div>
          <Label>Exam Date *</Label>
          <Input className="mt-1" type="date" value={form.examDate} onChange={e => setForm(p => ({...p, examDate: e.target.value}))} min={new Date().toISOString().split('T')[0]} />
        </div>
        <div>
          <Label>Category</Label>
          <Input className="mt-1" placeholder="e.g. Engineering, Civil Services..." value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))} />
        </div>
        <div>
          <Label>Target Score</Label>
          <Input className="mt-1" placeholder="e.g. 300" value={form.targetScore} onChange={e => setForm(p => ({...p, targetScore: e.target.value}))} />
        </div>
        <div>
          <Label>Target Rank</Label>
          <Input className="mt-1" placeholder="e.g. Under 1000" value={form.targetRank} onChange={e => setForm(p => ({...p, targetRank: e.target.value}))} />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.isPrimary} onChange={e => setForm(p => ({...p, isPrimary: e.target.checked}))} className="rounded" />
        <span className="text-sm text-muted-foreground">Set as primary exam</span>
      </label>
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading || !form.name || !form.examDate} className="flex-1">
          {loading ? 'Saving...' : exam ? 'Update Exam' : 'Create Exam'}
        </Button>
      </div>
    </div>
  )
}

export default function ExamsPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editExam, setEditExam] = useState(null)
  const [readiness, setReadiness] = useState(null)
  const [loadingReadiness, setLoadingReadiness] = useState(null)

  const { data: exams, isLoading } = useQuery({ queryKey: ['exams'], queryFn: () => examAPI.getAll(), select: d => d.data.data.exams })

  const createMutation = useMutation({ mutationFn: (data) => examAPI.create(data), onSuccess: () => qc.invalidateQueries(['exams']) })
  const updateMutation = useMutation({ mutationFn: ({ id, ...data }) => examAPI.update(id, data), onSuccess: () => qc.invalidateQueries(['exams']) })
  const deleteMutation = useMutation({ mutationFn: (id) => examAPI.delete(id), onSuccess: () => qc.invalidateQueries(['exams']) })

  const handleReadiness = async (examId) => {
    setLoadingReadiness(examId)
    try { const { data } = await examAPI.getReadiness(examId); setReadiness({ examId, ...data.data.prediction }) } catch (e) { console.error(e) } finally { setLoadingReadiness(null) }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Exams</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your exam preparation targets</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2"><Plus size={14} /> Add Exam</Button>
      </div>

      {exams?.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <BookMarked size={32} className="text-muted-foreground mx-auto mb-4" />
          <p className="font-medium mb-2">No exams added</p>
          <p className="text-muted-foreground text-sm mb-6">Add your first exam to start tracking your preparation</p>
          <Button onClick={() => setShowCreate(true)}><Plus size={14} className="mr-2" /> Add Exam</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {exams.map((exam, i) => {
            const daysLeft = getDaysUntil(exam.examDate)
            const r = readiness?.examId === exam._id ? readiness : null
            return (
              <motion.div key={exam._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={exam.isPrimary ? 'border-primary/30' : ''}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{exam.name}</p>
                          {exam.isPrimary && <Badge variant="default" className="text-[10px]">Primary</Badge>}
                        </div>
                        {exam.category && <p className="text-xs text-muted-foreground">{exam.category}</p>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditExam(exam)}><Edit2 size={13} /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(exam._id)}><Trash2 size={13} /></Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-2 rounded-lg bg-accent/50">
                        <p className="text-xl font-bold text-primary">{daysLeft}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">days left</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-accent/50">
                        <p className="text-sm font-semibold truncate">{exam.targetScore || '—'}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">target score</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-accent/50">
                        <p className="text-sm font-semibold truncate">{exam.targetRank || '—'}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">target rank</p>
                      </div>
                    </div>

                    {exam.readinessScore > 0 && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground">Readiness</span>
                          <span className="font-semibold text-primary">{exam.readinessScore}%</span>
                        </div>
                        <Progress value={exam.readinessScore} />
                      </div>
                    )}

                    {r && (
                      <div className="mb-4 p-3 rounded-lg bg-accent/50 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium">Readiness Score</span>
                          <span className="text-lg font-bold text-primary">{r.readinessScore}%</span>
                        </div>
                        {r.strongAreas?.length > 0 && <p className="text-xs text-muted-foreground"><span className="text-emerald-500 font-medium">Strong:</span> {r.strongAreas.join(', ')}</p>}
                        {r.weakAreas?.length > 0 && <p className="text-xs text-muted-foreground"><span className="text-red-500 font-medium">Weak:</span> {r.weakAreas.join(', ')}</p>}
                        <p className="text-xs text-muted-foreground">{r.recommendation}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <p className="text-xs text-muted-foreground flex-1 flex items-center gap-1">
                        <Calendar size={11} /> {formatDate(exam.examDate)}
                      </p>
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleReadiness(exam._id)} disabled={loadingReadiness === exam._id}>
                        {loadingReadiness === exam._id ? 'Analyzing...' : <><TrendingUp size={11} className="mr-1" /> Predict Readiness</>}
                      </Button>
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
          <DialogHeader><DialogTitle>Add New Exam</DialogTitle></DialogHeader>
          <ExamForm onClose={() => setShowCreate(false)} onSave={(data) => createMutation.mutateAsync(data)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editExam} onOpenChange={() => setEditExam(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Exam</DialogTitle></DialogHeader>
          {editExam && <ExamForm exam={editExam} onClose={() => setEditExam(null)} onSave={(data) => updateMutation.mutateAsync({ id: editExam._id, ...data })} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
