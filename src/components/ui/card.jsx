import { cn } from '../../lib/utils'

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'neo-panel rounded-2xl text-card-foreground transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_22px_60px_rgba(0,0,0,0.28),0_0_34px_hsl(var(--primary)/0.08)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
export function CardHeader({ className, children, ...props }) {
  return <div className={cn('flex flex-col space-y-1 p-5 pb-3', className)} {...props}>{children}</div>
}
export function CardTitle({ className, children, ...props }) {
  return <h3 className={cn('font-semibold text-sm leading-none tracking-tight', className)} {...props}>{children}</h3>
}
export function CardDescription({ className, children, ...props }) {
  return <p className={cn('text-xs text-muted-foreground', className)} {...props}>{children}</p>
}
export function CardContent({ className, children, ...props }) {
  return <div className={cn('p-5 pt-0', className)} {...props}>{children}</div>
}
export function CardFooter({ className, children, ...props }) {
  return <div className={cn('flex items-center p-5 pt-0', className)} {...props}>{children}</div>
}
