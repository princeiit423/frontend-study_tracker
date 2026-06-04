import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Trophy, Crown } from 'lucide-react'
import { leaderboardAPI } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { formatHours } from '../lib/utils'
import { useSelector } from 'react-redux'
import { selectUser } from '../store/slices/authSlice'
import { getAvatarSrc } from '../lib/avatar'

const MEDAL_COLORS = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' }

export default function LeaderboardPage() {
  const user = useSelector(selectUser)
  const [type, setType] = useState('hours')

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', type],
    queryFn: () => leaderboardAPI.get({ type }),
    select: d => d.data.data,
  })

  const { leaderboard = [], myRank } = data || {}

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">See how you rank among other students</p>
      </div>

      <div className="flex gap-2">
        {[{ value: 'hours', label: 'Study Hours' }, { value: 'streak', label: 'Streak' }, { value: 'xp', label: 'XP' }].map(t => (
          <Button key={t.value} variant={type === t.value ? 'default' : 'outline'} size="sm" onClick={() => setType(t.value)}>{t.label}</Button>
        ))}
      </div>

      {myRank > 0 && (
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Your Rank</p>
            <p className="text-3xl font-bold text-primary">#{myRank}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {leaderboard.map((entry, i) => {
            const isMe = entry.name === user?.name
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                <div className={`flex items-center gap-4 px-5 py-4 border-b border-border last:border-0 ${isMe ? 'bg-primary/5' : ''}`}>
                  <div className="w-8 text-center shrink-0">
                    {entry.rank <= 3 ? (
                      <Crown size={18} style={{ color: MEDAL_COLORS[entry.rank] }} className="mx-auto" />
                    ) : (
                      <span className="text-sm font-semibold text-muted-foreground">#{entry.rank}</span>
                    )}
                  </div>
                  <img src={getAvatarSrc(entry)}
                    alt={entry.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate ${isMe ? 'text-primary' : ''}`}>{entry.name}{isMe && ' (You)'}</p>
                    <p className="text-xs text-muted-foreground">Lv.{entry.level}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {type === 'hours' && <p className="font-semibold">{formatHours(entry.totalStudyHours)}</p>}
                    {type === 'streak' && <p className="font-semibold">{entry.currentStreak} <span className="text-xs font-normal text-muted-foreground">days</span></p>}
                    {type === 'xp' && <p className="font-semibold">{entry.xp} <span className="text-xs font-normal text-muted-foreground">XP</span></p>}
                  </div>
                </div>
              </motion.div>
            )
          })}
          {leaderboard.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">No data available yet</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
