import { cn } from '../../lib/utils'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border border-primary/45 bg-primary text-primary-foreground shadow-[0_12px_30px_hsl(var(--primary)/0.22)] hover:-translate-y-0.5 hover:shadow-[0_16px_38px_hsl(var(--primary)/0.30)]',
        destructive: 'border border-destructive/55 bg-destructive text-destructive-foreground shadow-[0_12px_30px_hsl(var(--destructive)/0.20)] hover:-translate-y-0.5 hover:shadow-[0_16px_38px_hsl(var(--destructive)/0.28)]',
        outline: 'border border-border bg-card/70 text-foreground shadow-[0_10px_26px_rgba(0,0,0,0.14)] hover:-translate-y-0.5 hover:border-primary/45 hover:bg-accent/70',
        secondary: 'border border-border bg-secondary/90 text-secondary-foreground shadow-[0_10px_26px_rgba(0,0,0,0.14)] hover:-translate-y-0.5 hover:border-primary/35',
        ghost: 'text-muted-foreground hover:bg-accent/80 hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-lg px-6',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { buttonVariants }
