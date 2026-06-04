import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { User, Palette, Bell, Shield, Download, LogOut, Moon, Sun, Monitor, KeyRound } from 'lucide-react'
import { userAPI, authAPI } from '../lib/api'
import { updateUser, logout, selectUser } from '../store/slices/authSlice'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Switch } from '../components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../components/ui/Select'
import { Separator } from '../components/ui/separator'
import { useNavigate } from 'react-router-dom'
import { AVATAR_PRESETS, getAvatarSrc, getPresetAvatarSrc } from '../lib/avatar'

const THEME_MODES = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

const ACCENT_COLORS = [
  { value: 'blue', color: '#3b82f6' },
  { value: 'purple', color: '#8b5cf6' },
  { value: 'green', color: '#22c55e' },
  { value: 'orange', color: '#f97316' },
  { value: 'pink', color: '#ec4899' },
  { value: 'cyan', color: '#06b6d4' },
]

export default function SettingsPage() {
  const user = useSelector(selectUser)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' })
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', bio: user?.bio || '', timezone: user?.timezone || 'Asia/Kolkata' })
  const [prefForm, setPrefForm] = useState({ dailyGoalHours: user?.preferences?.dailyGoalHours || 4, weeklyGoalHours: user?.preferences?.weeklyGoalHours || 28, pomodoroWork: user?.preferences?.pomodoroWork || 25, pomodoroBreak: user?.preferences?.pomodoroBreak || 5, restDays: user?.preferences?.restDays || [] })
  const [notifForm, setNotifForm] = useState({ studyReminder: user?.notificationSettings?.studyReminder ?? true, goalReminder: user?.notificationSettings?.goalReminder ?? true, streakReminder: user?.notificationSettings?.streakReminder ?? true })

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const { data } = await userAPI.updateProfile(profileForm)
      dispatch(updateUser(data.data.user))
    } catch (e) { console.error(e) } finally { setSaving(false) }
  }

  const handleAvatarSelect = async (avatar) => {
    const { data } = await userAPI.updateProfile({ avatar })
    dispatch(updateUser(data.data.user))
  }

  const handleSavePrefs = async () => {
    setSaving(true)
    try {
      const { data } = await userAPI.updateProfile({ preferences: prefForm })
      dispatch(updateUser(data.data.user))
    } catch (e) { console.error(e) } finally { setSaving(false) }
  }

  const toggleRestDay = (day) => {
    setPrefForm(p => ({ ...p, restDays: p.restDays.includes(day) ? p.restDays.filter(d => d !== day) : [...p.restDays, day] }))
  }

  const handleChangePassword = async () => {
    setSaving(true)
    try {
      await userAPI.changePassword(passwordForm)
      setPasswordForm({ currentPassword: '', newPassword: '' })
      dispatch(logout())
      navigate('/login')
    } catch (e) { console.error(e) } finally { setSaving(false) }
  }

  const handleSaveNotifs = async () => {
    setSaving(true)
    try {
      const { data } = await userAPI.updateProfile({ notificationSettings: notifForm })
      dispatch(updateUser(data.data.user))
    } catch (e) { console.error(e) } finally { setSaving(false) }
  }

  const handleThemeChange = async (mode) => {
    try {
      const { data } = await userAPI.updateProfile({ theme: { ...user?.theme, mode } })
      dispatch(updateUser(data.data.user))
      if (mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark')
      } else { document.documentElement.classList.remove('dark') }
    } catch (e) { console.error(e) }
  }

  const handleAccentChange = async (accent) => {
    try {
      const { data } = await userAPI.updateProfile({ theme: { ...user?.theme, accent } })
      dispatch(updateUser(data.data.user))
    } catch (e) { console.error(e) }
  }

  const handleLogout = async () => {
    try { await authAPI.logout() } catch {}
    dispatch(logout())
    navigate('/login')
  }

  const handleExportData = () => {
    userAPI.exportData().then(({ data }) => {
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'acestudy-full-export.json'; a.click()
      URL.revokeObjectURL(url)
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Study</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="notifications">Alerts</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-border">
                <img src={getAvatarSrc(user)}
                  alt={user?.name} className="w-16 h-16 rounded-full object-cover" />
                <div>
                  <p className="font-semibold">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">Level {user?.level || 1} · {user?.xp || 0} XP</p>
                </div>
              </div>
              <div>
                <Label>Avatar</Label>
                <div className="mt-2 grid grid-cols-6 gap-2">
                  {AVATAR_PRESETS.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAvatarSelect(preset)}
                      className={`rounded-full border-2 p-0.5 ${user?.avatar === preset ? 'border-primary' : 'border-border'}`}
                    >
                      <img src={getPresetAvatarSrc(preset, user?.name)} alt={preset} className="h-9 w-9 rounded-full" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Display Name</Label>
                <Input className="mt-1" value={profileForm.name} onChange={e => setProfileForm(p => ({...p, name: e.target.value}))} />
              </div>
              <div>
                <Label>Bio</Label>
                <Input className="mt-1" placeholder="Tell others about yourself..." value={profileForm.bio} onChange={e => setProfileForm(p => ({...p, bio: e.target.value}))} />
              </div>
              <div>
                <Label>Timezone</Label>
                <Input className="mt-1" value={profileForm.timezone} onChange={e => setProfileForm(p => ({...p, timezone: e.target.value}))} />
              </div>
              <Button onClick={handleSaveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Study Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="flex justify-between mb-2"><Label>Daily Goal</Label><span className="text-sm font-medium text-primary">{prefForm.dailyGoalHours}h</span></div>
                <input type="range" min={1} max={16} value={prefForm.dailyGoalHours} onChange={e => setPrefForm(p => ({...p, dailyGoalHours: Number(e.target.value)}))} className="w-full accent-blue-500" />
              </div>
              <div>
                <div className="flex justify-between mb-2"><Label>Weekly Goal</Label><span className="text-sm font-medium text-primary">{prefForm.weeklyGoalHours}h</span></div>
                <input type="range" min={7} max={100} value={prefForm.weeklyGoalHours} onChange={e => setPrefForm(p => ({...p, weeklyGoalHours: Number(e.target.value)}))} className="w-full accent-blue-500" />
              </div>
              <Separator />
              <div>
                <Label className="mb-2 block">Protected Rest Days</Label>
                <div className="flex flex-wrap gap-2">
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => (
                    <button key={day} type="button" onClick={() => toggleRestDay(day)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${prefForm.restDays.includes(day) ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'}`}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <Separator />
              <p className="text-sm font-medium">Pomodoro Settings</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Work Duration (mins)</Label>
                  <Input className="mt-1" type="number" min={5} max={90} value={prefForm.pomodoroWork} onChange={e => setPrefForm(p => ({...p, pomodoroWork: Number(e.target.value)}))} />
                </div>
                <div>
                  <Label>Break Duration (mins)</Label>
                  <Input className="mt-1" type="number" min={1} max={30} value={prefForm.pomodoroBreak} onChange={e => setPrefForm(p => ({...p, pomodoroBreak: Number(e.target.value)}))} />
                </div>
              </div>
              <Button onClick={handleSavePrefs} disabled={saving}>{saving ? 'Saving...' : 'Save Preferences'}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-3 block">Color Mode</Label>
                <div className="grid grid-cols-3 gap-3">
                  {THEME_MODES.map(({ value, label, icon: Icon }) => (
                    <button key={value} onClick={() => handleThemeChange(value)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${user?.theme?.mode === value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                      <Icon size={20} className={user?.theme?.mode === value ? 'text-primary' : 'text-muted-foreground'} />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <Label className="mb-3 block">Accent Color</Label>
                <div className="flex gap-3 flex-wrap">
                  {ACCENT_COLORS.map(({ value, color }) => (
                    <button key={value} onClick={() => handleAccentChange(value)}
                      className={`w-9 h-9 rounded-full transition-all ${user?.theme?.accent === value ? 'ring-2 ring-offset-2 ring-offset-card ring-white scale-110' : ''}`}
                      style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Notification Settings</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {[
                { key: 'studyReminder', label: 'Study Reminders', desc: 'Daily reminders to study' },
                { key: 'goalReminder', label: 'Goal Reminders', desc: 'Reminders about your goals' },
                { key: 'streakReminder', label: 'Streak Alerts', desc: 'Alerts when your streak is at risk' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Switch checked={notifForm[key]} onCheckedChange={v => setNotifForm(p => ({...p, [key]: v}))} />
                </div>
              ))}
              <Button onClick={handleSaveNotifs} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Account</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium">Export Data</p>
                  <p className="text-xs text-muted-foreground">Download all your data as JSON</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportData}>
                  <Download size={14} className="mr-2" /> Export
                </Button>
              </div>
              <div className="space-y-3 p-4 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium">Change Password</p>
                  <p className="text-xs text-muted-foreground">You will be asked to sign in again.</p>
                </div>
                <Input type="password" placeholder="Current password" value={passwordForm.currentPassword} onChange={e => setPasswordForm(p => ({...p, currentPassword: e.target.value}))} />
                <Input type="password" placeholder="New password" value={passwordForm.newPassword} onChange={e => setPasswordForm(p => ({...p, newPassword: e.target.value}))} />
                <Button size="sm" onClick={handleChangePassword} disabled={saving || passwordForm.newPassword.length < 8}>
                  <KeyRound size={14} className="mr-2" /> Change Password
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium">Sign Out</p>
                  <p className="text-xs text-muted-foreground">Sign out of your account</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut size={14} className="mr-2" /> Sign Out
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30">
                <div>
                  <p className="text-sm font-medium text-destructive">Delete Account</p>
                  <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => window.confirm('Are you sure? This cannot be undone.') && userAPI.deleteAccount().then(() => { dispatch(logout()); navigate('/login') })}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
