import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Brain, ChevronRight, Trash2, Edit2, Clock } from 'lucide-react'
import { subjectAPI, examAPI } from '../lib/api'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import FancySelect from '../components/ui/FancySelect'
import { formatHours } from '../lib/utils'

const COLORS = ['#3b82f6','#8b5cf6','#22c55e','#f97316','#ec4899','#14b8a6','#eab308','#ef4444','#64748b','#06b6d4']
const PRIORITIES = ['low','medium','high','critical']
const PRIORITIES_COLOR = { low: 'secondary', medium: 'default', high: 'warning', critical: 'destructive' }

function getSubjectExamId(subject) {
  if (!subject?.exam) return ''
  return typeof subject.exam === 'string' ? subject.exam : subject.exam._id || ''
}

function SubjectForm({ subject, onClose, onSave }) {
  const { data: exams } = useQuery({ queryKey: ['exams'], queryFn: () => examAPI.getAll(), select: d => d.data.data.exams })
  const examOptions = [{ value: '', label: 'No exam' }, ...(exams || []).map(exam => ({ value: exam._id, label: exam.name, color: exam.color }))]
  const priorityOptions = PRIORITIES.map(priority => ({ value: priority, label: priority[0].toUpperCase() + priority.slice(1) }))
  const [form, setForm] = useState(subject ? {
    name: subject.name, description: subject.description || '', color: subject.color || '#3b82f6',
    goalHours: subject.goalHours || 0, priority: subject.priority || 'medium', exam: getSubjectExamId(subject),
  } : { name: '', description: '', color: '#3b82f6', goalHours: 0, priority: 'medium', exam: '' })
  const [loading, setLoading] = useState(false)
  const handleSubmit = async () => {
    if (!form.name) return
    setLoading(true)
    try { await onSave(form); onClose() } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Subject Name *</Label>
        <Input className="mt-1" placeholder="e.g. Mathematics, DSA, Physics..." value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
      </div>
      <div>
        <Label>Exam (optional)</Label>
        <FancySelect
          className="mt-1"
          value={form.exam}
          onChange={exam => setForm(p => ({ ...p, exam }))}
          options={examOptions}
          placeholder="Link to exam..."
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Priority</Label>
          <FancySelect
            className="mt-1"
            value={form.priority}
            onChange={priority => setForm(p => ({ ...p, priority }))}
            options={priorityOptions}
          />
        </div>
        <div>
          <Label>Goal Hours</Label>
          <Input className="mt-1" type="number" min={0} placeholder="0" value={form.goalHours} onChange={e => setForm(p => ({...p, goalHours: Number(e.target.value)}))} />
        </div>
      </div>
      <div>
        <Label>Color</Label>
        <div className="flex gap-2 mt-2 flex-wrap">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              aria-label={`Use color ${c}`}
              onClick={() => setForm(p => ({...p, color: c}))}
              className={`h-8 w-8 rounded-full border border-white/20 transition-all hover:scale-105 ${form.color?.toLowerCase() === c.toLowerCase() ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-card' : ''}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading || !form.name} className="flex-1">
          {loading ? 'Saving...' : subject ? 'Update' : 'Create Subject'}
        </Button>
      </div>
    </div>
  )
}

export default function SubjectsPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editSubject, setEditSubject] = useState(null)
  const [filter, setFilter] = useState('all')

  const { data: subjects = [], isLoading } = useQuery({ queryKey: ['subjects'], queryFn: () => subjectAPI.getAll(), select: d => d.data.data.subjects })
  const patchSubjectsCache = (updater) => {
    qc.setQueryData(['subjects'], previous => {
      if (Array.isArray(previous)) return updater(previous)
      if (previous?.data?.data?.subjects) {
        return {
          ...previous,
          data: {
            ...previous.data,
            data: {
              ...previous.data.data,
              subjects: updater(previous.data.data.subjects),
            },
          },
        }
      }
      return previous
    })
  }
  const createMutation = useMutation({ mutationFn: subjectAPI.create, onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }) })
  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }) => subjectAPI.update(id, d),
    onMutate: async ({ id, ...updates }) => {
      await qc.cancelQueries({ queryKey: ['subjects'] })
      const previousSubjects = qc.getQueryData(['subjects'])
      patchSubjectsCache(items => items.map(subject => subject._id === id ? { ...subject, ...updates, exam: updates.exam ? subject.exam : null } : subject))
      setEditSubject(current => current?._id === id ? { ...current, ...updates } : current)
      return { previousSubjects }
    },
    onSuccess: (response, variables) => {
      const updatedSubject = response.data.data.subject
      patchSubjectsCache(items => items.map(subject =>
        subject._id === variables.id ? { ...subject, ...updatedSubject } : subject
      ))
      setEditSubject(null)
      qc.refetchQueries({ queryKey: ['subjects'] })
    },
    onError: (_error, _variables, context) => {
      if (context?.previousSubjects) qc.setQueryData(['subjects'], context.previousSubjects)
    },
  })
  const deleteMutation = useMutation({ mutationFn: subjectAPI.delete, onSuccess: () => qc.invalidateQueries({ queryKey: ['subjects'] }) })

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Subjects</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{subjects?.length || 0} subjects</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2"><Plus size={14} /> Add Subject</Button>
      </div>

      {subjects?.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <Brain size={32} className="text-muted-foreground mx-auto mb-4" />
          <p className="font-medium mb-2">No subjects yet</p>
          <p className="text-muted-foreground text-sm mb-6">Create your first subject to start organizing your study material</p>
          <Button onClick={() => setShowCreate(true)}><Plus size={14} className="mr-2" /> Add Subject</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((s, i) => (
            <motion.div key={s._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="group hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${s.color}20` }}>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight">{s.name}</p>
                        {s.exam && <p className="text-[10px] text-muted-foreground mt-0.5">{s.exam.name}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditSubject(s)}><Edit2 size={11} /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(s._id)}><Trash2 size={11} /></Button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{s.completionPercentage || 0}%</span>
                    </div>
                    <Progress value={s.completionPercentage || 0} indicatorStyle={{ backgroundColor: s.color }} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={11} />
                      <span>{formatHours(s.totalStudyHours || 0)}</span>
                      {s.goalHours > 0 && <span className="text-muted-foreground/50">/ {s.goalHours}h goal</span>}
                    </div>
                    <Link to={`/subjects/${s._id}/topics`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                      Topics <ChevronRight size={11} />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Subject</DialogTitle></DialogHeader>
          <SubjectForm onClose={() => setShowCreate(false)} onSave={subjectAPI.create.bind(null)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editSubject} onOpenChange={() => setEditSubject(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Subject</DialogTitle></DialogHeader>
          {editSubject && <SubjectForm subject={editSubject} onClose={() => setEditSubject(null)} onSave={(data) => updateMutation.mutateAsync({ id: editSubject._id, ...data })} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
