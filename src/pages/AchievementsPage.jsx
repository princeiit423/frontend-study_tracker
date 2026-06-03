import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Trophy, Lock, Star, Flame, Clock, Target, CheckCircle, Calendar, Timer, Zap, Moon, Sunrise, Crown, Award } from 'lucide-react'
import { achievementAPI } from '../lib/api'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { formatDate } from '../lib/utils'
import { useSelector } from 'react-redux'
import { selectUser } from '../store/slices/authSlice'
import { getLevelInfo } from '../lib/utils'

const ICON_MAP = { Star, Flame, Clock, Trophy, Award, Crown, CheckCircle, Calendar, Timer, Zap, Moon, Sunrise, Target }

const CATEGORY_LABELS = { milestone: 'Milestones', hours: 'Study Hours', streak: 'Streaks', topics: 'Topics', goals: 'Goals', habit: 'Habits', focus: 'Focus', consistency: 'Consistency' }

export default function AchievementsPage() {
  const user = useSelector(selectUser)
  const { data, isLoading } = useQuery({ queryKey: ['achievements'], queryFn: () => achievementAPI.getAll(), select: d => d.data.data })
  const levelInfo = getLevelInfo(user?.xp || 0)

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" /></div>

  const { achievements = [], totalUnlocked = 0, totalAvailable = 0 } = data || {}
  const byCategory = achievements.reduce((acc, a) => { (acc[a.category] = acc[a.category] || []).push(a); return acc }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Achievements</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{totalUnlocked} of {totalAvailable} unlocked</p>
      </div>

      {/* Level progress */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">{levelInfo.level}</span>
              </div>
              <div>
                <p className="font-semibold">Level {levelInfo.level}</p>
                <p className="text-xs text-muted-foreground">{user?.xp || 0} XP total</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Next level</p>
              <p className="text-sm font-semibold text-primary">{levelInfo.nextThreshold} XP</p>
            </div>
          </div>
          <Progress value={levelInfo.progress} />
          <p className="text-xs text-muted-foreground mt-1.5">{levelInfo.progress}% to next level</p>
        </CardContent>
      </Card>

      {/* Achievements by category */}
      {Object.entries(byCategory).map(([category, items]) => (
        <div key={category}>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">{CATEGORY_LABELS[category] || category}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((achievement, i) => {
              const Icon = ICON_MAP[achievement.icon] || Trophy
              return (
                <motion.div key={achievement.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                  <div className={`p-4 rounded-xl border transition-colors ${achievement.isUnlocked ? 'bg-card border-primary/20 hover:border-primary/40' : 'bg-card/50 border-border opacity-60'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${achievement.isUnlocked ? 'bg-primary/10' : 'bg-muted'}`}>
                        {achievement.isUnlocked ? <Icon size={18} className="text-primary" /> : <Lock size={16} className="text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{achievement.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{achievement.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={achievement.isUnlocked ? 'default' : 'outline'} className="text-[10px]">+{achievement.xp} XP</Badge>
                          {achievement.isUnlocked && achievement.unlockedAt && (
                            <span className="text-[10px] text-muted-foreground">{formatDate(achievement.unlockedAt)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
