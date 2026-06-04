import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Brain, Timer, BarChart2,
  Target, FileText, ClipboardList, Trophy, Users,
  Settings, LogOut, ChevronLeft, BookMarked, Zap, CalendarDays, ListChecks, RotateCcw, Wand2, Shield, Sparkles
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { selectUser } from '../../store/slices/authSlice'
import { logout } from '../../store/slices/authSlice'
import { authAPI } from '../../lib/api'
import { getAvatarSrc } from '../../lib/avatar'
import { setSidebarCollapsed } from '../../store/slices/uiSlice'
import { useSelector as useSel } from 'react-redux'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/coach', icon: Sparkles, label: 'Coach' },
  { to: '/exams', icon: BookMarked, label: 'Exams' },
  { to: '/subjects', icon: Brain, label: 'Subjects' },
  { to: '/sessions', icon: Timer, label: 'Sessions' },
  { to: '/tasks', icon: ListChecks, label: 'Tasks' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { to: '/study-plan', icon: Wand2, label: 'Study Plan' },
  { to: '/revisions', icon: RotateCcw, label: 'Revisions' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/notes', icon: FileText, label: 'Notes' },
  { to: '/mock-tests', icon: ClipboardList, label: 'Mock Tests' },
  { to: '/achievements', icon: Trophy, label: 'Achievements' },
  { to: '/leaderboard', icon: Users, label: 'Leaderboard' },
  { to: '/admin', icon: Shield, label: 'Admin' },
]

export default function Sidebar() {
  const user = useSelector(selectUser)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const collapsed = useSel(s => s.ui.sidebarCollapsed)

  const handleLogout = async () => {
    try { await authAPI.logout() } catch {}
    dispatch(logout())
    navigate('/login')
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="flex h-full shrink-0 flex-col overflow-hidden border-r border-border/70 bg-background/50 shadow-[18px_0_55px_rgba(0,0,0,0.20)] backdrop-blur-2xl"
    >
      {/* Logo */}
      <div className="flex min-h-[64px] items-center justify-between border-b border-border/70 p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="AceStudy logo" className="w-8 h-8 rounded-xl object-cover shrink-0 shadow-sm ring-1 ring-primary/10" />
            <span className="brand-wordmark bg-gradient-to-r from-primary via-violet-300 to-lime-200 bg-clip-text text-sm text-transparent">AceStudy</span>
          </div>
        )}
        {collapsed && (
          <img src="/logo.png" alt="AceStudy logo" className="w-8 h-8 rounded-xl object-cover mx-auto shrink-0 shadow-sm ring-1 ring-primary/10" />
        )}
        {!collapsed && (
          <button onClick={() => dispatch(setSidebarCollapsed(true))} className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Focus Mode */}
      {!collapsed && (
        <div className="border-b border-border/70 p-3">
          <NavLink to="/focus" className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-bold text-primary shadow-[0_10px_26px_hsl(var(--primary)/0.10)] transition-colors hover:bg-primary/20">
            <Zap size={14} />
            Focus Mode
          </NavLink>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto no-scrollbar">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => cn(
            'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
            collapsed && 'justify-center',
            isActive ? 'border border-primary/25 bg-primary/10 text-foreground shadow-[0_10px_28px_hsl(var(--primary)/0.08)]' : 'border border-transparent text-muted-foreground hover:border-border hover:bg-accent/55 hover:text-foreground'
          )}>
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive ? 'text-primary' : ''} />
                {!collapsed && <span>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="space-y-0.5 border-t border-border/70 p-3">
        <NavLink to="/settings" className={({ isActive }) => cn(
          'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
          collapsed && 'justify-center',
          isActive ? 'border border-primary/25 bg-primary/10 text-foreground' : 'border border-transparent text-muted-foreground hover:border-border hover:bg-accent/55 hover:text-foreground'
        )}>
          <Settings size={16} />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        <button onClick={handleLogout} className={cn(
          'flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-destructive/25 hover:bg-destructive/10 hover:text-destructive',
          collapsed && 'justify-center'
        )}>
          <LogOut size={16} />
          {!collapsed && <span>Sign Out</span>}
        </button>
        {!collapsed && user && (
          <div className="mt-2 flex items-center gap-2 border-t border-border/70 px-3 py-2 pt-3">
            <img src={getAvatarSrc(user)} alt={user.name} className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-primary/25" />
            <div className="overflow-hidden">
              <p className="text-xs font-medium truncate">{user.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">Lv.{user.level || 1}</p>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  )
}
