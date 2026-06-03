import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Check, BookOpen } from 'lucide-react'
import { userAPI, examAPI, subjectAPI } from '../lib/api'
import { updateUser } from '../store/slices/authSlice'
import { selectUser } from '../store/slices/authSlice'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

const steps = ['Welcome', 'Your Exam', 'Study Goals', 'Subjects', 'Done']

export default function OnboardingPage() {
  const user = useSelector(selectUser)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [examData, setExamData] = useState({ name: '', examDate: '', targetScore: '', targetRank: '' })
  const [goalData, setGoalData] = useState({ dailyGoalHours: 4, weeklyGoalHours: 28 })
  const [subjects, setSubjects] = useState([''])
  const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)

  const addSubject = () => setSubjects([...subjects, ''])
  const updateSubject = (i, val) => { const s = [...subjects]; s[i] = val; setSubjects(s) }
  const removeSubject = (i) => setSubjects(subjects.filter((_, idx) => idx !== i))

  const handleFinish = async () => {
    setLoading(true)
    try {
      await userAPI.onboard({ timezone, preferences: goalData, theme: { mode: 'dark' } })
      if (examData.name && examData.examDate) {
        const { data: examRes } = await examAPI.create({ ...examData, isPrimary: true })
        const validSubjects = subjects.filter(s => s.trim())
        await Promise.all(validSubjects.map(name => subjectAPI.create({ name, exam: examRes.data.exam._id })))
      }
      dispatch(updateUser({ isOnboarded: true }))
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    if (step === 1) return examData.name && examData.examDate
    if (step === 3) return subjects.some(s => s.trim())
    return true
  }

  const stepContent = [
    // Step 0 - Welcome
    <div key="welcome" className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <BookOpen size={28} className="text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-3">Welcome, {user?.name?.split(' ')[0]}!</h2>
      <p className="text-muted-foreground leading-relaxed">Let's set up your personalized exam preparation workspace. This will only take 2 minutes.</p>
    </div>,

    // Step 1 - Exam
    <div key="exam" className="space-y-4">
      <div>
        <h2 className="text-xl font-bold mb-1">Your Exam</h2>
        <p className="text-muted-foreground text-sm">What are you preparing for?</p>
      </div>
      <div className="space-y-3">
        <div>
          <Label>Exam Name *</Label>
          <Input className="mt-1" placeholder="e.g. JEE Advanced, UPSC CSE, CAT 2025..." value={examData.name} onChange={e => setExamData(p => ({...p, name: e.target.value}))} />
        </div>
        <div>
          <Label>Exam Date *</Label>
          <Input className="mt-1" type="date" value={examData.examDate} onChange={e => setExamData(p => ({...p, examDate: e.target.value}))} min={new Date().toISOString().split('T')[0]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Target Score</Label>
            <Input className="mt-1" placeholder="e.g. 300" value={examData.targetScore} onChange={e => setExamData(p => ({...p, targetScore: e.target.value}))} />
          </div>
          <div>
            <Label>Target Rank</Label>
            <Input className="mt-1" placeholder="e.g. Top 1000" value={examData.targetRank} onChange={e => setExamData(p => ({...p, targetRank: e.target.value}))} />
          </div>
        </div>
      </div>
    </div>,

    // Step 2 - Goals
    <div key="goals" className="space-y-4">
      <div>
        <h2 className="text-xl font-bold mb-1">Study Goals</h2>
        <p className="text-muted-foreground text-sm">How much time can you dedicate?</p>
      </div>
      <div className="space-y-4">
        <div>
          <Label>Daily Study Goal (hours)</Label>
          <div className="flex items-center gap-4 mt-2">
            <input type="range" min={1} max={16} value={goalData.dailyGoalHours}
              onChange={e => setGoalData(p => ({...p, dailyGoalHours: Number(e.target.value), weeklyGoalHours: Number(e.target.value) * 7}))}
              className="flex-1 accent-blue-500" />
            <span className="w-12 text-center font-semibold text-primary">{goalData.dailyGoalHours}h</span>
          </div>
        </div>
        <div>
          <Label>Weekly Study Goal (hours)</Label>
          <div className="flex items-center gap-4 mt-2">
            <input type="range" min={7} max={100} value={goalData.weeklyGoalHours}
              onChange={e => setGoalData(p => ({...p, weeklyGoalHours: Number(e.target.value)}))}
              className="flex-1 accent-blue-500" />
            <span className="w-12 text-center font-semibold text-primary">{goalData.weeklyGoalHours}h</span>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
          <p className="text-sm text-muted-foreground">At {goalData.dailyGoalHours}h/day, you'll study approximately <span className="text-foreground font-semibold">{goalData.dailyGoalHours * 30}h</span> this month.</p>
        </div>
      </div>
    </div>,

    // Step 3 - Subjects
    <div key="subjects" className="space-y-4">
      <div>
        <h2 className="text-xl font-bold mb-1">Your Subjects</h2>
        <p className="text-muted-foreground text-sm">Add the subjects you'll be studying.</p>
      </div>
      <div className="space-y-2">
        {subjects.map((s, i) => (
          <div key={i} className="flex gap-2">
            <Input placeholder={`Subject ${i + 1} (e.g. Mathematics, Physics...)`} value={s} onChange={e => updateSubject(i, e.target.value)} />
            {subjects.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => removeSubject(i)} className="shrink-0 text-muted-foreground hover:text-destructive">×</Button>
            )}
          </div>
        ))}
        {subjects.length < 10 && (
          <Button variant="outline" size="sm" onClick={addSubject} className="w-full mt-2">+ Add Subject</Button>
        )}
      </div>
    </div>,

    // Step 4 - Done
    <div key="done" className="text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
        <Check size={28} className="text-emerald-500" />
      </div>
      <h2 className="text-2xl font-bold mb-3">You're all set!</h2>
      <p className="text-muted-foreground leading-relaxed">Your workspace is ready. Start your first study session and begin your journey to success.</p>
    </div>,
  ]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${i < step ? 'bg-primary text-primary-foreground' : i === step ? 'bg-primary/20 text-primary border border-primary' : 'bg-muted text-muted-foreground'}`}>
                {i < step ? <Check size={12} /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`h-px flex-1 min-w-[20px] transition-all ${i < step ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              {stepContent[step]}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8">
            <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
              <ChevronLeft size={16} /> Back
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
                Continue <ChevronRight size={16} />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={loading}>
                {loading ? 'Setting up...' : 'Start Learning'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
