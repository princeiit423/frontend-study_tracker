import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Square } from 'lucide-react'
import { sessionAPI } from '../../lib/api'
import { setActiveSession, clearActiveSession, incrementElapsed, setElapsedSeconds, setRunning, setPaused } from '../../store/slices/sessionSlice'
import { Button } from '../ui/button'
import { selectUser } from '../../store/slices/authSlice'
import StartSessionModal from './StartSessionModal'
import StopSessionModal from './StopSessionModal'

function getTimeParts(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  }
}

function FlipUnit({ value, label, active }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
      <div className="relative grid h-16 w-full max-w-[82px] place-items-center overflow-hidden rounded-xl border border-white/15 bg-slate-950/90 shadow-[0_14px_30px_rgba(0,0,0,0.28)] sm:h-20 sm:max-w-[98px]">
        <div className="absolute inset-x-0 top-0 h-1/2 bg-white/[0.08]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-black/25" />
        <div className="absolute inset-x-0 top-1/2 h-px bg-white/15" />
        <div className="absolute left-1.5 top-1/2 h-1.5 w-1 -translate-y-1/2 rounded-full bg-black/65" />
        <div className="absolute right-1.5 top-1/2 h-1.5 w-1 -translate-y-1/2 rounded-full bg-black/65" />
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ rotateX: -88, y: -8, opacity: 0 }}
            animate={{ rotateX: 0, y: 0, opacity: 1 }}
            exit={{ rotateX: 88, y: 8, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="relative z-10 font-mono text-3xl font-black tabular-nums tracking-[0.08em] text-white drop-shadow sm:text-4xl"
            style={{ transformOrigin: '50% 50%' }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
        {active && <div className="absolute inset-0 rounded-xl ring-1 ring-primary/40" />}
      </div>
      <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-[10px]">{label}</span>
    </div>
  )
}

function FlipClock({ seconds, active }) {
  const time = getTimeParts(seconds)

  return (
    <div className="flex w-full max-w-[360px] items-start justify-center gap-1.5 sm:gap-2">
      <FlipUnit value={time.hours} label="Hours" active={active} />
      <div className="pt-5 font-mono text-2xl font-black text-primary/55 sm:pt-6 sm:text-3xl">:</div>
      <FlipUnit value={time.minutes} label="Minutes" active={active} />
      <div className="pt-5 font-mono text-2xl font-black text-primary/55 sm:pt-6 sm:text-3xl">:</div>
      <FlipUnit value={time.seconds} label="Seconds" active={active} />
    </div>
  )
}

export default function StudyTimer({ activeSession: externalSession }) {
  const dispatch = useDispatch()
  const qc = useQueryClient()
  const { activeSession, elapsedSeconds, isRunning, isPaused } = useSelector(s => s.session)
  const user = useSelector(selectUser)
  const [showStart, setShowStart] = useState(false)
  const [showStop, setShowStop] = useState(false)
  const timerRef = useRef(null)
  const lastAlertRef = useRef(0)
  const sessionLabel = activeSession ? [
    activeSession.subject?.name || 'General Study',
    activeSession.topic?.name,
    activeSession.exam?.name,
    activeSession.title,
  ].filter(Boolean).join(' - ') : ''

  // Sync external session
  useEffect(() => {
    if (externalSession && !activeSession) {
      dispatch(setActiveSession(externalSession))
      const elapsed = Math.floor((Date.now() - new Date(externalSession.startTime)) / 1000) - (externalSession.totalPausedTime || 0)
      dispatch(setElapsedSeconds(Math.max(0, elapsed)))
      dispatch(setRunning(!externalSession.isPaused))
      dispatch(setPaused(externalSession.isPaused))
    } else if (!externalSession && activeSession) {
      dispatch(clearActiveSession())
    }
  }, [externalSession])

  // Timer tick
  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => dispatch(incrementElapsed()), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isRunning, isPaused])

  useEffect(() => {
    const workSeconds = (user?.preferences?.pomodoroWork || 25) * 60
    if (!activeSession || !isRunning || isPaused || elapsedSeconds < workSeconds) return
    if (elapsedSeconds % workSeconds !== 0 || lastAlertRef.current === elapsedSeconds) return
    lastAlertRef.current = elapsedSeconds

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const ctx = new AudioContext()
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = 880
      gain.gain.value = 0.08
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start()
      oscillator.stop(ctx.currentTime + 0.25)
    } catch {}

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro complete', { body: 'Time for a short break.' })
    } else if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [activeSession, elapsedSeconds, isPaused, isRunning, user?.preferences?.pomodoroWork])

  const handlePause = async () => {
    try {
      await sessionAPI.pause(activeSession._id)
      dispatch(setPaused(true))
      dispatch(setRunning(false))
      qc.invalidateQueries(['active-session'])
    } catch (e) { console.error(e) }
  }

  const handleResume = async () => {
    try {
      await sessionAPI.resume(activeSession._id)
      dispatch(setPaused(false))
      dispatch(setRunning(true))
      qc.invalidateQueries(['active-session'])
    } catch (e) { console.error(e) }
  }

  if (!activeSession) {
    return (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="border border-dashed border-border rounded-xl p-5 flex items-center justify-between bg-card/30">
          <div>
            <p className="font-medium text-sm">No Active Session</p>
            <p className="text-xs text-muted-foreground mt-0.5">Start a session to track your study time</p>
          </div>
          <Button onClick={() => setShowStart(true)} size="sm" className="gap-2">
            <Play size={13} /> Start Session
          </Button>
        </motion.div>
        <StartSessionModal open={showStart} onClose={() => setShowStart(false)} />
      </>
    )
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-[0_18px_42px_rgba(0,0,0,0.18)] sm:p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative shrink-0">
            <motion.div animate={{ scale: isRunning && !isPaused ? [1, 1.05, 1] : 1 }} transition={{ repeat: Infinity, duration: 2 }}
              className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <div className={`w-2.5 h-2.5 rounded-full ${isRunning && !isPaused ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`} />
            </motion.div>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold">{isPaused ? 'Session paused' : 'Active study session'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              <span className="text-foreground font-medium">{sessionLabel}</span>
              {isPaused && <span className="ml-2 text-yellow-500">- Paused</span>}
            </p>
          </div>
        </div>
          <div className="flex flex-1 justify-center lg:px-5">
            <FlipClock seconds={elapsedSeconds} active={isRunning && !isPaused} />
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2">
            {isPaused ? (
              <Button size="sm" variant="outline" onClick={handleResume} className="gap-1.5">
                <Play size={13} /> Resume
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={handlePause} className="gap-1.5">
                <Pause size={13} /> Pause
              </Button>
            )}
            <Button size="sm" variant="destructive" onClick={() => setShowStop(true)} className="gap-1.5">
              <Square size={13} /> Stop
            </Button>
          </div>
        </div>
      </motion.div>
      <StopSessionModal open={showStop} onClose={() => setShowStop(false)} session={activeSession} elapsed={elapsedSeconds} />
    </>
  )
}
