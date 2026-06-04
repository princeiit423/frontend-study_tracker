import { motion } from 'framer-motion'

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="flex flex-col items-center gap-6">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary" />
        <div className="flex items-center gap-3 rounded-full border border-border bg-card/80 px-3 py-2 shadow-sm">
          <img src="/logo.png" alt="AceStudy" className="w-8 h-8 rounded-xl object-cover" />
          <span className="brand-wordmark text-sm text-foreground">AceStudy</span>
        </div>
      </motion.div>
    </div>
  )
}
