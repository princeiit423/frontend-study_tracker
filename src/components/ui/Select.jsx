import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../../lib/utils'
import { ChevronDown } from 'lucide-react'

const SelectContext = createContext(null)

function getLabelText(children) {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) return children.map(getLabelText).filter(Boolean).join(' ')
  if (children?.props?.children) return getLabelText(children.props.children)
  return ''
}

export function Select({ value, onValueChange, children, className }) {
  const [selectedLabel, setSelectedLabel] = useState('')
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const contentRef = useRef(null)

  useEffect(() => {
    const handlePointerDown = (event) => {
      const clickedInsideTrigger = triggerRef.current?.contains(event.target)
      const clickedInsideContent = contentRef.current?.contains(event.target)
      if (!clickedInsideTrigger && !clickedInsideContent) setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  const contextValue = useMemo(() => ({
    value,
    selectedLabel,
    open,
    setOpen,
    triggerRef,
    contentRef,
    onValueChange: (nextValue, nextLabel) => {
      setSelectedLabel(nextLabel || '')
      onValueChange?.(nextValue)
      setOpen(false)
    },
  }), [value, selectedLabel, open, onValueChange])

  return (
    <SelectContext.Provider value={contextValue}>
      <div className={cn('relative space-y-1.5', className)}>{children}</div>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({ children, className, ...props }) {
  const { value, open, setOpen, triggerRef } = useContext(SelectContext) || {}

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => setOpen?.(!open)}
      className={cn('clay-input flex h-10 w-full items-center justify-between rounded-xl border border-foreground bg-card px-3 text-sm text-foreground shadow-[4px_4px_0_hsl(var(--foreground))] transition focus:outline-none focus:ring-2 focus:ring-ring', className)}
      {...props}
    >
      {children ?? <span className={cn('truncate', !value && 'text-muted-foreground')}>{value || 'Select an option'}</span>}
      <ChevronDown size={14} className={cn('text-muted-foreground transition-transform', open && 'rotate-180')} />
    </button>
  )
}

export function SelectContent({ children, className }) {
  const { open, contentRef } = useContext(SelectContext) || {}

  if (!open) return null

  return <div ref={contentRef} className={cn('absolute z-20 mt-1 w-full rounded-xl border border-foreground bg-card p-1.5 shadow-[6px_6px_0_hsl(var(--foreground))]', className)}>{children}</div>
}

export function SelectItem({ value, children, className }) {
  const { value: selectedValue, onValueChange } = useContext(SelectContext) || {}
  const label = getLabelText(children)

  return (
    <button
      type="button"
      onClick={() => onValueChange?.(value, label)}
      className={cn('flex w-full items-center rounded-lg border border-transparent px-3 py-2 text-left text-sm text-foreground transition hover:border-foreground hover:bg-accent', selectedValue === value && 'border-foreground bg-accent', className)}
    >
      {children}
    </button>
  )
}

export function SelectValue({ placeholder = 'Select an option', className }) {
  const { selectedLabel, value } = useContext(SelectContext) || {}

  return <span className={cn('truncate', !selectedLabel && !value && 'text-muted-foreground', className)}>{selectedLabel || value || placeholder}</span>
}

export default function NativeSelect({ label, error, className, options = [], ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="relative">
        <select className={cn('w-full h-9 rounded-lg border border-border bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none', error && 'border-destructive', className)} {...props}>
          {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
