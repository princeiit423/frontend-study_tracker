import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  isAuthenticated: false,
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
      state.isAuthenticated = true
      state.isLoading = false
    },
    logout: (state) => {
      state.user = null
      state.accessToken = null
      state.isAuthenticated = false
      state.isLoading = false
      localStorage.removeItem('accessToken')
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
    },
  },
})

export const { setCredentials, logout, setLoading, updateUser } = authSlice.actions
export default authSlice.reducer

export const selectUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectIsLoading = (state) => state.auth.isLoading
