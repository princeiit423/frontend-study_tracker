import { cn } from '../../lib/utils'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground border border-foreground shadow-[4px_4px_0_hsl(var(--foreground))] hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-[2px_2px_0_hsl(var(--foreground))]',
        destructive: 'bg-destructive text-destructive-foreground border border-foreground shadow-[4px_4px_0_hsl(var(--foreground))] hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-[2px_2px_0_hsl(var(--foreground))]',
        outline: 'border border-foreground bg-transparent shadow-[4px_4px_0_hsl(var(--foreground))] hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-[2px_2px_0_hsl(var(--foreground))]',
        secondary: 'bg-secondary text-secondary-foreground border border-foreground shadow-[4px_4px_0_hsl(var(--foreground))] hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-[2px_2px_0_hsl(var(--foreground))]',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
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
