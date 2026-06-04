import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Wand2 } from 'lucide-react'
import { examAPI, studyPlanAPI, subjectAPI } from '../lib/api'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select'

export default function StudyPlanPage() {
  const qc = useQueryClient()
  const { data: plans = [] } = useQuery({ queryKey: ['study-plans'], queryFn: studyPlanAPI.getAll, select: d => d.data.data.plans })
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: () => subjectAPI.getAll(), select: d => d.data.data.subjects })
  const { data: exams = [] } = useQuery({ queryKey: ['exams'], queryFn: examAPI.getAll, select: d => d.data.data.exams })
  const [form, setForm] = useState({ title: 'My Study Plan', exam: '', examDate: '', dailyHours: 4, weakSubjects: [] })
  const generateMutation = useMutation({ mutationFn: studyPlanAPI.generate, onSuccess: () => qc.invalidateQueries(['study-plans']) })
  const updateDayMutation = useMutation({ mutationFn: ({ planId, dayId, ...data }) => studyPlanAPI.updateDay(planId, dayId, data), onSuccess: () => qc.invalidateQueries(['study-plans']) })

  const selectedExam = exams.find(e => e._id === form.exam)
  const generate = () => generateMutation.mutate({
    ...form,
    exam: form.exam || null,
    examDate: form.examDate || selectedExam?.examDate,
    weakSubjects: form.weakSubjects,
    subjects: subjects.map(s => s._id),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Study Plan Generator</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Generate a day-wise plan from subjects, weak areas, and exam date.</p>
      </div>
      <Card>
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[1fr_180px_140px_auto]">
          <div>
            <Label>Plan title</Label>
            <Input className="mt-1" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div>
            <Label>Exam</Label>
            <Select value={form.exam || '__manual'} onValueChange={value => {
              const exam = exams.find(e => e._id === value)
              setForm(p => ({ ...p, exam: value === '__manual' ? '' : value, examDate: exam?.examDate?.slice(0, 10) || p.examDate }))
            }}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__manual">Manual date</SelectItem>
                {exams.map(exam => <SelectItem key={exam._id} value={exam._id}>{exam.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Daily hours</Label>
            <Input className="mt-1" type="number" min={1} max={16} value={form.dailyHours} onChange={e => setForm(p => ({ ...p, dailyHours: Number(e.target.value) }))} />
          </div>
          <Button className="self-end" onClick={generate} disabled={generateMutation.isPending || !(form.examDate || selectedExam?.examDate)}>
            <Wand2 size={15} /> Generate
          </Button>
          <div className="lg:col-span-4">
            <Label>Exam date</Label>
            <Input className="mt-1 max-w-xs" type="date" value={form.examDate} onChange={e => setForm(p => ({ ...p, examDate: e.target.value }))} />
          </div>
          <div className="lg:col-span-4">
            <Label>Weak subjects</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {subjects.map(subject => {
                const active = form.weakSubjects.includes(subject._id)
                return (
                  <button key={subject._id} type="button" onClick={() => setForm(p => ({ ...p, weakSubjects: active ? p.weakSubjects.filter(id => id !== subject._id) : [...p.weakSubjects, subject._id] }))}
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'}`}>
                    {subject.name}
                  </button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
      {plans.map(plan => (
        <Card key={plan._id}>
          <CardHeader><CardTitle>{plan.title}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {plan.days.slice(0, 30).map(day => (
                <button key={day._id} onClick={() => updateDayMutation.mutate({ planId: plan._id, dayId: day._id, isCompleted: !day.isCompleted })}
                  className={`rounded-lg border border-border p-3 text-left ${day.isCompleted ? 'bg-primary/10' : 'bg-background/60'}`}>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className={day.isCompleted ? 'text-primary' : 'text-muted-foreground'} />
                    <div>
                      <p className="text-xs text-muted-foreground">{day.date} - {day.targetHours}h</p>
                      <p className="text-sm font-semibold">{day.title}</p>
                      {day.subject && <p className="text-xs text-muted-foreground">{day.subject.name}</p>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
