import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { authAPI } from './lib/api'
import { setCredentials, logout, selectIsAuthenticated, selectIsLoading, selectUser, selectIsGuest, setLoading } from './store/slices/authSlice'

// Pages
import LoginPage from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import SubjectsPage from './pages/SubjectsPage'
import TopicsPage from './pages/TopicsPage'
import SessionsPage from './pages/SessionsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import GoalsPage from './pages/GoalsPage'
import NotesPage from './pages/NotesPage'
import MockTestsPage from './pages/MockTestsPage'
import ExamsPage from './pages/ExamsPage'
import AchievementsPage from './pages/AchievementsPage'
import LeaderboardPage from './pages/LeaderboardPage'
import SettingsPage from './pages/SettingsPage'
import FocusPage from './pages/FocusPage'
import LegalPage from './pages/LegalPage'
import TasksPage from './pages/TasksPage'
import CalendarPage from './pages/CalendarPage'
import StudyPlanPage from './pages/StudyPlanPage'
import RevisionPage from './pages/RevisionPage'
import AdminPage from './pages/AdminPage'
import StudyCoachPage from './pages/StudyCoachPage'

import AppLayout from './components/layout/AppLayout'
import SplashScreen from './components/auth/SplashScreen'

function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isLoading = useSelector(selectIsLoading)
  if (isLoading) return <SplashScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function OnboardingGuard({ children }) {
  const user = useSelector(selectUser)
  const isLoading = useSelector(selectIsLoading)
  if (isLoading) return <SplashScreen />
  if (user?.isGuest) return children
  if (user && !user.isOnboarded) return <Navigate to="/onboarding" replace />
  return children
}

const ACCENT_MAP = {
  blue: '199 89% 62%',
  purple: '270 91% 72%',
  green: '152 76% 55%',
  orange: '35 94% 58%',
  pink: '326 86% 68%',
  cyan: '176 84% 54%',
}

export default function App() {
  const dispatch = useDispatch()
  const isLoading = useSelector(selectIsLoading)
  const isGuest = useSelector(selectIsGuest)

  useEffect(() => {
    const initAuth = async () => {
      if (isGuest) {
        dispatch(setLoading(false))
        return
      }

      try {
        const { data } = await authAPI.getMe()
        dispatch(setCredentials({ user: data.data.user }))
      } catch {
        try {
          const { data } = await authAPI.refresh()
          dispatch(setCredentials({ accessToken: data.data.accessToken }))
          const meRes = await authAPI.getMe()
          dispatch(setCredentials({ user: meRes.data.data.user }))
        } catch {
          dispatch(logout())
        }
      }
    }

    initAuth()
  }, [dispatch, isGuest])

  const user = useSelector(selectUser)
  useEffect(() => {
    const root = document.documentElement
    const mode = user?.theme?.mode || 'dark'
    const accent = user?.theme?.accent || 'blue'
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldUseDark = mode === 'dark' || (mode === 'system' && prefersDark)

    root.classList.toggle('dark', shouldUseDark)
    root.style.setProperty('--primary', ACCENT_MAP[accent] || ACCENT_MAP.blue)
    root.style.setProperty('--ring', ACCENT_MAP[accent] || ACCENT_MAP.blue)
    root.style.setProperty('color-scheme', shouldUseDark ? 'dark' : 'light')

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (mode === 'system') {
        root.classList.toggle('dark', media.matches)
        root.style.setProperty('color-scheme', media.matches ? 'dark' : 'light')
      }
    }

    media.addEventListener?.('change', handleChange)
    return () => media.removeEventListener?.('change', handleChange)
  }, [user?.theme])

  if (isLoading) return <SplashScreen />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/privacy-policy" element={<LegalPage type="privacy" />} />
        <Route path="/terms-of-service" element={<LegalPage type="terms" />} />
        <Route path="/onboarding" element={
          <ProtectedRoute><OnboardingPage /></ProtectedRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <OnboardingGuard>
              <AppLayout />
            </OnboardingGuard>
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="coach" element={<StudyCoachPage />} />
          <Route path="exams" element={<ExamsPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="subjects/:id/topics" element={<TopicsPage />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="mock-tests" element={<MockTestsPage />} />
          <Route path="achievements" element={<AchievementsPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="study-plan" element={<StudyPlanPage />} />
          <Route path="revisions" element={<RevisionPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="/focus" element={
          <ProtectedRoute><OnboardingGuard><FocusPage /></OnboardingGuard></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
