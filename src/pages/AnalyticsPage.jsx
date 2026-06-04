import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BarChart2, Clock, Zap, TrendingUp } from 'lucide-react'
import { analyticsAPI } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import HeatmapChart from '../components/analytics/HeatmapChart'
import DailyChart from '../components/analytics/DailyChart'
import WeeklyChart from '../components/analytics/WeeklyChart'
import SubjectDistributionChart from '../components/analytics/SubjectDistributionChart'
import { formatHours } from '../lib/utils'

export default function AnalyticsPage() {
  const { data: insights } = useQuery({ queryKey: ['insights'], queryFn: () => analyticsAPI.getInsights(), select: d => d.data.data })
  const { data: stats } = useQuery({ queryKey: ['dashboard-stats'], queryFn: () => analyticsAPI.getDashboard(), select: d => d.data.data.stats })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Detailed insights into your study patterns</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Hours', value: formatHours(stats?.total?.hours || 0), icon: Clock },
          { label: 'Total Sessions', value: stats?.total?.sessions || 0, icon: BarChart2 },
          { label: 'Avg Focus Score', value: `${insights?.avgFocusScore || 0}/10`, icon: Zap },
          { label: 'Avg Session Length', value: `${insights?.avgSessionLengthMinutes || 0}m`, icon: TrendingUp },
        ].map(({ label, value, icon: Icon }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
                  <Icon size={15} className="text-primary" />
                </div>
                <p className="text-2xl font-bold">{value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Productivity insights */}
      {insights && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Most Productive Day</p>
              <p className="text-2xl font-bold">{insights.mostProductiveDay?.day}</p>
              <p className="text-sm text-muted-foreground mt-1">{formatHours(insights.mostProductiveDay?.hours || 0)} on average</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Most Productive Hour</p>
              <p className="text-2xl font-bold">
                {insights.mostProductiveHour?.hour !== undefined ? `${insights.mostProductiveHour.hour}:00 – ${insights.mostProductiveHour.hour + 1}:00` : '—'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{formatHours(insights.mostProductiveHour?.hours || 0)} on average</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
        </TabsList>
        <TabsContent value="daily" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Daily Study Hours (30 days)</CardTitle></CardHeader>
            <CardContent><DailyChart days={30} height={240} /></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="weekly" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Weekly Study Hours (12 weeks)</CardTitle></CardHeader>
            <CardContent><WeeklyChart weeks={12} height={240} /></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="subjects" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Subject Distribution (30 days)</CardTitle></CardHeader>
            <CardContent><SubjectDistributionChart height={300} /></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="heatmap" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Study Heatmap {new Date().getFullYear()}</CardTitle></CardHeader>
            <CardContent><HeatmapChart streak={stats?.streak} /></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
