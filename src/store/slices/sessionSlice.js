import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  activeSession: null,
  elapsedSeconds: 0,
  isRunning: false,
  isPaused: false,
}

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setActiveSession: (state, action) => { state.activeSession = action.payload },
    clearActiveSession: (state) => { state.activeSession = null; state.elapsedSeconds = 0; state.isRunning = false; state.isPaused = false },
    setElapsedSeconds: (state, action) => { state.elapsedSeconds = action.payload },
    incrementElapsed: (state) => { state.elapsedSeconds += 1 },
    setRunning: (state, action) => { state.isRunning = action.payload },
    setPaused: (state, action) => { state.isPaused = action.payload },
  },
})

export const { setActiveSession, clearActiveSession, setElapsedSeconds, incrementElapsed, setRunning, setPaused } = sessionSlice.actions
export default sessionSlice.reducer
