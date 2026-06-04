import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import uiReducer from './slices/uiSlice'
import sessionReducer from './slices/sessionSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    session: sessionReducer,
  },
})
