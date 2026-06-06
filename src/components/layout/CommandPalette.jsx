import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Brain, CalendarDays, ClipboardList, FileText, LayoutDashboard, Search, Sparkles, Timer, Zap } from 'lucide-react'
import { coachAPI } from '../../lib/api'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'

const commands = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Study Coach', path: '/coach', icon: Sparkles },
  { label: 'Subjects', path: '/subjects', icon: Brain },
  { label: 'Tasks', path: '/tasks', icon: ClipboardList },
  { label: 'Calendar', path: '/calendar', icon: CalendarDays },
  { label: 'Focus Mode', path: '/focus', icon: Timer },
  { label: 'Notes', path: '/notes', icon: FileText },
]

export default function CommandPalette() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const captureMutation = useMutation({
    mutationFn: coachAPI.quickCapture,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coach-queue'] })
      qc.invalidateQueries({ queryKey: ['coach-weakness'] })
      qc.invalidateQueries({ queryKey: ['coach-weekly-report'] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['notes'] })
      qc.invalidateQueries({ queryKey: ['mistakes'] })
    },
  })

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const filteredCommands = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return commands
    return commands.filter(command => command.label.toLowerCase().includes(term))
  }, [query])

  const close = () => {
    setOpen(false)
    setQuery('')
  }

  const goTo = (path) => {
    navigate(path)
    close()
  }

  const quickCapture = async () => {
    const text = query.trim()
    if (!text) return
    try {
      await captureMutation.mutateAsync({ text })
      localStorage.removeItem('acestudy.quickCaptureDraft')
      close()
    } catch {
      localStorage.setItem('acestudy.quickCaptureDraft', text)
    }
  }

  useEffect(() => {
    if (open && !query) {
      const draft = localStorage.getItem('acestudy.quickCaptureDraft')
      if (draft) setQuery(draft)
    }
  }, [open, query])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Search size={17} />
            Command Palette
          </DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <Input
            autoFocus
            value={query}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                if (filteredCommands.length === 1 && filteredCommands[0].label.toLowerCase().includes(query.trim().toLowerCase())) goTo(filteredCommands[0].path)
                else quickCapture()
              }
            }}
            placeholder="Search pages or quick capture a task, note, or mistake..."
          />
          <div className="mt-4 space-y-1">
            {filteredCommands.map(command => {
              const Icon = command.icon
              return (
                <button
                  key={command.path}
                  onClick={() => goTo(command.path)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Icon size={16} className="text-primary" />
                  {command.label}
                </button>
              )
            })}
          </div>
          {query.trim() && (
            <div className="mt-4 rounded-lg border border-border bg-background/80 p-3">
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Quick Capture</p>
              <Button onClick={quickCapture} disabled={captureMutation.isPending} className="w-full justify-start">
                <Zap size={15} />
                Save "{query.trim().slice(0, 52)}{query.trim().length > 52 ? '...' : ''}"
              </Button>
              <p className="mt-2 text-[11px] text-muted-foreground">Use prefixes like task, note, or mistake for automatic routing.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
