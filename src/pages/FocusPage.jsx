import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Square, X, ChevronDown, Music, Palette, Volume2, VolumeX } from 'lucide-react'
import { sessionAPI, subjectAPI } from '../lib/api'
import {
  setActiveSession, clearActiveSession,
  incrementElapsed, setElapsedSeconds,
  setRunning, setPaused
} from '../store/slices/sessionSlice'
import { Button } from '../components/ui/button'
import { selectUser } from '../store/slices/authSlice'

/* ─── Google Fonts injection ─────────────────────────────────────────── */
const injectFonts = () => {
  if (document.getElementById('focus-fonts')) return
  const link = document.createElement('link')
  link.id = 'focus-fonts'
  link.rel = 'stylesheet'
  link.href = 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@300;400;500;600;700&display=swap'
  document.head.appendChild(link)
}

/* ─── Theme definitions ──────────────────────────────────────────────── */
const THEMES = {
  violet: {
    name: 'Violet',
    accent: '#8b5cf6',
    accentDim: 'rgba(139,92,246,0.18)',
    accentGlow: 'rgba(139,92,246,0.35)',
    blob1: 'rgba(139,92,246,0.12)',
    blob2: 'rgba(99,102,241,0.08)',
    badgeColor: '#a78bfa',
    badgeBg: 'rgba(139,92,246,0.1)',
    badgeBorder: 'rgba(167,139,250,0.25)',
    ringStroke: '#8b5cf6',
    swatch: 'linear-gradient(135deg,#2d1b69,#6d28d9)',
    dotRunning: '#4ade80',
  },
  rose: {
    name: 'Rose',
    accent: '#f43f5e',
    accentDim: 'rgba(244,63,94,0.18)',
    accentGlow: 'rgba(244,63,94,0.35)',
    blob1: 'rgba(244,63,94,0.1)',
    blob2: 'rgba(251,113,133,0.07)',
    badgeColor: '#fb7185',
    badgeBg: 'rgba(244,63,94,0.1)',
    badgeBorder: 'rgba(251,113,133,0.25)',
    ringStroke: '#f43f5e',
    swatch: 'linear-gradient(135deg,#4c0519,#be123c)',
    dotRunning: '#4ade80',
  },
  amber: {
    name: 'Amber',
    accent: '#f59e0b',
    accentDim: 'rgba(245,158,11,0.15)',
    accentGlow: 'rgba(245,158,11,0.3)',
    blob1: 'rgba(245,158,11,0.1)',
    blob2: 'rgba(251,191,36,0.07)',
    badgeColor: '#fbbf24',
    badgeBg: 'rgba(245,158,11,0.1)',
    badgeBorder: 'rgba(251,191,36,0.25)',
    ringStroke: '#f59e0b',
    swatch: 'linear-gradient(135deg,#451a03,#b45309)',
    dotRunning: '#4ade80',
  },
  cyan: {
    name: 'Cyan',
    accent: '#06b6d4',
    accentDim: 'rgba(6,182,212,0.18)',
    accentGlow: 'rgba(6,182,212,0.35)',
    blob1: 'rgba(6,182,212,0.1)',
    blob2: 'rgba(34,211,238,0.07)',
    badgeColor: '#22d3ee',
    badgeBg: 'rgba(6,182,212,0.1)',
    badgeBorder: 'rgba(34,211,238,0.25)',
    ringStroke: '#06b6d4',
    swatch: 'linear-gradient(135deg,#0c1a2e,#0e7490)',
    dotRunning: '#4ade80',
  },
  emerald: {
    name: 'Emerald',
    accent: '#10b981',
    accentDim: 'rgba(16,185,129,0.18)',
    accentGlow: 'rgba(16,185,129,0.35)',
    blob1: 'rgba(16,185,129,0.1)',
    blob2: 'rgba(52,211,153,0.07)',
    badgeColor: '#34d399',
    badgeBg: 'rgba(16,185,129,0.1)',
    badgeBorder: 'rgba(52,211,153,0.25)',
    ringStroke: '#10b981',
    swatch: 'linear-gradient(135deg,#052e16,#059669)',
    dotRunning: '#4ade80',
  },
}

/* ─── Music tracks ───────────────────────────────────────────────────── */
const TRACKS = [
  { id: 0, name: 'Lo-fi Cosmos',  sub: 'Beats · 85 BPM',     icon: '🌌', bg: 'rgba(124,58,237,0.2)'  },
  { id: 1, name: 'Ocean Rain',    sub: 'Ambient · Nature',    icon: '🌊', bg: 'rgba(6,182,212,0.2)'   },
  { id: 2, name: 'Coffee House',  sub: 'Jazz · Café vibes',   icon: '🔥', bg: 'rgba(245,158,11,0.2)'  },
  { id: 3, name: 'Forest Drift',  sub: 'Nature · 432 Hz',     icon: '🌿', bg: 'rgba(16,185,129,0.2)'  },
  { id: 4, name: 'Deep Space',    sub: 'Drone · Focus',       icon: '⚡', bg: 'rgba(99,102,241,0.2)'  },
]

const QUOTES = [
  '"The secret of getting ahead is getting started."',
  '"Deep work is the ability to focus without distraction."',
  '"One hour of focused work beats eight hours of scattered effort."',
  '"Silence is the sleep that nourishes wisdom."',
  '"Do the hard thing first. Everything else is easier after."',
]

/* ─── Time helpers ───────────────────────────────────────────────────── */
function getTimeParts(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds || 0))
  return {
    hours:   String(Math.floor(safe / 3600)).padStart(2, '0'),
    minutes: String(Math.floor((safe % 3600) / 60)).padStart(2, '0'),
    seconds: String(safe % 60).padStart(2, '0'),
  }
}

/* ─── FlipUnit ───────────────────────────────────────────────────────── */
function FlipUnit({ value, label, accentColor }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        style={{
          width: 76, height: 84,
          background: 'rgba(0,0,0,0.55)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
          boxShadow: `0 0 24px ${accentColor}18`,
        }}
      >
        {/* top sheen */}
        <div style={{ position:'absolute', inset:'0 0 50% 0', background:'rgba(255,255,255,0.025)', borderRadius:'14px 14px 0 0' }} />
        {/* center line */}
        <div style={{ position:'absolute', top:'50%', left:8, right:8, height:1, background:'rgba(255,255,255,0.05)' }} />
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ rotateX: -90, opacity: 0, y: -8 }}
            animate={{ rotateX: 0,   opacity: 1, y: 0  }}
            exit={{    rotateX:  90, opacity: 0, y:  8  }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 38, fontWeight: 700,
              color: '#f1f5f9',
              letterSpacing: '0.04em',
              lineHeight: 1,
              position: 'relative', zIndex: 1,
              transformOrigin: '50% 50%',
            }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>
        {label}
      </span>
    </div>
  )
}

/* ─── Animated canvas background ────────────────────────────────────── */
function AnimatedBackground({ accentHex }) {
  const canvasRef = useRef(null)
  const stateRef  = useRef({ time: 0, particles: [], accentHex })

  useEffect(() => { stateRef.current.accentHex = accentHex }, [accentHex])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    let raf, W, H

    function hexToRgb(hex) {
      const r = parseInt(hex.slice(1,3),16)
      const g = parseInt(hex.slice(3,5),16)
      const b = parseInt(hex.slice(5,7),16)
      return { r, g, b }
    }

    function initParticles() {
      const count = Math.floor((W * H) / 12000)
      stateRef.current.particles = Array.from({ length: count }, () => ({
        x: Math.random() * W,  y: Math.random() * H,
        r: Math.random() * 1.1 + 0.3,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        alpha: Math.random() * 0.45 + 0.08,
        pulse: Math.random() * Math.PI * 2,
        speed: 0.006 + Math.random() * 0.014,
      }))
    }

    function resize() {
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
      initParticles()
    }

    function draw() {
      const { time, particles } = stateRef.current
      const { r, g, b } = hexToRgb(stateRef.current.accentHex)

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#050508'
      ctx.fillRect(0, 0, W, H)

      // Animated gradient blobs
      for (let bi = 0; bi < 3; bi++) {
        const bx = W * (0.15 + bi * 0.35) + Math.sin(time * 0.0007 + bi * 2.1) * W * 0.12
        const by = H * (0.2  + bi * 0.28) + Math.cos(time * 0.0005 + bi * 1.7) * H * 0.1
        const br = W * 0.28
        const grd = ctx.createRadialGradient(bx, by, 0, bx, by, br)
        grd.addColorStop(0, `rgba(${r},${g},${b},${bi === 0 ? 0.08 : 0.04})`)
        grd.addColorStop(1, 'transparent')
        ctx.fillStyle = grd
        ctx.fillRect(0, 0, W, H)
      }

      // Flowing abstract lines
      for (let li = 0; li < 6; li++) {
        const y0 = H * (0.08 + li * 0.16) + Math.sin(time * 0.0003 + li * 1.1) * 35
        ctx.beginPath()
        ctx.moveTo(0, y0)
        for (let x = 0; x <= W; x += 6) {
          const y = y0
            + Math.sin(x * 0.004 + time * 0.001 + li * 0.8) * 30
            + Math.sin(x * 0.011 + time * 0.0007) * 14
          ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.022 - li * 0.002})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Subtle grid
      ctx.strokeStyle = `rgba(${r},${g},${b},0.014)`
      ctx.lineWidth = 0.5
      const gs = 72
      for (let x = 0; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
      for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

      // Stars / particles
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.pulse += p.speed
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
        const a = p.alpha * (0.55 + 0.45 * Math.sin(p.pulse))
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${a})`
        ctx.fill()
      })

      stateRef.current.time++
      raf = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', display: 'block' }}
    />
  )
}

/* ─── Web Audio engine ───────────────────────────────────────────────── */
function useAudio() {
  const ctxRef      = useRef(null)
  const masterRef   = useRef(null)
  const nodesRef    = useRef([])
  const activeRef   = useRef(-1)

  function ensureCtx() {
    if (!ctxRef.current) {
      ctxRef.current    = new (window.AudioContext || window.webkitAudioContext)()
      masterRef.current = ctxRef.current.createGain()
      masterRef.current.gain.value = 0.6
      masterRef.current.connect(ctxRef.current.destination)
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
  }

  function stopAll() {
    nodesRef.current.forEach(n => { try { n.stop() } catch (_) {} })
    nodesRef.current = []
  }

  function addNode(n) { nodesRef.current.push(n) }

  /* generators */
  function makeLofi(ac, master) {
    const notes = [261.6, 293.7, 329.6, 349.2, 392, 440]
    let t = ac.currentTime
    let idx = 0 // track this closure's ID
    const beat = () => {
      if (activeRef.current !== 0) return
      const osc = ac.createOscillator()
      const env = ac.createGain()
      osc.type = 'triangle'
      osc.frequency.value = notes[Math.floor(Math.random() * notes.length)]
      env.gain.setValueAtTime(0, t)
      env.gain.linearRampToValueAtTime(0.055, t + 0.015)
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.65)
      osc.connect(env); env.connect(master)
      osc.start(t); osc.stop(t + 0.7)
      t += 0.44 + Math.random() * 0.42
      setTimeout(beat, Math.max(0, (t - ac.currentTime - 0.2) * 1000))
    }
    beat()
    const bass = ac.createOscillator(); const bg = ac.createGain()
    bass.type = 'sine'; bass.frequency.value = 65; bg.gain.value = 0.035
    bass.connect(bg); bg.connect(master); bass.start(); addNode(bass)
  }

  function makeRain(ac, master) {
    const len = ac.sampleRate * 2
    const buf = ac.createBuffer(1, len, ac.sampleRate)
    const d   = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.38
    const src = ac.createBufferSource(); src.buffer = buf; src.loop = true
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 850; f.Q.value = 0.45
    const lfo = ac.createOscillator(); const lg = ac.createGain()
    lfo.frequency.value = 0.12; lg.gain.value = 220
    lfo.connect(lg); lg.connect(f.frequency); lfo.start(); addNode(lfo)
    src.connect(f); f.connect(master); src.start(); addNode(src)
  }

  function makeCafe(ac, master) {
    const chords = [[261.6,329.6,392],[293.7,369.9,440],[349.2,440,523.2],[392,493.9,587.3]]
    let ci = 0, st = ac.currentTime
    const sched = () => {
      if (activeRef.current !== 2) return
      chords[ci % chords.length].forEach(freq => {
        const osc = ac.createOscillator(); const env = ac.createGain()
        osc.type = 'sine'; osc.frequency.value = freq
        env.gain.setValueAtTime(0, st)
        env.gain.linearRampToValueAtTime(0.032, st + 0.1)
        env.gain.exponentialRampToValueAtTime(0.0001, st + 2.4)
        osc.connect(env); env.connect(master); osc.start(st); osc.stop(st + 2.6)
      })
      ci++; st += 2.6
      setTimeout(sched, Math.max(100, (st - ac.currentTime - 0.35) * 1000))
    }
    sched()
  }

  function makeForest(ac, master) {
    const len = ac.sampleRate * 3
    const buf = ac.createBuffer(1, len, ac.sampleRate)
    const d   = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.14
    const src = ac.createBufferSource(); src.buffer = buf; src.loop = true
    const f1 = ac.createBiquadFilter(); f1.type = 'highpass'; f1.frequency.value = 2200
    const f2 = ac.createBiquadFilter(); f2.type = 'lowpass';  f2.frequency.value = 6500
    src.connect(f1); f1.connect(f2); f2.connect(master); src.start(); addNode(src)
    ;[432, 864, 216].forEach((freq, i) => {
      const osc = ac.createOscillator(); const og = ac.createGain()
      osc.type = 'sine'; osc.frequency.value = freq; og.gain.value = 0.013 / (i + 1)
      osc.connect(og); og.connect(master); osc.start(); addNode(osc)
    })
  }

  function makeSpace(ac, master) {
    ;[55, 110, 165, 220].forEach((freq, i) => {
      const osc = ac.createOscillator(); const og = ac.createGain()
      osc.type = i % 2 === 0 ? 'sine' : 'sawtooth'; osc.frequency.value = freq
      og.gain.value = 0.028 / (i + 1)
      const lfo = ac.createOscillator(); const lg = ac.createGain()
      lfo.frequency.value = 0.06 + i * 0.025; lg.gain.value = freq * 0.022
      lfo.connect(lg); lg.connect(osc.frequency); lfo.start(); addNode(lfo)
      osc.connect(og); og.connect(master); osc.start(); addNode(osc)
    })
  }

  const makers = [makeLofi, makeRain, makeCafe, makeForest, makeSpace]

  function playTrack(idx) {
    ensureCtx()
    const ac = ctxRef.current; const master = masterRef.current
    if (activeRef.current === idx) { stopAll(); activeRef.current = -1; return false }
    stopAll(); activeRef.current = idx
    makers[idx](ac, master)
    return true
  }

  function setVolume(v) {
    if (masterRef.current) masterRef.current.gain.value = v / 100
  }

  function activeTrack() { return activeRef.current }

  return { playTrack, setVolume, activeTrack }
}

/* ─── Main FocusPage ─────────────────────────────────────────────────── */
export default function FocusPage() {
  const navigate  = useNavigate()
  const dispatch  = useDispatch()
  const qc        = useQueryClient()
  const user      = useSelector(selectUser)
  const { activeSession, elapsedSeconds, isRunning, isPaused } = useSelector(s => s.session)

  const timerRef = useRef(null)

  const { data: activeSessionData } = useQuery({
    queryKey: ['active-session'],
    queryFn: () => sessionAPI.getActive(),
    select: d => d.data.data.session,
  })
  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectAPI.getAll(),
    select: d => d.data.data.subjects,
  })

  /* local state */
  const [selectedSubject,   setSelectedSubject]   = useState(null)
  const [showSubjectPicker, setShowSubjectPicker] = useState(false)
  const [pomodoroMode,      setPomodoroMode]      = useState(false)
  const [pomodoroPhase,     setPomodoroPhase]     = useState('work')
  const [pomodoroCount,     setPomodoroCount]     = useState(0)
  const [themeName,         setThemeName]         = useState('violet')
  const [openPanel,         setOpenPanel]         = useState(null) // 'theme' | 'music' | null
  const [playingTrack,      setPlayingTrack]      = useState(-1)
  const [volume,            setVolumeState]       = useState(60)
  const [quoteIdx,          setQuoteIdx]          = useState(0)

  const theme   = THEMES[themeName]
  const audio   = useAudio()

  const workMins   = user?.preferences?.pomodoroWork  || 25
  const breakMins  = user?.preferences?.pomodoroBreak || 5
  const pomoTarget = pomodoroPhase === 'work' ? workMins * 60 : breakMins * 60

  /* font injection */
  useEffect(() => { injectFonts() }, [])

  /* quote rotation */
  useEffect(() => {
    const id = setInterval(() => setQuoteIdx(i => (i + 1) % QUOTES.length), 14000)
    return () => clearInterval(id)
  }, [])

  /* restore active session */
  useEffect(() => {
    if (activeSessionData && !activeSession) {
      dispatch(setActiveSession(activeSessionData))
      const elapsed = Math.floor((Date.now() - new Date(activeSessionData.startTime)) / 1000) - (activeSessionData.totalPausedTime || 0)
      dispatch(setElapsedSeconds(Math.max(0, elapsed)))
      dispatch(setRunning(!activeSessionData.isPaused))
      dispatch(setPaused(activeSessionData.isPaused))
    }
  }, [activeSessionData])

  /* tick */
  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => dispatch(incrementElapsed()), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isRunning, isPaused])

  /* pomodoro phase switch */
  useEffect(() => {
    if (pomodoroMode && elapsedSeconds >= pomoTarget && isRunning) {
      if (pomodoroPhase === 'work') {
        setPomodoroPhase('break'); setPomodoroCount(c => c + 1); dispatch(setElapsedSeconds(0))
      } else {
        setPomodoroPhase('work'); dispatch(setElapsedSeconds(0))
      }
    }
  }, [elapsedSeconds, pomodoroMode, pomoTarget])

  const currentSession = activeSession || activeSessionData

  /* ── session actions ── */
  const handleStart = async () => {
    try {
      const { data } = await sessionAPI.start({ subjectId: selectedSubject?._id, mode: pomodoroMode ? 'pomodoro' : 'deep_work' })
      dispatch(setActiveSession(data.data.session))
      dispatch(setPaused(false)); dispatch(setRunning(true)); dispatch(setElapsedSeconds(0))
      await qc.invalidateQueries(['active-session'])
    } catch (e) { console.error(e) }
  }

  const handlePause = async () => {
    if (!currentSession?._id) return
    try {
      await sessionAPI.pause(currentSession._id)
      dispatch(setPaused(true)); dispatch(setRunning(false))
      await qc.invalidateQueries(['active-session'])
    } catch (e) { console.error(e) }
  }

  const handleResume = async () => {
    if (!currentSession?._id) return
    try {
      await sessionAPI.resume(currentSession._id)
      dispatch(setPaused(false)); dispatch(setRunning(true))
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

  /* ── derived display values ── */
  const displaySeconds = pomodoroMode ? Math.max(0, pomoTarget - elapsedSeconds) : elapsedSeconds
  const time           = getTimeParts(displaySeconds)
  const progress       = pomodoroMode ? Math.min(100, (elapsedSeconds / pomoTarget) * 100) : 0
  const circumference  = 2 * Math.PI * 96

  /* ── music ── */
  function handleTrack(idx) {
    const nowPlaying = audio.playTrack(idx)
    setPlayingTrack(nowPlaying ? idx : -1)
  }
  function handleVolume(v) {
    setVolumeState(v); audio.setVolume(v)
  }

  /* ── panel toggle ── */
  function togglePanel(name) { setOpenPanel(p => p === name ? null : name) }

  /* ── status helpers ── */
  const statusState = isRunning && !isPaused ? 'running' : isPaused ? 'paused' : 'idle'
  const statusLabel = statusState === 'running' ? 'In focus mode' : statusState === 'paused' ? 'Paused' : 'Ready to focus'

  /* ═══════════════════════════════════════════════════════════════════ */
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        background: '#050508',
        fontFamily: "'Syne', sans-serif",
      }}
      onClick={() => { setOpenPanel(null); setShowSubjectPicker(false) }}
    >
      {/* ── animated canvas bg ── */}
      <AnimatedBackground accentHex={theme.accent} />

      {/* ── scan line (CSS animation avoids Framer px/vh unit mismatch) ── */}
      <style>{`
        @keyframes scanDown {
          from { top: -2px; }
          to   { top: 100%; }
        }
        .focus-scan-line {
          animation: scanDown 9s linear infinite;
        }
      `}</style>
      <div
        className="focus-scan-line"
        style={{
          position: 'fixed', left: 0, right: 0, height: 2, zIndex: 3, pointerEvents: 'none',
          background: `linear-gradient(90deg,transparent,${theme.accentDim},transparent)`,
        }}
      />

      {/* ── film grain ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 4, pointerEvents: 'none', opacity: 0.025,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '128px',
      }} />

      {/* ── close btn ── */}
      <button
        onClick={e => { e.stopPropagation(); navigate(-1) }}
        style={{
          position: 'fixed', top: 20, right: 20, zIndex: 30,
          width: 36, height: 36, borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.4)',
          color: 'rgba(255,255,255,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', backdropFilter: 'blur(8px)',
          transition: 'all 0.2s',
        }}
      >
        <X size={15} />
      </button>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          position: 'relative', zIndex: 5,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 20, width: '100%', maxWidth: 440, padding: '0 20px',
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── mode row (only before session) ── */}
        {!activeSession && (
          <div style={{ display: 'flex', gap: 8 }}>
            {['deep', 'pomodoro'].map(m => (
              <button
                key={m}
                onClick={() => setPomodoroMode(m === 'pomodoro')}
                style={{
                  padding: '8px 20px', borderRadius: 100,
                  border: `1px solid ${(m === 'pomodoro') === pomodoroMode ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  background: (m === 'pomodoro') === pomodoroMode ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.03)',
                  color: (m === 'pomodoro') === pomodoroMode ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)',
                  fontSize: 13, fontWeight: 500,
                  fontFamily: "'Syne', sans-serif",
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {m === 'deep' ? 'Deep Work' : 'Pomodoro'}
              </button>
            ))}
          </div>
        )}

        {/* ── pomodoro phase info ── */}
        {pomodoroMode && activeSession && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: theme.badgeColor, fontWeight: 500, margin: 0, textTransform: 'capitalize' }}>
              {pomodoroPhase} phase
            </p>
            {pomodoroCount > 0 && (
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>
                {pomodoroCount} pomodoro{pomodoroCount > 1 ? 's' : ''} completed
              </p>
            )}
          </div>
        )}

        {/* ── subject picker ── */}
        {!activeSession && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={e => { e.stopPropagation(); setShowSubjectPicker(p => !p) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 18px', borderRadius: 100,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)',
                color: selectedSubject ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)',
                fontSize: 13, fontFamily: "'Syne', sans-serif",
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {selectedSubject && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: selectedSubject.color, flexShrink: 0 }} />
              )}
              <span>{selectedSubject ? selectedSubject.name : 'Select subject (optional)'}</span>
              <ChevronDown size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />
            </button>
            <AnimatePresence>
              {showSubjectPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 20,
                    background: 'rgba(8,8,18,0.96)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 14, overflow: 'hidden',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => { setSelectedSubject(null); setShowSubjectPicker(false) }}
                    style={subjectRowStyle}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>None</span>
                  </button>
                  {subjects?.map(s => (
                    <button
                      key={s._id}
                      onClick={() => { setSelectedSubject(s); setShowSubjectPicker(false) }}
                      style={subjectRowStyle}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{s.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── TIMER CARD ── */}
        <div
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 24,
            backdropFilter: 'blur(24px)',
            padding: '28px 24px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* top glow */}
          <div style={{
            position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)',
            width: 180, height: 180, borderRadius: '50%',
            background: theme.accentGlow,
            filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0,
          }} />

          {/* mode badge */}
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase',
            padding: '4px 14px', borderRadius: 100,
            background: theme.badgeBg,
            border: `1px solid ${theme.badgeBorder}`,
            color: theme.badgeColor,
            position: 'relative', zIndex: 1,
          }}>
            {pomodoroMode ? (pomodoroPhase === 'work' ? ' Focus Block' : '☕ Break Time') : 'Deep Work'}
          </span>

          {/* Pomodoro ring */}
          {pomodoroMode && (
            <svg
              viewBox="0 0 210 210"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, opacity: 0.4 }}
            >
              <circle cx="105" cy="105" r="96" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
              <circle
                cx="105" cy="105" r="96" fill="none"
                stroke={theme.ringStroke} strokeWidth="2" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 96}`}
                strokeDashoffset={`${circumference * (1 - progress / 100)}`}
                style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
          )}

          {/* flip clock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
            <FlipUnit value={time.hours}   label="hrs" accentColor={theme.accent} />
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 30, fontWeight: 700, color: 'rgba(255,255,255,0.15)', marginBottom: 18 }}>:</span>
            <FlipUnit value={time.minutes} label="min" accentColor={theme.accent} />
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 30, fontWeight: 700, color: 'rgba(255,255,255,0.15)', marginBottom: 18 }}>:</span>
            <FlipUnit value={time.seconds} label="sec" accentColor={theme.accent} />
          </div>

          {/* active subject */}
          {currentSession?.subject && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, zIndex: 1 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: theme.accent }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{currentSession.subject.name}</span>
            </div>
          )}

          {/* status dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, position: 'relative', zIndex: 1 }}>
            <motion.div
              animate={statusState === 'running' ? { scale: [1, 1.4, 1], opacity: [1, 0.4, 1] } : {}}
              transition={{ duration: 1.4, repeat: Infinity }}
              style={{
                width: 7, height: 7, borderRadius: '50%',
                background: statusState === 'running' ? '#4ade80' : statusState === 'paused' ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                boxShadow: statusState === 'running' ? '0 0 8px #4ade80' : statusState === 'paused' ? '0 0 8px #fbbf24' : 'none',
              }}
            />
            <span style={{
              fontSize: 12,
              color: statusState === 'running' ? 'rgba(74,222,128,0.7)' : statusState === 'paused' ? 'rgba(251,191,36,0.7)' : 'rgba(255,255,255,0.3)',
            }}>
              {statusLabel}
            </span>
          </div>

          {/* controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
            {!activeSession ? (
              <button onClick={handleStart} style={makePrimaryBtn(theme)}>
                <Play size={16} /> Start
              </button>
            ) : (
              <>
                <button onClick={isPaused ? handleResume : handlePause} style={makeIconBtn()}>
                  {isPaused ? <Play size={17} /> : <Pause size={17} />}
                </button>
                <button onClick={handleStop} style={makeIconBtn(true)}>
                  <Square size={17} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── quote ── */}
        <AnimatePresence mode="wait">
          <motion.p
            key={quoteIdx}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              fontSize: 12, color: 'rgba(255,255,255,0.18)',
              textAlign: 'center', fontStyle: 'italic',
              maxWidth: 320, lineHeight: 1.65, margin: 0,
            }}
          >
            {QUOTES[quoteIdx]}
          </motion.p>
        </AnimatePresence>
      </motion.div>

      {/* ══════════ SIDE PANEL (fixed right) ══════════ */}
      <div
        style={{ position: 'fixed', right: 20, top: '50%', transform: 'translateY(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', gap: 10 }}
        onClick={e => e.stopPropagation()}
      >

        {/* Theme button */}
        <div style={{ position: 'relative' }}>
          <SideBtn active={openPanel === 'theme'} onClick={() => togglePanel('theme')} tooltip="Themes">
            <Palette size={17} />
          </SideBtn>

          <AnimatePresence>
            {openPanel === 'theme' && (
              <motion.div
                initial={{ opacity: 0, x: 10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                style={{
                  position: 'absolute', right: 56, top: 0,
                  width: 230,
                  background: 'rgba(8,8,18,0.96)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 16, padding: 16,
                  backdropFilter: 'blur(24px)',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                }}
              >
                <p style={panelTitleStyle}>Aesthetic Theme</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {Object.entries(THEMES).map(([key, t]) => (
                    <button
                      key={key}
                      onClick={() => { setThemeName(key); setOpenPanel(null) }}
                      style={{
                        height: 46, borderRadius: 10, cursor: 'pointer',
                        background: t.swatch,
                        border: `2px solid ${themeName === key ? 'rgba(255,255,255,0.5)' : 'transparent'}`,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: 2, transition: 'all 0.2s',
                      }}
                    >
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em' }}>{t.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Music button */}
        <div style={{ position: 'relative' }}>
          <SideBtn active={openPanel === 'music'} onClick={() => togglePanel('music')} tooltip="Chill Music">
            <Music size={17} />
          </SideBtn>

          <AnimatePresence>
            {openPanel === 'music' && (
              <motion.div
                initial={{ opacity: 0, x: 10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                style={{
                  position: 'absolute', right: 56, top: 0,
                  width: 250,
                  background: 'rgba(8,8,18,0.96)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 16, padding: 16,
                  backdropFilter: 'blur(24px)',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                }}
              >
                <p style={panelTitleStyle}>Chill Sounds</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {TRACKS.map(track => (
                    <button
                      key={track.id}
                      onClick={() => handleTrack(track.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
                        background: playingTrack === track.id ? 'rgba(255,255,255,0.07)' : 'transparent',
                        border: `1px solid ${playingTrack === track.id ? 'rgba(255,255,255,0.12)' : 'transparent'}`,
                        textAlign: 'left', width: '100%',
                        transition: 'all 0.15s',
                        fontFamily: "'Syne', sans-serif",
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: track.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15,
                      }}>
                        {track.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{track.name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{track.sub}</div>
                      </div>
                      <span style={{ fontSize: 12, color: playingTrack === track.id ? theme.badgeColor : 'rgba(255,255,255,0.25)' }}>
                        {playingTrack === track.id ? '■' : '▶'}
                      </span>
                    </button>
                  ))}
                </div>

                {/* volume */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  {volume === 0 ? <VolumeX size={14} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} /> : <Volume2 size={14} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />}
                  <input
                    type="range" min={0} max={100} value={volume}
                    onChange={e => handleVolume(Number(e.target.value))}
                    style={{
                      flex: 1, appearance: 'none', WebkitAppearance: 'none',
                      height: 3, background: `linear-gradient(to right, ${theme.accent} ${volume}%, rgba(255,255,255,0.12) ${volume}%)`,
                      borderRadius: 2, outline: 'none', cursor: 'pointer',
                    }}
                  />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', minWidth: 24 }}>{volume}</span>
                </div>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', textAlign: 'center', margin: '8px 0 0' }}>
                  Synthesized via Web Audio API
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

/* ─── Sub-components ─────────────────────────────────────────────────── */
function SideBtn({ children, active, onClick, tooltip }) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      style={{
        width: 44, height: 44, borderRadius: 14,
        border: `1px solid ${active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
        background: active ? 'rgba(255,255,255,0.08)' : 'rgba(8,8,20,0.7)',
        backdropFilter: 'blur(12px)',
        color: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.2s',
      }}
    >
      {children}
    </button>
  )
}

/* ─── Style helpers ──────────────────────────────────────────────────── */
const subjectRowStyle = {
  width: '100%', padding: '10px 14px',
  display: 'flex', alignItems: 'center', gap: 8,
  background: 'transparent', border: 'none',
  cursor: 'pointer', textAlign: 'left',
  transition: 'background 0.15s',
  fontFamily: "'Syne', sans-serif",
}

const panelTitleStyle = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.22em',
  textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
  margin: '0 0 12px',
}

function makePrimaryBtn(theme) {
  return {
    height: 48, padding: '0 28px', borderRadius: 100,
    border: 'none', cursor: 'pointer',
    background: `linear-gradient(135deg, ${theme.accent}cc, ${theme.accent})`,
    color: '#fff',
    fontFamily: "'Syne', sans-serif",
    fontSize: 14, fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: 8,
    transition: 'all 0.2s',
    boxShadow: `0 8px 28px ${theme.accentDim}`,
    letterSpacing: '0.02em',
  }
}

function makeIconBtn(danger = false) {
  return {
    width: 48, height: 48, borderRadius: '50%',
    border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
    background: danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.05)',
    color: danger ? '#f87171' : 'rgba(255,255,255,0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all 0.2s',
  }
}