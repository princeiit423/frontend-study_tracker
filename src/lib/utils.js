import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) { return twMerge(clsx(inputs)) }

export const formatDuration = (seconds) => {
  if (!seconds) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  if (m > 0) return `${m}m`
  return `${seconds}s`
}

export const formatHours = (hours) => {
  if (!hours) return '0h'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

export const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const formatRelativeTime = (date) => {
  if (!date) return ''
  const diffMs = new Date() - new Date(date)
  const mins = Math.floor(diffMs / 60000)
  const hours = Math.floor(diffMs / 3600000)
  const days = Math.floor(diffMs / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

export const getDaysUntil = (date) => {
  if (!date) return 0
  return Math.max(0, Math.ceil((new Date(date) - new Date()) / 86400000))
}

export const getLevelInfo = (xp) => {
  const thresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11500, 16000]
  let level = 1
  for (let i = 0; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) level = i + 1
    else break
  }
  level = Math.min(level, 10)
  const curr = thresholds[level - 1] || 0
  const next = thresholds[level] || thresholds[thresholds.length - 1]
  return { level, progress: Math.min(100, Math.round(((xp - curr) / (next - curr)) * 100)), nextThreshold: next, currentThreshold: curr }
}

export const MOOD_COLORS = { terrible: '#ef4444', bad: '#f97316', neutral: '#6b7280', good: '#22c55e', great: '#3b82f6' }
