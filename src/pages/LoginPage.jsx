import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { BookOpen, Target, TrendingUp, Zap } from 'lucide-react'
import { authAPI } from '../lib/api'
import { setCredentials, selectIsAuthenticated } from '../store/slices/authSlice'

const features = [
  { icon: Target, title: 'Smart Exam Tracking', desc: 'Track any exam — JEE, UPSC, CAT, or your own' },
  { icon: TrendingUp, title: 'Deep Analytics', desc: 'Heatmaps, streaks, and readiness predictions' },
  { icon: Zap, title: 'Focus Mode', desc: 'Distraction-free Pomodoro and deep work sessions' },
  { icon: BookOpen, title: 'Full Customization', desc: 'Your subjects, topics, goals — nothing hardcoded' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const googleRef = useRef(null)

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const initGoogle = () => {
      if (!window.google?.accounts?.id) return
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
        callback: handleGoogleCallback,
      })
      if (googleRef.current) {
        window.google.accounts.id.renderButton(googleRef.current, {
          type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', width: 300,
        })
      }
    }
    if (window.google) initGoogle()
    else { const t = setInterval(() => { if (window.google) { initGoogle(); clearInterval(t) } }, 200); return () => clearInterval(t) }
  }, [])

  const handleGoogleCallback = async (response) => {
    setLoading(true); setError('')
    try {
      const { data } = await authAPI.googleAuth(response.credential)
      dispatch(setCredentials({ user: data.data.user, accessToken: data.data.accessToken }))
      navigate(data.data.isNewUser ? '/onboarding' : '/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-[520px] clay-card rounded-none border-r border-border/80 flex-col justify-between p-12 bg-card/80">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <img src="/logo.png" alt="AceStudy logo" className="w-10 h-10 rounded-xl object-cover shadow-sm ring-1 ring-primary/10" />
            <span className="brand-wordmark text-lg">AceStudy</span>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="text-4xl font-bold leading-tight mb-4">Your exam prep,<br /><span className="gradient-text">elevated.</span></h1>
            <p className="text-muted-foreground text-lg leading-relaxed">Track study sessions, predict readiness, and build habits that lead to results.</p>
          </motion.div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
              className="p-4 rounded-xl border border-border bg-background/50">
              <f.icon size={18} className="text-primary mb-3" />
              <p className="font-medium text-sm mb-1">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-transparent">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img src="/logo.png" alt="AceStudy logo" className="w-10 h-10 rounded-xl object-cover shadow-sm ring-1 ring-primary/10" />
            <span className="brand-wordmark text-lg">AceStudy</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Sign in to continue your preparation journey.</p>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</motion.div>
          )}
          <div className="flex flex-col items-center gap-4">
            {loading ? (
              <div className="w-[300px] h-10 rounded border border-border flex items-center justify-center">
                <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              </div>
            ) : <div ref={googleRef} />}
            <p className="text-xs text-muted-foreground text-center">By signing in, you agree to our Terms and Privacy Policy.</p>
          </div>
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">Trusted by students preparing for JEE, UPSC, GATE, CAT, and more.</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
