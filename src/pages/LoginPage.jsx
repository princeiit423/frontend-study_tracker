import { useEffect } from 'react'
import { SignIn, useAuth } from '@clerk/clerk-react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { BookOpen, Target, TrendingUp, Zap } from 'lucide-react'
import { selectIsAuthenticated, selectUser } from '../store/slices/authSlice'

const features = [
  { icon: Target, title: 'Smart Exam Tracking', desc: 'Track any exam - JEE, UPSC, CAT, or your own' },
  { icon: TrendingUp, title: 'Deep Analytics', desc: 'Heatmaps, streaks, and readiness predictions' },
  { icon: Zap, title: 'Focus Mode', desc: 'Distraction-free Pomodoro and deep work sessions' },
  { icon: BookOpen, title: 'Full Customization', desc: 'Your subjects, topics, goals - nothing hardcoded' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector(selectUser)
  const { isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    if (isLoaded && isSignedIn && isAuthenticated) {
      navigate(user && !user.isOnboarded ? '/onboarding' : '/dashboard', { replace: true })
    }
  }, [isAuthenticated, isLoaded, isSignedIn, navigate, user])

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
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img src="/logo.png" alt="AceStudy logo" className="w-10 h-10 rounded-xl object-cover shadow-sm ring-1 ring-primary/10" />
            <span className="brand-wordmark text-lg">AceStudy</span>
          </div>

          <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Sign in to continue your preparation journey.</p>

          <div className="flex flex-col items-center gap-4">
            <div className="login-clerk-card w-full overflow-hidden rounded-2xl border-[3px] border-foreground bg-card p-4 shadow-[6px_6px_0_hsl(var(--foreground))]">
              <SignIn
                fallbackRedirectUrl="/dashboard"
                signUpFallbackRedirectUrl="/onboarding"
                appearance={{
                  variables: {
                    colorPrimary: 'hsl(var(--primary))',
                    colorText: 'hsl(var(--foreground))',
                    colorTextSecondary: 'hsl(var(--muted-foreground))',
                    colorBackground: 'hsl(var(--card))',
                    colorInputBackground: 'hsl(var(--background))',
                    colorInputText: 'hsl(var(--foreground))',
                    colorDanger: 'hsl(var(--destructive))',
                    borderRadius: '0.75rem',
                    fontFamily: '"Archivo", "Segoe UI", sans-serif',
                  },
                  elements: {
                    rootBox: 'w-full',
                    cardBox: 'w-full max-w-full',
                    card: 'w-full max-w-full bg-transparent border-0 shadow-none p-0',
                    header: 'hidden',
                    main: 'w-full max-w-full',
                    socialButtons: 'w-full max-w-full',
                    socialButtonsBlockButton: 'w-full max-w-full bg-background border-2 border-border text-foreground shadow-none hover:border-primary transition-colors font-semibold',
                    socialButtonsBlockButtonText: 'font-semibold text-foreground',
                    dividerLine: 'bg-border',
                    dividerText: 'text-muted-foreground font-semibold',
                    form: 'w-full max-w-full',
                    formField: 'w-full max-w-full',
                    formFieldLabel: 'text-foreground font-semibold',
                    formFieldInput: 'w-full max-w-full bg-background border-2 border-border text-foreground shadow-none focus:border-primary focus:ring-2 focus:ring-primary/20',
                    formButtonPrimary: 'w-full bg-primary text-primary-foreground border-2 border-foreground shadow-[3px_3px_0_hsl(var(--foreground))] hover:shadow-[4px_4px_0_hsl(var(--foreground))] hover:-translate-y-0.5 transition-all font-bold',
                    footer: 'w-full max-w-full bg-background/60 border border-border rounded-xl mt-4 px-3 py-3',
                    footerActionText: 'text-muted-foreground',
                    footerActionLink: 'text-primary font-bold underline-offset-4 hover:underline',
                    formFieldInputShowPasswordButton: 'text-muted-foreground hover:text-foreground',
                    formResendCodeLink: 'text-primary font-bold underline-offset-4 hover:underline',
                    identityPreview: 'w-full max-w-full bg-background border-2 border-border text-foreground',
                    otpCodeFieldInput: 'bg-background border-2 border-border text-foreground',
                  },
                }}
              />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              By signing in, you agree to our{' '}
              <Link to="/terms-of-service" className="text-primary underline-offset-4 hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy-policy" className="text-primary underline-offset-4 hover:underline">Privacy Policy</Link>.
            </p>
          </div>

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
