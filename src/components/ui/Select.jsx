import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
    if (value === '' || value === undefined || value === null) setSelectedLabel('')
  }, [value])

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
      className={cn('clay-input flex h-10 w-full items-center justify-between rounded-xl px-3 text-sm text-foreground transition hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring/35', className)}
      {...props}
    >
      {children ?? <span className={cn('truncate', !value && 'text-muted-foreground')}>{value || 'Select an option'}</span>}
      <ChevronDown size={14} className={cn('text-muted-foreground transition-transform', open && 'rotate-180')} />
    </button>
  )
}

export function SelectContent({ children, className }) {
  const { open, contentRef, triggerRef } = useContext(SelectContext) || {}
  const [position, setPosition] = useState(null)

  useLayoutEffect(() => {
    if (!open || !triggerRef?.current) return

    const updatePosition = () => {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(180, window.innerHeight - rect.bottom - 16),
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, triggerRef])

  if (!open) return null

  return createPortal(
    <div
      ref={contentRef}
      data-select-content
      style={position ? { top: position.top, left: position.left, width: position.width, maxHeight: position.maxHeight } : undefined}
      className={cn('fixed z-[9999] overflow-y-auto rounded-xl border border-border bg-card/95 p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.36),0_0_0_1px_hsl(var(--primary)/0.08)_inset] backdrop-blur-xl', className)}
    >
      {children}
    </div>,
    document.body
  )
}

export function SelectItem({ value, children, className }) {
  const { value: selectedValue, onValueChange } = useContext(SelectContext) || {}
  const label = getLabelText(children)

  return (
    <button
      type="button"
      onClick={() => onValueChange?.(value, label)}
      className={cn('flex w-full items-center rounded-lg border border-transparent px-3 py-2 text-left text-sm text-foreground transition hover:border-primary/35 hover:bg-accent/80', selectedValue === value && 'border-primary/45 bg-primary/10 text-primary', className)}
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
        <select className={cn('clay-input h-10 w-full rounded-xl px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring/35 appearance-none', error && 'border-destructive', className)} {...props}>
          {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
