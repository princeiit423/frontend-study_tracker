import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {Icon && <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4"><Icon size={20} className="text-muted-foreground" /></div>}
      <p className="font-medium text-sm mb-1">{title}</p>
      {description && <p className="text-muted-foreground text-sm max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  )
}
