import axios from 'axios'
import { store } from '../store'
import { logout } from '../store/slices/authSlice'

const API_URL = import.meta.env.VITE_API_URL || '/api'

let authTokenGetter = null

export const setAuthTokenGetter = (getter) => {
  authTokenGetter = getter
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (config) => {
  if (authTokenGetter) {
    const token = await authTokenGetter()
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => Promise.reject(error))

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout())
    }
    return Promise.reject(error)
  }
)

export default api

// API helpers
export const authAPI = {
  sync: () => api.post('/auth/sync'),
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
  update: (id, data) => api.put(`/subjects/${id}`),
  delete: (id) => api.delete(`/subjects/${id}`),
}

export const topicAPI = {
  getAll: (params) => api.get('/topics', { params }),
  create: (data) => api.post('/topics', data),
  update: (id, data) => api.put(`/topics/${id}`),
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
  update: (id, data) => api.put(`/goals/${id}`),
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
  update: (id, data) => api.put(`/notes/${id}`),
  delete: (id) => api.delete(`/notes/${id}`),
}

export const mockTestAPI = {
  getAll: (params) => api.get('/mock-tests', { params }),
  create: (data) => api.post('/mock-tests', data),
  update: (id, data) => api.put(`/mock-tests/${id}`),
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
