import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, ClipboardList, TrendingUp, Trash2, Target } from 'lucide-react'
import { mockTestAPI, examAPI } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../components/ui/Select'
import { Textarea } from '../components/ui/textarea'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatDate } from '../lib/utils'

function MockTestForm({ onClose, onSave }) {
  const { data: exams } = useQuery({ queryKey: ['exams'], queryFn: () => examAPI.getAll(), select: d => d.data.data.exams })
  const [form, setForm] = useState({ name: '', exam: '', takenAt: new Date().toISOString().split('T')[0], score: '', maxScore: '', totalQuestions: '', attemptedQuestions: '', correctAnswers: '', duration: '', platform: '', notes: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.name || !form.score || !form.maxScore) return
    setLoading(true)
    try {
      await onSave({ ...form, score: Number(form.score), maxScore: Number(form.maxScore), totalQuestions: Number(form.totalQuestions) || 0, attemptedQuestions: Number(form.attemptedQuestions) || 0, correctAnswers: Number(form.correctAnswers) || 0, duration: Number(form.duration) || 0, exam: form.exam || undefined })
      onClose()
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Test Name *</Label>
        <Input className="mt-1" placeholder="e.g. JEE Mock Test 5, GATE 2023 Paper..." value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Exam</Label>
          <Select value={form.exam} onValueChange={v => setForm(p => ({...p, exam: v}))}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select exam..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">No exam</SelectItem>
              {exams?.map(e => <SelectItem key={e._id} value={e._id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Date *</Label>
          <Input className="mt-1" type="date" value={form.takenAt} onChange={e => setForm(p => ({...p, takenAt: e.target.value}))} />
        </div>
        <div>
          <Label>Score *</Label>
          <Input className="mt-1" type="number" placeholder="e.g. 285" value={form.score} onChange={e => setForm(p => ({...p, score: e.target.value}))} />
        </div>
        <div>
          <Label>Max Score *</Label>
          <Input className="mt-1" type="number" placeholder="e.g. 360" value={form.maxScore} onChange={e => setForm(p => ({...p, maxScore: e.target.value}))} />
        </div>
        <div>
          <Label>Total Questions</Label>
          <Input className="mt-1" type="number" value={form.totalQuestions} onChange={e => setForm(p => ({...p, totalQuestions: e.target.value}))} />
        </div>
        <div>
          <Label>Correct Answers</Label>
          <Input className="mt-1" type="number" value={form.correctAnswers} onChange={e => setForm(p => ({...p, correctAnswers: e.target.value}))} />
        </div>
        <div>
          <Label>Duration (mins)</Label>
          <Input className="mt-1" type="number" value={form.duration} onChange={e => setForm(p => ({...p, duration: e.target.value}))} />
        </div>
        <div>
          <Label>Platform</Label>
          <Input className="mt-1" placeholder="e.g. Allen, Embibe..." value={form.platform} onChange={e => setForm(p => ({...p, platform: e.target.value}))} />
        </div>
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea className="mt-1" rows={2} placeholder="Key observations..." value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} />
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading || !form.name || !form.score || !form.maxScore} className="flex-1">
          {loading ? 'Saving...' : 'Log Test'}
        </Button>
      </div>
    </div>
  )
}

export default function MockTestsPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)

  const { data: tests, isLoading } = useQuery({ queryKey: ['mock-tests'], queryFn: () => mockTestAPI.getAll(), select: d => d.data.data.tests })
  const { data: trends } = useQuery({ queryKey: ['mock-test-trends'], queryFn: () => mockTestAPI.getTrends(), select: d => d.data.data.trends })
  const createMutation = useMutation({ mutationFn: mockTestAPI.create, onSuccess: () => qc.invalidateQueries(['mock-tests']) })
  const deleteMutation = useMutation({ mutationFn: mockTestAPI.delete, onSuccess: () => qc.invalidateQueries(['mock-tests']) })

  const avgScore = tests?.length ? Math.round(tests.reduce((a, t) => a + (t.score / t.maxScore) * 100, 0) / tests.length) : 0
  const bestScore = tests?.length ? Math.round(Math.max(...tests.map(t => (t.score / t.maxScore) * 100))) : 0
  const lastScore = tests?.length ? Math.round((tests[0].score / tests[0].maxScore) * 100) : 0

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Mock Tests</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{tests?.length || 0} tests logged</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2"><Plus size={14} /> Log Test</Button>
      </div>

      {tests?.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Average Score', value: `${avgScore}%`, icon: Target },
              { label: 'Best Score', value: `${bestScore}%`, icon: TrendingUp },
              { label: 'Latest Score', value: `${lastScore}%`, icon: ClipboardList },
            ].map(({ label, value, icon: Icon }) => (
              <Card key={label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <Icon size={14} className="text-primary" />
                  </div>
                  <p className="text-2xl font-bold">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {trends?.length > 1 && (
            <Card>
              <CardHeader><CardTitle>Score Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trends.map(t => ({ ...t, percentage: Math.round((t.score / t.maxScore) * 100), label: formatDate(t.date) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={(v) => [`${v}%`, 'Score']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="percentage" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {tests?.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <ClipboardList size={32} className="text-muted-foreground mx-auto mb-4" />
          <p className="font-medium mb-2">No mock tests logged</p>
          <p className="text-muted-foreground text-sm mb-6">Track your mock test performance to measure progress</p>
          <Button onClick={() => setShowCreate(true)}><Plus size={14} className="mr-2" /> Log First Test</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {tests.map((t, i) => (
            <motion.div key={t._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card group hover:border-primary/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{t.name}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground">{formatDate(t.takenAt)}</span>
                    {t.exam && <Badge variant="outline" className="text-[10px] h-4">{t.exam.name}</Badge>}
                    {t.platform && <span className="text-xs text-muted-foreground">{t.platform}</span>}
                    {t.accuracy > 0 && <span className="text-xs text-muted-foreground">Accuracy: {t.accuracy}%</span>}
                    {t.duration > 0 && <span className="text-xs text-muted-foreground">{t.duration}m</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-lg">{t.score}<span className="text-sm font-normal text-muted-foreground">/{t.maxScore}</span></p>
                  <p className="text-xs font-medium" style={{ color: (t.score / t.maxScore) >= 0.7 ? '#22c55e' : (t.score / t.maxScore) >= 0.5 ? '#f97316' : '#ef4444' }}>
                    {Math.round((t.score / t.maxScore) * 100)}%
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => deleteMutation.mutate(t._id)}>
                  <Trash2 size={12} />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Log Mock Test</DialogTitle></DialogHeader>
          <MockTestForm onClose={() => setShowCreate(false)} onSave={(d) => createMutation.mutateAsync(d)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
