import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Clock, Target, Flame, TrendingUp, Play, Calendar, Award, BookOpen, ChevronRight, Zap } from 'lucide-react'
import { analyticsAPI, examAPI, goalAPI, sessionAPI } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { Button } from '../components/ui/button'
import { formatHours, getDaysUntil, formatDate } from '../lib/utils'
import { useSelector } from 'react-redux'
import { selectUser } from '../store/slices/authSlice'
import StudyTimer from '../components/study/StudyTimer'
import HeatmapChart from '../components/analytics/HeatmapChart'
import SubjectDistributionChart from '../components/analytics/SubjectDistributionChart'
import DailyChart from '../components/analytics/DailyChart'

const fadeUp = (delay = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.3 } })

export default function DashboardPage() {
  const user = useSelector(selectUser)

  const { data: stats } = useQuery({ queryKey: ['dashboard-stats'], queryFn: () => analyticsAPI.getDashboard(), select: d => d.data.data.stats, refetchInterval: 30000 })
  const { data: exams } = useQuery({ queryKey: ['exams'], queryFn: () => examAPI.getAll(), select: d => d.data.data.exams })
  const { data: goals } = useQuery({ queryKey: ['goals', { active: true }], queryFn: () => goalAPI.getAll({ active: true }), select: d => d.data.data.goals })
  const { data: activeSession } = useQuery({ queryKey: ['active-session'], queryFn: () => sessionAPI.getActive(), select: d => d.data.data.session, refetchInterval: 5000 })

  const primaryExam = exams?.find(e => e.isPrimary) || exams?.[0]
  const activeGoals = goals?.filter(g => !g.isCompleted)?.slice(0, 3) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <Link to="/focus">
          <Button size="sm" className="gap-2"><Zap size={14} /> Focus Mode</Button>
        </Link>
      </div>

      {/* Timer */}
      <motion.div {...fadeUp(0)}>
        <StudyTimer activeSession={activeSession} />
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today", value: formatHours(stats?.today?.hours || 0), sub: `${stats?.today?.sessions || 0} sessions`, icon: Clock, progress: stats?.today?.progress },
          { label: "This Week", value: formatHours(stats?.week?.hours || 0), sub: `Goal: ${formatHours(stats?.week?.goal || 28)}`, icon: Calendar, progress: stats?.week?.progress },
          { label: "Current Streak", value: `${stats?.streak?.current || 0}`, sub: `Best: ${stats?.streak?.longest || 0} days`, icon: Flame, color: 'text-orange-500' },
          { label: "Total Hours", value: formatHours(stats?.total?.hours || 0), sub: `${stats?.total?.sessions || 0} total sessions`, icon: TrendingUp },
        ].map(({ label, value, sub, icon: Icon, progress, color }, i) => (
          <motion.div key={label} {...fadeUp(0.05 * i)}>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
                  <Icon size={15} className={color || 'text-primary'} />
                </div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                {progress !== undefined && <Progress value={progress} className="mt-3 h-1" />}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Exam countdown */}
        <motion.div {...fadeUp(0.1)}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Primary Exam</span>
                <Link to="/exams" className="text-muted-foreground hover:text-foreground"><ChevronRight size={14} /></Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {primaryExam ? (
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-base">{primaryExam.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(primaryExam.examDate)}</p>
                  </div>
                  <div className="text-center py-4">
                    <p className="text-4xl font-bold text-primary">{getDaysUntil(primaryExam.examDate)}</p>
                    <p className="text-xs text-muted-foreground mt-1">days remaining</p>
                  </div>
                  {primaryExam.readinessScore > 0 && (
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Readiness</span>
                        <span className="font-medium text-primary">{primaryExam.readinessScore}%</span>
                      </div>
                      <Progress value={primaryExam.readinessScore} />
                    </div>
                  )}
                  <Link to="/exams">
                    <Button variant="outline" size="sm" className="w-full mt-2">View Details</Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6">
                  <BookOpen size={24} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">No exam added yet</p>
                  <Link to="/exams"><Button size="sm">Add Exam</Button></Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Daily chart */}
        <motion.div {...fadeUp(0.15)} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Study Activity (14 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <DailyChart days={14} height={140} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Goals + Subject Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div {...fadeUp(0.2)}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Active Goals</span>
                <Link to="/goals" className="text-muted-foreground hover:text-foreground text-xs font-normal">View all</Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeGoals.length > 0 ? activeGoals.map(goal => (
                <div key={goal._id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate max-w-[200px]">{goal.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">{goal.currentValue}/{goal.targetValue} {goal.unit}</span>
                  </div>
                  <Progress value={goal.progressPercentage || Math.round((goal.currentValue / goal.targetValue) * 100)} />
                </div>
              )) : (
                <div className="text-center py-4">
                  <Target size={20} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No active goals</p>
                  <Link to="/goals"><Button variant="outline" size="sm">Create Goal</Button></Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeUp(0.25)}>
          <Card>
            <CardHeader>
              <CardTitle>Subject Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <SubjectDistributionChart height={180} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Heatmap */}
      <motion.div {...fadeUp(0.3)}>
        <Card>
          <CardHeader>
            <CardTitle>Study Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <HeatmapChart />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
