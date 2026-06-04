import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import { Card } from './card'

export default function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'text-primary', className, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }}>
      <Card className={cn('flex flex-col gap-3', className)}>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
          {Icon && <div className={cn('w-7 h-7 flex items-center justify-center rounded-lg bg-primary/10', color === 'text-emerald-500' && 'bg-emerald-500/10', color === 'text-yellow-500' && 'bg-yellow-500/10')}><Icon size={14} className={color} /></div>}
        </div>
        <div>
          <p className={cn('text-2xl font-bold tracking-tight', color)}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {trend !== undefined && (
          <p className={cn('text-xs', trend >= 0 ? 'text-emerald-500' : 'text-destructive')}>
            {trend >= 0 ? '+' : ''}{trend}% vs last week
          </p>
        )}
      </Card>
    </motion.div>
  )
}
