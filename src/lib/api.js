import axios from 'axios'
import { store } from '../store'
import { setCredentials, logout } from '../store/slices/authSlice'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
}, (error) => Promise.reject(error))

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => { if (error) prom.reject(error); else prom.resolve(token) })
  failedQueue = []
}

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }).catch(err => Promise.reject(err))
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
  googleAuth: (credential) => api.post('/auth/google', { credential }),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
}

export const userAPI = {
  onboard: (data) => api.post('/users/onboard', data),
  updateProfile: (data) => api.put('/users/profile', data),
  getStats: () => api.get('/users/stats'),
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
