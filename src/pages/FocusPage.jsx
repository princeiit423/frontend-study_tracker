import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Square, X, ChevronDown } from 'lucide-react'
import { sessionAPI, subjectAPI } from '../lib/api'
import { setActiveSession, clearActiveSession, incrementElapsed, setElapsedSeconds, setRunning, setPaused } from '../store/slices/sessionSlice'
import { Button } from '../components/ui/button'
import { formatDuration } from '../lib/utils'
import { selectUser } from '../store/slices/authSlice'

export default function FocusPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const qc = useQueryClient()
  const user = useSelector(selectUser)
  const { activeSession, elapsedSeconds, isRunning, isPaused } = useSelector(s => s.session)
  const timerRef = useRef(null)

  const { data: activeSessionData } = useQuery({ queryKey: ['active-session'], queryFn: () => sessionAPI.getActive(), select: d => d.data.data.session })
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: () => subjectAPI.getAll(), select: d => d.data.data.subjects })

  const [selectedSubject, setSelectedSubject] = useState(null)
  const [showSubjectPicker, setShowSubjectPicker] = useState(false)
  const [pomodoroMode, setPomodoroMode] = useState(false)
  const [pomodoroPhase, setPomodoroPhase] = useState('work') // work | break
  const [pomodoroCount, setPomodoroCount] = useState(0)
  const [mood, setMood] = useState('focus')

  const workMins = user?.preferences?.pomodoroWork || 25
  const breakMins = user?.preferences?.pomodoroBreak || 5
  const pomodoroTarget = pomodoroPhase === 'work' ? workMins * 60 : breakMins * 60

  useEffect(() => {
    if (activeSessionData && !activeSession) {
      dispatch(setActiveSession(activeSessionData))
      const elapsed = Math.floor((Date.now() - new Date(activeSessionData.startTime)) / 1000) - (activeSessionData.totalPausedTime || 0)
      dispatch(setElapsedSeconds(Math.max(0, elapsed)))
      dispatch(setRunning(!activeSessionData.isPaused))
      dispatch(setPaused(activeSessionData.isPaused))
    }
  }, [activeSessionData])

  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => dispatch(incrementElapsed()), 1000)
    } else { clearInterval(timerRef.current) }
    return () => clearInterval(timerRef.current)
  }, [isRunning, isPaused])

  // Pomodoro phase switch
  useEffect(() => {
    if (pomodoroMode && elapsedSeconds >= pomodoroTarget && isRunning) {
      if (pomodoroPhase === 'work') { setPomodoroPhase('break'); setPomodoroCount(c => c + 1); dispatch(setElapsedSeconds(0)) }
      else { setPomodoroPhase('work'); dispatch(setElapsedSeconds(0)) }
    }
  }, [elapsedSeconds, pomodoroMode, pomodoroTarget])

  const currentSession = activeSession || activeSessionData

  const handleStart = async () => {
    try {
      const { data } = await sessionAPI.start({ subjectId: selectedSubject?._id, mode: pomodoroMode ? 'pomodoro' : 'deep_work' })
      const session = data.data.session
      dispatch(setActiveSession(session))
      dispatch(setPaused(false))
      dispatch(setRunning(true))
      dispatch(setElapsedSeconds(0))
      await qc.invalidateQueries(['active-session'])
    } catch (e) { console.error(e) }
  }

  const handlePause = async () => {
    if (!currentSession?._id) return
    try {
      await sessionAPI.pause(currentSession._id)
      dispatch(setPaused(true))
      dispatch(setRunning(false))
      await qc.invalidateQueries(['active-session'])
    } catch (e) { console.error(e) }
  }

  const handleResume = async () => {
    if (!currentSession?._id) return
    try {
      await sessionAPI.resume(currentSession._id)
      dispatch(setPaused(false))
      dispatch(setRunning(true))
      await qc.invalidateQueries(['active-session'])
    } catch (e) { console.error(e) }
  }

  const handleStop = async () => {
    if (!currentSession?._id) return
    try {
      await sessionAPI.stop(currentSession._id, { pomodoroCount })
      dispatch(clearActiveSession())
      await qc.invalidateQueries(['active-session'])
      await qc.invalidateQueries(['dashboard-stats'])
      await qc.invalidateQueries(['sessions'])
      navigate('/dashboard')
    } catch (e) { console.error(e) }
  }

  const progress = pomodoroMode ? Math.min(100, (elapsedSeconds / pomodoroTarget) * 100) : 0
  const circumference = 2 * Math.PI * 90
  const moodConfig = {
    focus: { label: 'Focus', accent: 'from-violet-500/25 via-sky-500/15 to-cyan-400/20', pulse: 'shadow-violet-500/20', badge: 'text-violet-300', chip: 'bg-violet-500/10 border-violet-400/30 text-violet-100' },
    calm: { label: 'Calm', accent: 'from-emerald-400/25 via-lime-400/15 to-cyan-400/20', pulse: 'shadow-emerald-400/20', badge: 'text-emerald-200', chip: 'bg-emerald-500/10 border-emerald-400/30 text-emerald-100' },
    night: { label: 'Night', accent: 'from-indigo-950 via-violet-950 to-slate-950', pulse: 'shadow-indigo-500/30', badge: 'text-indigo-200', chip: 'bg-indigo-500/10 border-indigo-400/30 text-indigo-100' },
  }[mood]


  return (
    <div className={`fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.18),_transparent_25%),linear-gradient(135deg,#020617_0%,#111827_45%,#1f2937_100%)] ${mood === 'calm' ? 'bg-[radial-gradient(circle_at_top,_rgba(74,222,128,0.18),_transparent_25%),linear-gradient(135deg,#052e16_0%,#14532d_45%,#0f172a_100%)]' : ''} ${mood === 'night' ? 'bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_25%),linear-gradient(135deg,#111827_0%,#1f2937_35%,#020617_100%)]' : ''}`}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0,rgba(15,23,42,0.1)_35%,rgba(2,6,23,0.45)_100%)]" />
        {Array.from({ length: 60 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full bg-white/80 shadow-[0_0_18px_rgba(255,255,255,0.7)]"
            style={{ left: `${(i * 13) % 100}%`, top: `${(i * 17) % 100}%` }}
            animate={{ opacity: [0.15, 1, 0.15], scale: [0.8, 1.35, 0.8] }}
            transition={{ duration: 2.6 + (i % 5) * 0.4, repeat: Infinity, delay: i * 0.08 }}
          />
        ))}
        <div className={`absolute -top-12 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-gradient-to-br ${moodConfig.accent} blur-3xl opacity-70`} />
        <div className="absolute bottom-10 left-10 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-8 top-16 h-28 w-28 rounded-full bg-violet-500/15 blur-3xl" />
      </div>
      {/* Exit button */}
      <button onClick={() => navigate(-1)} className="absolute top-6 right-6 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors backdrop-blur-md">
        <X size={20} />
      </button>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 flex flex-col items-center gap-6 w-full max-w-md px-6">
        <div className="w-full rounded-3xl border border-white/10 bg-white/8 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/60">Vibe</p>
            <p className="text-sm font-semibold text-white">Choose the atmosphere for your flow</p>
          </div>
          <div className="mt-3 flex gap-2">
            {['focus','calm','night'].map((item) => (
              <button key={item} onClick={() => setMood(item)} className={`flex-1 rounded-2xl border px-3 py-2 text-left text-sm transition ${mood === item ? 'border-white/30 bg-white/12 text-white' : 'border-white/10 bg-white/6 text-white/70 hover:bg-white/10'}`}>
                <span className="block text-[11px] uppercase tracking-[0.25em] opacity-70">{item}</span>
                <span className="block font-semibold capitalize">{item === 'focus' ? 'Bright focus' : item === 'calm' ? 'Soft calm' : 'Midnight glow'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mode toggle */}
        {!activeSession && (
          <div className="flex gap-2">
            <Button variant={!pomodoroMode ? 'default' : 'outline'} size="sm" onClick={() => setPomodoroMode(false)}>Deep Work</Button>
            <Button variant={pomodoroMode ? 'default' : 'outline'} size="sm" onClick={() => setPomodoroMode(true)}>Pomodoro</Button>
          </div>
        )}

        {pomodoroMode && activeSession && (
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground capitalize">{pomodoroPhase} phase</p>
            {pomodoroCount > 0 && <p className="text-xs text-muted-foreground">{pomodoroCount} pomodoros completed</p>}
          </div>
        )}

        {/* Subject */}
        {!activeSession && (
          <div className="relative">
            <button onClick={() => setShowSubjectPicker(!showSubjectPicker)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:border-primary/50 transition-colors text-sm">
              {selectedSubject ? (
                <>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedSubject.color }} />
                  <span>{selectedSubject.name}</span>
                </>
              ) : <span className="text-muted-foreground">Select subject (optional)</span>}
              <ChevronDown size={14} className="text-muted-foreground" />
            </button>
            <AnimatePresence>
              {showSubjectPicker && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  className="absolute top-full mt-2 left-0 right-0 bg-card border border-border rounded-xl overflow-hidden z-10 shadow-xl">
                  <button className="w-full px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent text-left" onClick={() => { setSelectedSubject(null); setShowSubjectPicker(false) }}>None</button>
                  {subjects?.map(s => (
                    <button key={s._id} className="w-full px-4 py-2.5 text-sm hover:bg-accent flex items-center gap-2 text-left" onClick={() => { setSelectedSubject(s); setShowSubjectPicker(false) }}>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Timer circle */}
        <div className="w-full rounded-3xl border border-white/10 bg-white/8 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="relative flex items-center justify-center">
            {pomodoroMode && (
              <svg className="absolute" width="220" height="220" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="110" cy="110" r="90" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
                <circle cx="110" cy="110" r="90" fill="none" stroke="hsl(var(--primary))" strokeWidth="4"
                  strokeDasharray={circumference} strokeDashoffset={circumference - (progress / 100) * circumference}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
              </svg>
            )}
            <div className="text-center">
              <div className={`mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${moodConfig.chip}`}>
                {pomodoroMode ? 'Pomodoro' : 'Deep Work'}
              </div>
              <motion.p key={elapsedSeconds} className="font-mono text-5xl font-bold tracking-tight md:text-6xl"
                style={{ color: isRunning && !isPaused ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>
                {pomodoroMode ? formatDuration(Math.max(0, pomodoroTarget - elapsedSeconds)) : formatDuration(elapsedSeconds)}
              </motion.p>
              {activeSession?.subject && (
                <p className="mt-2 text-sm text-muted-foreground">{activeSession.subject.name}</p>
              )}
              {pomodoroMode && <p className="mt-1 text-xs text-muted-foreground">{pomodoroPhase === 'work' ? 'Focus block' : 'Break time'}</p>}
              {isRunning && !isPaused && <p className="mt-1 text-xs text-emerald-300">Focused</p>}
              {isPaused && <p className="mt-1 text-xs text-amber-300">Paused</p>}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {!activeSession ? (
            <Button size="lg" onClick={handleStart} className="w-32 h-12 text-base gap-2">
              <Play size={18} /> Start
            </Button>
          ) : (
            <>
              <Button size="icon" variant="outline" className="w-12 h-12 rounded-full" onClick={isPaused ? handleResume : handlePause}>
                {isPaused ? <Play size={18} /> : <Pause size={18} />}
              </Button>
              <Button size="icon" variant="destructive" className="w-12 h-12 rounded-full" onClick={handleStop}>
                <Square size={18} />
              </Button>
            </>
          )}
        </div>

        {/* Quote */}
        <p className="text-xs text-muted-foreground text-center italic max-w-[260px]">
          "Success is the sum of small efforts, repeated day in and day out."
        </p>
      </motion.div>
    </div>
  )
}
