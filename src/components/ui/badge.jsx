import { cn } from '../../lib/utils'
import { cva } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default: 'border-primary/30 bg-primary/15 text-primary shadow-[0_0_20px_hsl(var(--primary)/0.08)]',
        secondary: 'border-border bg-secondary/80 text-secondary-foreground',
        destructive: 'border-destructive/30 bg-destructive/15 text-destructive',
        outline: 'text-foreground border-border bg-card/40',
        success: 'border-emerald-400/25 bg-emerald-500/15 text-emerald-300',
        warning: 'border-yellow-400/25 bg-yellow-500/15 text-yellow-300',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
