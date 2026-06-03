import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Square, Plus, Zap } from 'lucide-react'
import { sessionAPI } from '../../lib/api'
import { setActiveSession, clearActiveSession, incrementElapsed, setElapsedSeconds, setRunning, setPaused } from '../../store/slices/sessionSlice'
import { Button } from '../ui/button'
import { formatDuration } from '../../lib/utils'
import StartSessionModal from './StartSessionModal'
import StopSessionModal from './StopSessionModal'

export default function StudyTimer({ activeSession: externalSession }) {
  const dispatch = useDispatch()
  const qc = useQueryClient()
  const { activeSession, elapsedSeconds, isRunning, isPaused } = useSelector(s => s.session)
  const [showStart, setShowStart] = useState(false)
  const [showStop, setShowStop] = useState(false)
  const timerRef = useRef(null)

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
        className="rounded-xl border border-primary/20 bg-primary/5 p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <motion.div animate={{ scale: isRunning && !isPaused ? [1, 1.05, 1] : 1 }} transition={{ repeat: Infinity, duration: 2 }}
              className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <div className={`w-2.5 h-2.5 rounded-full ${isRunning && !isPaused ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`} />
            </motion.div>
          </div>
          <div>
            <p className="font-mono text-2xl font-bold text-primary">{formatDuration(elapsedSeconds)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeSession.subject?.name && <span className="text-foreground font-medium">{activeSession.subject.name}</span>}
              {activeSession.topic?.name && <span> · {activeSession.topic.name}</span>}
              {!activeSession.subject && 'General Study'}
              {isPaused && <span className="ml-2 text-yellow-500">· Paused</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
      </motion.div>
      <StopSessionModal open={showStop} onClose={() => setShowStop(false)} session={activeSession} elapsed={elapsedSeconds} />
    </>
  )
}
