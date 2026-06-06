import axios from 'axios'
import { store } from '../store'
import { setCredentials, logout } from '../store/slices/authSlice'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

let activeApiRequests = 0
let lastUserLoaderActionAt = 0
const USER_ACTION_LOADER_WINDOW_MS = 1400

const markUserLoaderAction = () => {
  lastUserLoaderActionAt = Date.now()
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', (event) => {
    const target = event.target
    if (target?.closest?.('button, a, [role="button"], [data-api-loader-trigger]')) {
      markUserLoaderAction()
    }
  }, true)

  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    const target = event.target
    if (target?.closest?.('button, a, [role="button"], form, [data-api-loader-trigger]')) {
      markUserLoaderAction()
    }
  }, true)

  window.addEventListener('submit', markUserLoaderAction, true)
}

const emitApiLoading = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('acestudy:api-loading', {
    detail: { pending: activeApiRequests },
  }))
}

const shouldUseGlobalLoader = (config) => {
  if (config?.skipGlobalLoader) return
  return Date.now() - lastUserLoaderActionAt <= USER_ACTION_LOADER_WINDOW_MS
}

const startApiLoading = (config) => {
  if (!shouldUseGlobalLoader(config)) return
  activeApiRequests += 1
  config.__usesGlobalLoader = true
  emitApiLoading()
}

const stopApiLoading = (config) => {
  if (!config?.__usesGlobalLoader) return
  activeApiRequests = Math.max(0, activeApiRequests - 1)
  emitApiLoading()
}

const guestResponse = (config, data, message = 'Guest preview data') => Promise.resolve({
  data: { success: true, data, message },
  status: 200,
  statusText: 'OK',
  headers: {},
  config,
})

const emptyPagination = { total: 0, page: 1, limit: 20, pages: 0 }

const guestId = () => `guest-${Date.now()}`
const requestBody = (config) => {
  if (!config.data) return {}
  if (typeof config.data === 'string') {
    try { return JSON.parse(config.data) } catch { return {} }
  }
  return config.data
}

const getGuestData = (config) => {
  const method = (config.method || 'get').toLowerCase()
  const url = config.url || ''
  const isWrite = method !== 'get'
  const body = requestBody(config)

  if (url.includes('/auth/logout')) return {}
  if (url.includes('/auth/me')) return { user: store.getState().auth.user }
  if (url.includes('/analytics/dashboard')) {
    return {
      stats: {
        today: { hours: 0, sessions: 0, goal: 4, progress: 0 },
        week: { hours: 0, sessions: 0, goal: 28, progress: 0 },
        month: { hours: 0, sessions: 0 },
        year: { hours: 0, sessions: 0 },
        total: { hours: 0, sessions: 0 },
        streak: { current: 0, longest: 0 },
        gamification: { xp: 0, level: 1 },
      },
    }
  }
  if (url.includes('/analytics/heatmap')) return { heatmap: [], year: new Date().getFullYear() }
  if (url.includes('/analytics/subjects')) return { distribution: [] }
  if (url.includes('/analytics/weekly')) return { chart: [] }
  if (url.includes('/analytics/daily')) return { chart: [] }
  if (url.includes('/analytics/insights')) {
    return {
      mostProductiveDay: { day: 'Mon', hours: 0, count: 0 },
      mostProductiveHour: { hour: undefined, hours: 0, count: 0 },
      avgFocusScore: 0,
      avgSessionLengthMinutes: 0,
      totalSessions: 0,
    }
  }
  if (url.includes('/sessions/active')) return { session: null }
  if (url.includes('/sessions')) {
    return isWrite
      ? {
          session: {
            _id: guestId(),
            title: body.title || 'Guest study session',
            subject: null,
            topic: null,
            exam: null,
            startTime: new Date().toISOString(),
            totalPausedTime: 0,
            isActive: true,
            isPaused: false,
            mode: body.mode || 'standard',
            duration: 0,
            xpEarned: 0,
          },
          xpEarned: 0,
        }
      : { sessions: [], pagination: emptyPagination }
  }
  if (url.includes('/subjects')) {
    return isWrite
      ? { subject: { _id: guestId(), name: body.name || 'Guest Subject', color: body.color || '#3b82f6', priority: body.priority || 'medium', goalHours: body.goalHours || 0, totalStudyHours: 0, completionPercentage: 0, exam: null } }
      : { subjects: [] }
  }
  if (url.includes('/topics')) {
    return isWrite
      ? { topic: { _id: guestId(), name: body.name || 'Guest Topic', subject: body.subjectId || body.subject || null, isCompleted: false, priority: body.priority || 'medium', difficulty: body.difficulty || 'medium' } }
      : { topics: [] }
  }
  if (url.includes('/exams')) {
    return isWrite
      ? { exam: { _id: guestId(), name: body.name || 'Guest Exam', examDate: body.examDate || new Date().toISOString(), category: body.category || '', subjects: [], readinessScore: 0 }, prediction: {} }
      : { exams: [] }
  }
  if (url.includes('/goals/sync')) return { goals: [] }
  if (url.includes('/goals')) return isWrite ? { goal: { _id: guestId(), title: body.title || 'Guest Goal', targetValue: body.targetValue || 1, currentValue: 0, unit: body.unit || '', isCompleted: false, isActive: true } } : { goals: [] }
  if (url.includes('/notes')) return isWrite ? { note: { _id: guestId(), title: body.title || 'Guest Note', content: body.content || '', createdAt: new Date().toISOString() } } : { notes: [], pagination: emptyPagination }
  if (url.includes('/mock-tests')) return isWrite ? { test: { _id: guestId(), name: body.name || 'Guest Mock Test', score: body.score || 0, maxScore: body.maxScore || 0 } } : { tests: [], trends: [] }
  if (url.includes('/notifications')) return isWrite ? {} : { notifications: [], unreadCount: 0, pagination: emptyPagination }
  if (url.includes('/achievements')) return { achievements: [], unlocked: [] }
  if (url.includes('/leaderboard')) return { leaderboard: [] }
  if (url.includes('/tasks')) return isWrite ? { task: { _id: guestId(), title: body.title || 'Guest Task', date: body.date || new Date().toISOString().split('T')[0], priority: body.priority || 'medium', isCompleted: false } } : { tasks: [] }
  if (url.includes('/calendar')) return isWrite ? { event: { _id: guestId(), title: body.title || 'Guest Event', date: body.date || new Date().toISOString().split('T')[0], type: body.type || 'event', color: body.color || '#3b82f6' } } : { events: [] }
  if (url.includes('/study-plans')) return isWrite ? { plan: { _id: guestId(), title: body.title || 'Guest Study Plan', days: [] } } : { plans: [] }
  if (url.includes('/revisions')) return isWrite ? { revision: { _id: guestId(), subject: body.subject || null, schedule: [] } } : { revisions: [] }
  if (url.includes('/coach/weakness')) return { weakTopics: [], openMistakes: [] }
  if (url.includes('/coach/queue')) return { queue: [] }
  if (url.includes('/coach/weekly-report')) return { recommendation: 'Explore the app, then create an account to save your plan.', hours: 0, sessions: 0 }
  if (url.includes('/coach')) return {}
  if (url.includes('/motivation')) return isWrite ? { item: { _id: guestId(), title: body.title || 'Guest Motivation', body: body.body || '', type: body.type || 'reason' } } : { items: [] }
  if (url.includes('/mistakes')) return isWrite ? { mistake: { _id: guestId(), mistake: body.mistake || 'Guest mistake', reason: body.reason || 'other', isResolved: false } } : { mistakes: [], trends: [] }
  if (url.includes('/users/stats')) return { stats: {} }
  if (url.includes('/users/export')) return { export: {}, guest: true }
  if (url.includes('/users')) return { user: store.getState().auth.user }
  if (url.includes('/admin')) return { counts: {}, recentUsers: [], users: [] }
  return {}
}

api.interceptors.request.use((config) => {
  startApiLoading(config)
  const state = store.getState()
  if (state.auth.isGuest) {
    config.adapter = () => guestResponse(config, getGuestData(config))
    return config
  }

  const token = state.auth.accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
}, (error) => {
  stopApiLoading(error.config)
  return Promise.reject(error)
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) promise.reject(error)
    else promise.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => {
    stopApiLoading(response.config)
    return response
  },
  async (error) => {
    const originalRequest = error.config
    stopApiLoading(originalRequest)

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/logout')
      ) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
        const { accessToken } = data.data
        store.dispatch(setCredentials({ accessToken }))
        processQueue(null, accessToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        store.dispatch(logout())
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api

// API helpers
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: () => api.post('/auth/refresh'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
}

export const userAPI = {
  onboard: (data) => api.post('/users/onboard', data),
  updateProfile: (data) => api.put('/users/profile', data),
  getStats: () => api.get('/users/stats'),
  changePassword: (data) => api.put('/users/password', data),
  exportData: () => api.get('/users/export'),
  deleteAccount: () => api.delete('/users/account'),
}

export const examAPI = {
  getAll: () => api.get('/exams'),
  create: (data) => api.post('/exams', data),
  getOne: (id) => api.get(`/exams/${id}`),
  update: (id, data) => api.put(`/exams/${id}`, data),
  delete: (id) => api.delete(`/exams/${id}`),
  getReadiness: (id) => api.get(`/exams/${id}/readiness`),
}

export const subjectAPI = {
  getAll: (params) => api.get('/subjects', { params }),
  create: (data) => api.post('/subjects', data),
  getOne: (id) => api.get(`/subjects/${id}`),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
}

export const topicAPI = {
  getAll: (params) => api.get('/topics', { params }),
  create: (data) => api.post('/topics', data),
  update: (id, data) => api.put(`/topics/${id}`, data),
  delete: (id) => api.delete(`/topics/${id}`),
  bulkUpdate: (updates) => api.put('/topics/bulk', { updates }),
}

export const sessionAPI = {
  getAll: (params) => api.get('/sessions', { params }),
  start: (data) => api.post('/sessions', data),
  pause: (id) => api.post(`/sessions/${id}/pause`),
  resume: (id) => api.post(`/sessions/${id}/resume`),
  stop: (id, data) => api.post(`/sessions/${id}/stop`, data),
  addManual: (data) => api.post('/sessions/manual', data),
  getActive: () => api.get('/sessions/active'),
  delete: (id) => api.delete(`/sessions/${id}`),
}

export const goalAPI = {
  getAll: (params) => api.get('/goals', { params }),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
  sync: () => api.post('/goals/sync'),
}

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getHeatmap: (year) => api.get('/analytics/heatmap', { params: { year } }),
  getSubjects: (period) => api.get('/analytics/subjects', { params: { period } }),
  getWeekly: (weeks) => api.get('/analytics/weekly', { params: { weeks } }),
  getDaily: (days) => api.get('/analytics/daily', { params: { days } }),
  getInsights: () => api.get('/analytics/insights'),
}

export const noteAPI = {
  getAll: (params) => api.get('/notes', { params }),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
}

export const mockTestAPI = {
  getAll: (params) => api.get('/mock-tests', { params }),
  create: (data) => api.post('/mock-tests', data),
  update: (id, data) => api.put(`/mock-tests/${id}`, data),
  delete: (id) => api.delete(`/mock-tests/${id}`),
  getTrends: (params) => api.get('/mock-tests/trends', { params }),
}

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (ids) => api.post('/notifications/read', { ids }),
  delete: (id) => api.delete(`/notifications/${id}`),
}

export const achievementAPI = {
  getAll: () => api.get('/achievements'),
}

export const leaderboardAPI = {
  get: (params) => api.get('/leaderboard', { params }),
}

export const taskAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
}

export const studyPlanAPI = {
  getAll: () => api.get('/study-plans'),
  generate: (data) => api.post('/study-plans', data),
  updateDay: (planId, dayId, data) => api.put(`/study-plans/${planId}/days/${dayId}`, data),
  delete: (id) => api.delete(`/study-plans/${id}`),
}

export const revisionAPI = {
  getAll: () => api.get('/revisions'),
  create: (data) => api.post('/revisions', data),
  updateSlot: (revisionId, slotId, data) => api.put(`/revisions/${revisionId}/slots/${slotId}`, data),
  delete: (id) => api.delete(`/revisions/${id}`),
}

export const calendarAPI = {
  getEvents: (params) => api.get('/calendar', { params }),
  createEvent: (data) => api.post('/calendar', data),
  deleteEvent: (id) => api.delete(`/calendar/${id}`),
}

export const adminAPI = {
  overview: () => api.get('/admin/overview'),
  users: () => api.get('/admin/users'),
}

export const mistakeAPI = {
  getAll: (params) => api.get('/mistakes', { params }),
  create: (data) => api.post('/mistakes', data),
  update: (id, data) => api.put(`/mistakes/${id}`, data),
  delete: (id) => api.delete(`/mistakes/${id}`),
}

export const motivationAPI = {
  getAll: () => api.get('/motivation'),
  create: (data) => api.post('/motivation', data),
  update: (id, data) => api.put(`/motivation/${id}`, data),
  delete: (id) => api.delete(`/motivation/${id}`),
}

export const coachAPI = {
  weakness: () => api.get('/coach/weakness'),
  queue: () => api.get('/coach/queue'),
  weeklyReport: () => api.get('/coach/weekly-report'),
  quickCapture: (data) => api.post('/coach/quick-capture', data),
  importSyllabus: (data) => api.post('/coach/import-syllabus', data),
}
