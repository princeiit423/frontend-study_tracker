import { createSlice } from '@reduxjs/toolkit'

const guestUser = {
  _id: 'guest',
  name: 'Guest Student',
  email: 'guest@acestudy.local',
  avatar: '',
  role: 'user',
  isGuest: true,
  isOnboarded: true,
  xp: 0,
  level: 1,
  totalStudyHours: 0,
  currentStreak: 0,
  longestStreak: 0,
  timezone: 'Asia/Kolkata',
  preferences: {
    dailyGoalHours: 4,
    weeklyGoalHours: 28,
    pomodoroWork: 25,
    pomodoroBreak: 5,
    restDays: [],
  },
  theme: { mode: 'dark', accent: 'blue' },
  notificationSettings: {
    studyReminder: true,
    goalReminder: true,
    examReminder: true,
    streakReminder: true,
    achievementAlerts: true,
  },
}

const isGuestSession = localStorage.getItem('guestMode') === 'true'

const initialState = {
  user: isGuestSession ? guestUser : null,
  accessToken: localStorage.getItem('accessToken'),
  isAuthenticated: isGuestSession,
  isGuest: isGuestSession,
  isLoading: true,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload
      if (user !== undefined) state.user = user
      if (accessToken !== undefined) {
        state.accessToken = accessToken
        if (accessToken) localStorage.setItem('accessToken', accessToken)
      }
      state.isGuest = false
      localStorage.removeItem('guestMode')
      state.isAuthenticated = true
      state.isLoading = false
    },
    continueAsGuest: (state) => {
      state.user = guestUser
      state.accessToken = null
      state.isAuthenticated = true
      state.isGuest = true
      state.isLoading = false
      localStorage.removeItem('accessToken')
      localStorage.setItem('guestMode', 'true')
    },
    logout: (state) => {
      state.user = null
      state.accessToken = null
      state.isAuthenticated = false
      state.isGuest = false
      state.isLoading = false
      localStorage.removeItem('accessToken')
      localStorage.removeItem('guestMode')
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
    },
  },
})

export const { setCredentials, continueAsGuest, logout, setLoading, updateUser } = authSlice.actions
export default authSlice.reducer

export const selectUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectIsLoading = (state) => state.auth.isLoading
export const selectIsGuest = (state) => state.auth.isGuest
