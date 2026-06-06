import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react'
import { taskAPI } from '../lib/api'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select'

const todayKey = () => new Date().toISOString().split('T')[0]

export default function TasksPage() {
  const qc = useQueryClient()
  const [date, setDate] = useState(todayKey())
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [view, setView] = useState('day')
  const [status, setStatus] = useState('all')
  const taskParams = view === 'day'
    ? { date }
    : { ...(status !== 'all' ? { completed: status === 'completed' } : {}) }
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', view, date, status],
    queryFn: () => taskAPI.getAll(taskParams),
    select: d => d.data.data.tasks,
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['tasks'] })
  const createMutation = useMutation({ mutationFn: taskAPI.create, onSuccess: invalidate })
  const updateMutation = useMutation({ mutationFn: ({ id, ...data }) => taskAPI.update(id, data), onSuccess: invalidate })
  const deleteMutation = useMutation({ mutationFn: taskAPI.delete, onSuccess: invalidate })

  const addTask = async () => {
    if (!title.trim()) return
    await createMutation.mutateAsync({ title: title.trim(), date, priority })
    setTitle('')
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold">Daily Tasks</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Plan today, check it off, keep moving.</p>
      </div>
      <Card className="overflow-visible">
        <CardContent className="p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-[160px_1fr_130px_auto]">
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            <Input placeholder="Add a task..." value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} />
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['low', 'medium', 'high'].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={addTask}><Plus size={15} /> Add</Button>
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-xl border border-border bg-card p-1">
          {[
            { value: 'day', label: 'Selected Day' },
            { value: 'history', label: 'All Records' },
          ].map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setView(option.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${view === option.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {view === 'history' && (
          <Select value={status} onValueChange={setStatus} className="w-full sm:w-44">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tasks</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Not completed</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="space-y-2">
        {tasks.map(task => (
          <div key={task._id} className={`flex items-center gap-3 rounded-xl border border-border bg-card p-4 ${task.isCompleted ? 'opacity-70' : ''}`}>
            <button onClick={() => updateMutation.mutate({ id: task._id, isCompleted: !task.isCompleted })}>
              {task.isCompleted ? <CheckCircle2 size={19} className="text-emerald-500" /> : <Circle size={19} className="text-muted-foreground" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${task.isCompleted ? 'line-through text-muted-foreground' : ''}`}>{task.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground capitalize">{task.priority} priority</span>
                <Badge variant="outline" className="h-5 text-[10px]">{task.date}</Badge>
                <Badge variant={task.isCompleted ? 'success' : 'secondary'} className="h-5 text-[10px]">
                  {task.isCompleted ? 'Completed' : 'Not completed'}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(task._id)}><Trash2 size={14} /></Button>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            {view === 'day' ? 'No tasks for this day.' : 'No task records found.'}
          </div>
        )}
      </div>
    </div>
  )
}
