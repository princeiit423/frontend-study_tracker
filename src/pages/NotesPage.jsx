import { useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Edit2, FileText, Maximize2, Palette, Pin, Plus, Search, Trash2 } from 'lucide-react'
import { noteAPI, subjectAPI } from '../lib/api'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select'
import { formatRelativeTime } from '../lib/utils'

const NOTE_COLORS = [
  { name: 'Blue', value: '#60a5fa', bg: 'bg-blue-300' },
  { name: 'Violet', value: '#a78bfa', bg: 'bg-violet-300' },
  { name: 'Green', value: '#86efac', bg: 'bg-green-300' },
  { name: 'Amber', value: '#fcd34d', bg: 'bg-amber-300' },
  { name: 'Rose', value: '#fda4af', bg: 'bg-rose-300' },
  { name: 'Cyan', value: '#67e8f9', bg: 'bg-cyan-300' },
  { name: 'Slate', value: '#cbd5e1', bg: 'bg-slate-300' },
]

const TYPE_OPTIONS = ['general', 'subject', 'topic', 'quick']
const DEFAULT_NOTE_SIZE = { width: 280, height: 220 }

const getInitialPosition = (index) => ({
  x: 32 + (index % 3) * 310,
  y: 32 + Math.floor(index / 3) * 260,
  ...DEFAULT_NOTE_SIZE,
})

const getReadableTextColor = (hex) => {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return (r * 0.299 + g * 0.587 + b * 0.114) > 170 ? '#111827' : '#ffffff'
}

function NoteEditor({ note, defaultColor, defaultPosition, onClose, onSave }) {
  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectAPI.getAll(),
    select: d => d.data.data.subjects,
  })

  const [form, setForm] = useState(note ? {
    title: note.title || '',
    content: note.content || '',
    type: note.type || 'general',
    subject: note.subject?._id || '__none',
    color: note.color || defaultColor,
    tags: note.tags?.join(', ') || '',
  } : {
    title: '',
    content: '',
    type: 'general',
    subject: '__none',
    color: defaultColor,
    tags: '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await onSave({
        ...form,
        title: form.title.trim(),
        subject: form.subject === '__none' ? null : form.subject,
        tags: form.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        canvasPosition: note?.canvasPosition || defaultPosition,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_150px]">
        <div>
          <Label>Title</Label>
          <Input
            className="mt-1"
            placeholder="Formula shortcuts, revision plan..."
            value={form.title}
            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
          />
        </div>
        <div>
          <Label>Type</Label>
          <Select value={form.type} onValueChange={value => setForm(prev => ({ ...prev, type: value }))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map(type => <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Note</Label>
        <Textarea
          className="mt-1 min-h-[180px] resize-none text-sm leading-relaxed"
          placeholder="Write freely. This note will live on your canvas."
          value={form.content}
          onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Subject</Label>
          <Select value={form.subject} onValueChange={value => setForm(prev => ({ ...prev, subject: value }))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">No subject</SelectItem>
              {subjects?.map(subject => <SelectItem key={subject._id} value={subject._id}>{subject.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tags</Label>
          <Input
            className="mt-1"
            placeholder="important, formulas"
            value={form.tags}
            onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label>Color</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {NOTE_COLORS.map(color => (
            <button
              key={color.value}
              type="button"
              title={color.name}
              onClick={() => setForm(prev => ({ ...prev, color: color.value }))}
              className={`h-8 w-8 rounded-full border-2 border-foreground shadow-[2px_2px_0_hsl(var(--foreground))] transition-transform ${form.color === color.value ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-card' : ''}`}
              style={{ backgroundColor: color.value }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving || !form.title.trim()} className="flex-1">
          {saving ? 'Saving...' : note ? 'Update Note' : 'Add To Canvas'}
        </Button>
      </div>
    </div>
  )
}

function CanvasNote({ note, index, onEdit, onDelete, onOpen, onMove, onTogglePin }) {
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef(null)
  const currentPositionRef = useRef(null)
  const position = note.canvasPosition || getInitialPosition(index)
  const textColor = getReadableTextColor(note.color || '#60a5fa')

  const startDrag = (event) => {
    if (event.target.closest('[data-note-action]')) return
    const rect = event.currentTarget.getBoundingClientRect()
    dragRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: position.width || DEFAULT_NOTE_SIZE.width,
      height: position.height || DEFAULT_NOTE_SIZE.height,
    }
    currentPositionRef.current = position
    setDragging(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const moveDrag = (event) => {
    if (!dragging || !dragRef.current) return
    const canvas = event.currentTarget.parentElement.getBoundingClientRect()
    const nextX = Math.max(12, event.clientX - canvas.left - dragRef.current.offsetX)
    const nextY = Math.max(12, event.clientY - canvas.top - dragRef.current.offsetY)
    const nextPosition = {
      x: Math.round(nextX),
      y: Math.round(nextY),
      width: dragRef.current.width,
      height: dragRef.current.height,
    }
    currentPositionRef.current = nextPosition
    onMove(note, nextPosition, false)
  }

  const endDrag = () => {
    if (!dragging) return
    setDragging(false)
    onMove(note, currentPositionRef.current || note.canvasPosition || position, true)
  }

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02 }}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={`absolute select-none rounded-lg border-[3px] border-foreground shadow-[7px_7px_0_hsl(var(--foreground))] transition-shadow ${dragging ? 'z-30 cursor-grabbing shadow-[10px_10px_0_hsl(var(--foreground))]' : 'z-10 cursor-grab hover:z-20'}`}
      style={{
        left: position.x,
        top: position.y,
        width: position.width || DEFAULT_NOTE_SIZE.width,
        minHeight: position.height || DEFAULT_NOTE_SIZE.height,
        backgroundColor: note.color || '#60a5fa',
        color: textColor,
      }}
    >
      <div className="flex items-start justify-between gap-3 border-b-[3px] border-foreground/80 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {note.isPinned && <Pin size={13} fill="currentColor" />}
            <h3 className="truncate text-base font-black leading-tight">{note.title}</h3>
          </div>
          <p className="mt-1 text-[11px] font-semibold uppercase opacity-75">{note.type}</p>
        </div>
        <div className="flex shrink-0 gap-1" data-note-action>
          <button className="rounded-md p-1.5 hover:bg-black/10" onClick={() => onOpen(note)} title="Open">
            <Maximize2 size={14} />
          </button>
          <button className="rounded-md p-1.5 hover:bg-black/10" onClick={() => onTogglePin(note)} title="Pin">
            <Pin size={14} />
          </button>
          <button className="rounded-md p-1.5 hover:bg-black/10" onClick={() => onEdit(note)} title="Edit">
            <Edit2 size={14} />
          </button>
          <button className="rounded-md p-1.5 hover:bg-black/10" onClick={() => onDelete(note._id)} title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <button className="block w-full px-4 py-4 text-left" onClick={() => onOpen(note)} data-note-action>
        <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed">
          {note.content || 'Empty note'}
        </p>
      </button>

      <div className="flex flex-wrap gap-1.5 px-4 pb-4">
        {note.subject && <Badge variant="secondary" className="bg-white/80 text-[10px] text-slate-900">{note.subject.name}</Badge>}
        {note.tags?.slice(0, 4).map(tag => (
          <span key={tag} className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-bold">#{tag}</span>
        ))}
      </div>
    </motion.article>
  )
}

export default function NotesPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editNote, setEditNote] = useState(null)
  const [openNote, setOpenNote] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0].value)
  const [localPositions, setLocalPositions] = useState({})

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', typeFilter],
    queryFn: () => noteAPI.getAll(typeFilter !== 'all' ? { type: typeFilter } : {}),
    select: d => d.data.data.notes,
  })

  const createMutation = useMutation({ mutationFn: noteAPI.create, onSuccess: () => qc.invalidateQueries(['notes']) })
  const updateMutation = useMutation({ mutationFn: ({ id, ...data }) => noteAPI.update(id, data), onSuccess: () => qc.invalidateQueries(['notes']) })
  const deleteMutation = useMutation({ mutationFn: noteAPI.delete, onSuccess: () => qc.invalidateQueries(['notes']) })

  const filteredNotes = useMemo(() => {
    const term = search.trim().toLowerCase()
    return notes.filter(note => {
      if (!term) return true
      return [note.title, note.content, note.subject?.name, ...(note.tags || [])]
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(term))
    })
  }, [notes, search])

  const canvasNotes = filteredNotes.map((note, index) => ({
    ...note,
    canvasPosition: localPositions[note._id] || note.canvasPosition || getInitialPosition(index),
  }))

  const nextPosition = getInitialPosition(notes.length)
  const canvasWidth = Math.max(1100, ...canvasNotes.map(note => (note.canvasPosition?.x || 0) + (note.canvasPosition?.width || DEFAULT_NOTE_SIZE.width) + 80))
  const canvasHeight = Math.max(680, ...canvasNotes.map(note => (note.canvasPosition?.y || 0) + (note.canvasPosition?.height || DEFAULT_NOTE_SIZE.height) + 80))

  const handleMove = (note, position, persist) => {
    setLocalPositions(prev => ({ ...prev, [note._id]: position }))
    if (persist) updateMutation.mutate({ id: note._id, canvasPosition: position })
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black">Notes Canvas</h1>
          <p className="mt-1 text-sm text-muted-foreground">{notes.length} notes on your board</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search canvas..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['all', ...TYPE_OPTIONS].map(type => <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus size={16} />
            New Note
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card/70 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Palette size={16} className="text-primary" />
          Note color
        </div>
        <div className="flex flex-wrap gap-2">
          {NOTE_COLORS.map(color => (
            <button
              key={color.value}
              title={color.name}
              onClick={() => setSelectedColor(color.value)}
              className={`h-7 w-7 rounded-full border-2 border-foreground shadow-[2px_2px_0_hsl(var(--foreground))] ${selectedColor === color.value ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : ''}`}
              style={{ backgroundColor: color.value }}
            />
          ))}
        </div>
      </div>

      <section className="relative h-[calc(100vh-230px)] min-h-[560px] overflow-auto rounded-lg border-[3px] border-foreground bg-[linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] bg-[size:28px_28px] shadow-[8px_8px_0_hsl(var(--foreground))]">
        <div className="relative" style={{ width: canvasWidth, height: canvasHeight }}>
          {canvasNotes.length > 0 ? canvasNotes.map((note, index) => (
            <CanvasNote
              key={note._id}
              note={note}
              index={index}
              onEdit={setEditNote}
              onOpen={setOpenNote}
              onMove={handleMove}
              onDelete={id => deleteMutation.mutate(id)}
              onTogglePin={note => updateMutation.mutate({ id: note._id, isPinned: !note.isPinned })}
            />
          )) : (
            <div className="absolute left-1/2 top-1/2 w-80 -translate-x-1/2 -translate-y-1/2 rounded-lg border-[3px] border-foreground bg-card p-8 text-center shadow-[7px_7px_0_hsl(var(--foreground))]">
              <FileText size={34} className="mx-auto mb-4 text-primary" />
              <p className="font-bold">Your canvas is empty</p>
              <p className="mb-5 mt-2 text-sm text-muted-foreground">Add colorful notes and arrange them however your brain likes.</p>
              <Button onClick={() => setShowCreate(true)}><Plus size={15} className="mr-2" /> Add Note</Button>
            </div>
          )}
        </div>
      </section>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Add Canvas Note</DialogTitle></DialogHeader>
          <NoteEditor
            defaultColor={selectedColor}
            defaultPosition={nextPosition}
            onClose={() => setShowCreate(false)}
            onSave={data => createMutation.mutateAsync(data)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editNote} onOpenChange={() => setEditNote(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Canvas Note</DialogTitle></DialogHeader>
          {editNote && (
            <NoteEditor
              note={editNote}
              defaultColor={selectedColor}
              defaultPosition={editNote.canvasPosition || nextPosition}
              onClose={() => setEditNote(null)}
              onSave={data => updateMutation.mutateAsync({ id: editNote._id, ...data })}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!openNote} onOpenChange={() => setOpenNote(null)}>
        <DialogContent className="max-w-2xl">
          {openNote && (
            <>
              <DialogHeader><DialogTitle>{openNote.title}</DialogTitle></DialogHeader>
              <div className="rounded-lg border-[3px] border-foreground p-5 shadow-[5px_5px_0_hsl(var(--foreground))]" style={{ backgroundColor: openNote.color, color: getReadableTextColor(openNote.color || '#60a5fa') }}>
                <p className="max-h-[55vh] whitespace-pre-wrap overflow-y-auto text-sm font-semibold leading-relaxed">{openNote.content || 'Empty note'}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-xs text-muted-foreground">{formatRelativeTime(openNote.lastEditedAt || openNote.createdAt)}</span>
                {openNote.tags?.map(tag => <Badge key={tag} variant="outline">#{tag}</Badge>)}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
