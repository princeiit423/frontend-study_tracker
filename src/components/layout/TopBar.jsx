import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, ChevronRight, Menu } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { selectIsGuest, selectUser } from '../../store/slices/authSlice'
import { setSidebarCollapsed } from '../../store/slices/uiSlice'
import { notificationAPI } from '../../lib/api'
import { formatHours } from '../../lib/utils'
import { getAvatarSrc } from '../../lib/avatar'

export default function TopBar() {
  const user = useSelector(selectUser)
  const isGuest = useSelector(selectIsGuest)
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
    <header className="relative z-50 flex h-[64px] shrink-0 items-center justify-between border-b border-border/70 bg-background/45 px-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-2xl sm:px-6">
      <div className="flex items-center gap-3">
        {collapsed && (
          <button onClick={() => dispatch(setSidebarCollapsed(false))} className="mr-1 text-muted-foreground transition-colors hover:text-foreground">
            <Menu size={18} />
          </button>
        )}
        <div className="text-sm text-muted-foreground">
          {user && (
            <span>
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
              <span className="font-black text-foreground">{user.name?.split(' ')[0]}</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isGuest && (
          <button
            onClick={() => navigate('/login')}
            className="hidden rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/15 sm:block"
          >
            Guest Preview - Sign in to save
          </button>
        )}

        {user && (
          <div className="mr-2 hidden items-center gap-1.5 rounded-xl border border-border bg-card/55 px-3 py-1.5 text-xs text-muted-foreground shadow-[0_10px_28px_rgba(0,0,0,0.14)] backdrop-blur-xl sm:flex">
            <span className="font-semibold text-primary">{user.currentStreak || 0}</span>
            <span>day streak</span>
            <span className="mx-1 text-border">-</span>
            <span className="font-semibold text-primary">{formatHours(user.totalStudyHours || 0)}</span>
            <span>total</span>
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => setShowNotifications(v => !v)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-accent/70 hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary shadow-[0_0_16px_hsl(var(--primary))]" />}
          </button>

          {showNotifications && (
            <div className="fixed right-3 top-[72px] z-[100] w-[min(360px,calc(100vw-24px))] rounded-xl border border-border bg-card/95 shadow-[0_20px_60px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:right-6">
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
          className="flex items-center gap-2 rounded-xl border border-transparent py-1.5 pl-2 pr-3 transition-colors hover:border-border hover:bg-accent/70"
        >
          <img src={getAvatarSrc(user)} alt={user?.name} className="h-7 w-7 rounded-full object-cover ring-1 ring-primary/25" />
          <ChevronRight size={14} className="text-muted-foreground" />
        </button>
      </div>
    </header>
  )
}
