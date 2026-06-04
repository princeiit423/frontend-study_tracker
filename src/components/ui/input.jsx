import { cn } from '../../lib/utils'

export function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      className={cn('clay-input flex h-10 w-full rounded-xl px-3 py-1 text-sm text-foreground transition file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-50', className)}
      {...props}
    />
  )
}
