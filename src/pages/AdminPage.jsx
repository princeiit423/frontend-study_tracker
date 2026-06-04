import { useQuery } from '@tanstack/react-query'
import { Shield, Users, Clock, BookOpen, Target } from 'lucide-react'
import { adminAPI } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

export default function AdminPage() {
  const { data, isError } = useQuery({ queryKey: ['admin-overview'], queryFn: adminAPI.overview, select: d => d.data.data, retry: false })
  const { data: users = [] } = useQuery({ queryKey: ['admin-users'], queryFn: adminAPI.users, select: d => d.data.data.users, retry: false })

  if (isError) {
    return (
      <div className="max-w-lg rounded-xl border border-destructive/30 bg-destructive/10 p-6">
        <Shield className="mb-3 text-destructive" />
        <h1 className="text-xl font-bold">Admin access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">Set your MongoDB user document role to admin to use this dashboard.</p>
      </div>
    )
  }

  const counts = data?.counts || {}
  const cards = [
    { label: 'Users', value: counts.users || 0, icon: Users },
    { label: 'Study Hours', value: data?.totalStudyHours || 0, icon: Clock },
    { label: 'Subjects', value: counts.subjects || 0, icon: BookOpen },
    { label: 'Goals', value: counts.goals || 0, icon: Target },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Platform overview and user activity.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}><CardContent className="p-5"><Icon size={18} className="mb-3 text-primary" /><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Recent Users</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {users.map(user => (
            <div key={user._id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p className="font-semibold uppercase text-primary">{user.role}</p>
                <p>Lv.{user.level || 1} - {(user.totalStudyHours || 0).toFixed(1)}h</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
