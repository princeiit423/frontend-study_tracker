import { cn } from '../../lib/utils'
export function Textarea({ className, ...props }) {
  return <textarea className={cn('clay-input flex min-h-[88px] w-full rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-50 resize-none', className)} {...props} />
}
