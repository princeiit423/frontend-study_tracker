import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { BookOpen, Compass, Eye, EyeOff, Lock, LogIn, Mail, Target, TrendingUp, User, UserPlus, Zap } from 'lucide-react'
import { authAPI } from '../lib/api'
import { continueAsGuest, setCredentials, selectIsAuthenticated, selectIsGuest, selectUser } from '../store/slices/authSlice'

const features = [
  { icon: Target, title: 'Smart Exam Tracking', desc: 'Track any exam - JEE, UPSC, CAT, or your own' },
  { icon: TrendingUp, title: 'Deep Analytics', desc: 'Heatmaps, streaks, and readiness predictions' },
  { icon: Zap, title: 'Focus Mode', desc: 'Distraction-free Pomodoro and deep work sessions' },
  { icon: BookOpen, title: 'Full Customization', desc: 'Your subjects, topics, goals - nothing hardcoded' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isGuest = useSelector(selectIsGuest)
  const user = useSelector(selectUser)
  const [mode, setMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', token: '' })

  useEffect(() => {
    if (isAuthenticated && !isGuest) {
      navigate(user && !user.isOnboarded ? '/onboarding' : '/dashboard', { replace: true })
    }
  }, [isAuthenticated, isGuest, navigate, user])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'forgot') {
        const { data } = await authAPI.forgotPassword({ email: form.email.trim() })
        setNotice(data.data?.resetToken ? `Dev reset token: ${data.data.resetToken}` : data.message)
        setMode('reset')
        return
      }

      if (mode === 'reset') {
        await authAPI.resetPassword({ token: form.token.trim(), password: form.password })
        setNotice('Password reset successfully. You can sign in now.')
        setMode('login')
        setForm(current => ({ ...current, password: '', token: '' }))
        return
      }

      const payload = {
        email: form.email.trim(),
        password: form.password,
        ...(mode === 'signup' ? { name: form.name.trim() } : {}),
      }

      const { data } = mode === 'signup'
        ? await authAPI.register(payload)
        : await authAPI.login(payload)

      dispatch(setCredentials({
        user: data.data.user,
        accessToken: data.data.accessToken,
      }))

      navigate(data.data.isNewUser || !data.data.user.isOnboarded ? '/onboarding' : '/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestAccess = () => {
    dispatch(continueAsGuest())
    navigate('/dashboard', { replace: true })
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
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Your exam prep,<br />
              <span className="gradient-text">elevated.</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Track study sessions, predict readiness, and build habits that lead to results.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="p-4 rounded-xl border border-border bg-background/50"
            >
              <feature.icon size={18} className="text-primary mb-3" />
              <p className="font-medium text-sm mb-1">{feature.title}</p>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
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

          <h2 className="text-2xl font-bold mb-2">{mode === 'signup' ? 'Create account' : 'Welcome back'}</h2>
          <p className="text-muted-foreground mb-6">
            {mode === 'signup' ? 'Start tracking your preparation today.' : mode === 'forgot' ? 'Generate a secure reset token for your account.' : mode === 'reset' ? 'Set a new password using your reset token.' : 'Sign in to continue your preparation journey.'}
          </p>

          <div className="clay-card bg-card p-4">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-background p-1 mb-5 border border-border">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setNotice('') }}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${mode === 'login' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <LogIn size={15} />
                Login
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(''); setNotice('') }}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${mode === 'signup' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <UserPlus size={15} />
                Sign up
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive"
              >
                {error}
              </motion.div>
            )}
            {notice && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"
              >
                {notice}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-foreground">Name</span>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={form.name}
                      onChange={(event) => updateField('name', event.target.value)}
                      className="w-full rounded-xl border-2 border-border bg-background py-2.5 pl-10 pr-3 text-sm font-semibold outline-none transition-colors focus:border-primary"
                      placeholder="Your name"
                      autoComplete="name"
                      required={mode === 'signup'}
                    />
                  </div>
                </label>
              )}

              {mode !== 'reset' && (
                <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-foreground">Email</span>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    className="w-full rounded-xl border-2 border-border bg-background py-2.5 pl-10 pr-3 text-sm font-semibold outline-none transition-colors focus:border-primary"
                    placeholder="you@example.com"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </div>
              </label>
              )}

              {mode === 'reset' && (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-foreground">Reset Token</span>
                  <input
                    value={form.token}
                    onChange={(event) => updateField('token', event.target.value)}
                    className="w-full rounded-xl border-2 border-border bg-background py-2.5 px-3 text-sm font-semibold outline-none transition-colors focus:border-primary"
                    placeholder="Paste reset token"
                    required
                  />
                </label>
              )}

              {mode !== 'forgot' && (
                <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-foreground">Password</span>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={form.password}
                    onChange={(event) => updateField('password', event.target.value)}
                    className="w-full rounded-xl border-2 border-border bg-background py-2.5 pl-10 pr-11 text-sm font-semibold outline-none transition-colors focus:border-primary"
                    placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    minLength={mode === 'signup' ? 8 : undefined}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl border-[3px] border-foreground bg-primary py-2.5 font-bold text-primary-foreground shadow-[4px_4px_0_hsl(var(--foreground))] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0_hsl(var(--foreground))] disabled:pointer-events-none disabled:opacity-70"
              >
                {loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Get reset token' : mode === 'reset' ? 'Reset password' : 'Sign in'}
              </button>
              {mode === 'login' && (
                <button type="button" onClick={() => { setMode('forgot'); setError(''); setNotice('') }} className="w-full text-center text-xs font-bold text-primary hover:underline">
                  Forgot password?
                </button>
              )}
              {(mode === 'forgot' || mode === 'reset') && (
                <button type="button" onClick={() => { setMode('login'); setError('') }} className="w-full text-center text-xs font-bold text-muted-foreground hover:text-foreground">
                  Back to login
                </button>
              )}
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] font-bold uppercase text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <button
              type="button"
              onClick={handleGuestAccess}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold text-foreground transition hover:border-primary/45 hover:bg-accent/70"
            >
              <Compass size={15} />
              Explore as Guest
            </button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground text-center">
            By signing in, you agree to our{' '}
            <Link to="/terms-of-service" className="text-primary underline-offset-4 hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy-policy" className="text-primary underline-offset-4 hover:underline">Privacy Policy</Link>.
          </p>

          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Trusted by students preparing for JEE, UPSC, GATE, CAT, and more.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
