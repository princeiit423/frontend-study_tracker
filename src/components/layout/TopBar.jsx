import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Bell, Menu, ChevronRight, Check } from 'lucide-react'
import { selectUser } from '../../store/slices/authSlice'
import { setSidebarCollapsed } from '../../store/slices/uiSlice'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationAPI } from '../../lib/api'
import { formatHours } from '../../lib/utils'

export default function TopBar() {
  const user = useSelector(selectUser)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showNotifications, setShowNotifications] = useState(false)
  const collapsed = useSelector(s => s.ui.sidebarCollapsed)

  const { data: notifData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => notificationAPI.getAll({ unreadOnly: true, limit: 5 }),
    refetchInterval: 5 * 60 * 1000,
    select: d => d.data.data,
  })

  const unreadCount = notifData?.unreadCount || 0
  const notifications = notifData?.notifications || []

  const markReadMutation = useMutation({
    mutationFn: notificationAPI.markRead,
    onSuccess: () => qc.invalidateQueries(['notifications-unread']),
  })

  return (
    <header className="clay-card relative z-50 h-[60px] rounded-none border-b border-border/80 bg-card/60 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        {collapsed && (
          <button onClick={() => dispatch(setSidebarCollapsed(false))} className="text-muted-foreground hover:text-foreground transition-colors mr-1">
            <Menu size={18} />
          </button>
        )}
        <div className="text-sm text-muted-foreground">
          {user && (
            <span>
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
              <span className="text-foreground font-medium">{user.name?.split(' ')[0]}</span>
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {user && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/50 text-xs text-muted-foreground mr-2">
            <span className="text-primary font-semibold">{user.currentStreak || 0}</span>
            <span>day streak</span>
            <span className="mx-1 text-border">·</span>
            <span className="text-primary font-semibold">{formatHours(user.totalStudyHours || 0)}</span>
            <span>total</span>
          </div>
        )}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(v => !v)}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
          {showNotifications && (
            <div className="fixed right-3 top-[68px] z-[100] w-[min(360px,calc(100vw-24px))] rounded-lg border border-foreground bg-card shadow-[8px_8px_0_hsl(var(--foreground))] sm:right-6">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-sm font-semibold">Notifications</p>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markReadMutation.mutate()}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Check size={13} />
                    Mark read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? notifications.map(notification => (
                  <button
                    key={notification._id}
                    onClick={() => {
                      if (!notification.isRead) markReadMutation.mutate([notification._id])
                      setShowNotifications(false)
                      if (notification.actionUrl) navigate(notification.actionUrl)
                    }}
                    className="block w-full border-b border-border/70 px-4 py-3 text-left last:border-b-0 hover:bg-accent/60"
                  >
                    <div className="flex items-start gap-2">
                      {!notification.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{notification.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>
                      </div>
                    </div>
                  </button>
                )) : (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet</div>
                )}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-accent transition-colors"
        >
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'U'}&background=3b82f6&color=fff`}
            alt={user?.name}
            className="w-7 h-7 rounded-full object-cover"
          />
          <ChevronRight size={14} className="text-muted-foreground" />
        </button>
      </div>
    </header>
  )
}
