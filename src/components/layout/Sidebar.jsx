import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Brain, Timer, BarChart2,
  Target, FileText, ClipboardList, Trophy, Users,
  Settings, LogOut, ChevronLeft, BookMarked, Zap
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { selectUser } from '../../store/slices/authSlice'
import { logout } from '../../store/slices/authSlice'
import { authAPI } from '../../lib/api'
import { setSidebarCollapsed } from '../../store/slices/uiSlice'
import { useSelector as useSel } from 'react-redux'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/exams', icon: BookMarked, label: 'Exams' },
  { to: '/subjects', icon: Brain, label: 'Subjects' },
  { to: '/sessions', icon: Timer, label: 'Sessions' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/notes', icon: FileText, label: 'Notes' },
  { to: '/mock-tests', icon: ClipboardList, label: 'Mock Tests' },
  { to: '/achievements', icon: Trophy, label: 'Achievements' },
  { to: '/leaderboard', icon: Users, label: 'Leaderboard' },
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
      className="clay-card flex flex-col rounded-none border-r border-border/80 h-full overflow-hidden shrink-0 bg-card/80"
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-border min-h-[60px]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src="/brand-mark.svg" alt="AceStudy logo" className="w-8 h-8 rounded-xl object-cover shrink-0 shadow-sm ring-1 ring-primary/10" />
            <span className="font-semibold text-sm tracking-tight">AceStudy</span>
          </div>
        )}
        {collapsed && (
          <img src="/brand-mark.svg" alt="AceStudy logo" className="w-8 h-8 rounded-xl object-cover mx-auto shrink-0 shadow-sm ring-1 ring-primary/10" />
        )}
        {!collapsed && (
          <button onClick={() => dispatch(setSidebarCollapsed(true))} className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Focus Mode */}
      {!collapsed && (
        <div className="p-3 border-b border-border">
          <NavLink to="/focus" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors text-xs font-medium">
            <Zap size={14} />
            Focus Mode
          </NavLink>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto no-scrollbar">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            collapsed && 'justify-center',
            isActive ? 'bg-accent text-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
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
      <div className="p-3 border-t border-border space-y-0.5">
        <NavLink to="/settings" className={({ isActive }) => cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
          collapsed && 'justify-center',
          isActive ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
        )}>
          <Settings size={16} />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        <button onClick={handleLogout} className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors',
          collapsed && 'justify-center'
        )}>
          <LogOut size={16} />
          {!collapsed && <span>Sign Out</span>}
        </button>
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-3 py-2 mt-2 border-t border-border pt-3">
            <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=3b82f6&color=fff`} alt={user.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
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
