import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function FancySelect({ value, onChange, options = [], placeholder = 'Select...', className }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const selected = useMemo(() => options.find(option => option.value === value), [options, value])

  useEffect(() => {
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        className="clay-input flex h-10 w-full items-center justify-between rounded-xl px-3 text-left text-sm text-foreground outline-none transition hover:border-primary/45 focus:border-primary/50 focus:ring-2 focus:ring-ring/35"
      >
        <span className={cn('flex min-w-0 items-center gap-2 truncate', !selected && 'text-muted-foreground')}>
          {selected?.color && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: selected.color }} />}
          <span className="truncate">{selected?.label || placeholder}</span>
        </span>
        <ChevronDown size={15} className={cn('shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[140] max-h-64 overflow-y-auto rounded-xl border border-border bg-card/95 p-1.5 shadow-[0_22px_70px_rgba(0,0,0,0.45),0_0_0_1px_hsl(var(--primary)/0.08)_inset] backdrop-blur-xl">
          {options.map(option => (
            <button
              key={option.value || '__empty'}
              type="button"
              onClick={() => {
                onChange?.(option.value)
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2 text-left text-sm font-semibold text-foreground transition hover:border-primary/35 hover:bg-accent/80',
                value === option.value && 'border-primary/40 bg-primary/10 text-primary'
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                {option.color && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: option.color }} />}
                <span className="truncate">{option.label}</span>
              </span>
              {value === option.value && <Check size={14} className="shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
