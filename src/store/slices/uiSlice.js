import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  theme: 'dark',
  sidebarOpen: true,
  sidebarCollapsed: false,
  activeModal: null,
  toasts: [],
  focusMode: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action) => { state.theme = action.payload },
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen },
    setSidebarCollapsed: (state, action) => { state.sidebarCollapsed = action.payload },
    openModal: (state, action) => { state.activeModal = action.payload },
    closeModal: (state) => { state.activeModal = null },
    addToast: (state, action) => { state.toasts.push({ id: Date.now(), ...action.payload }) },
    removeToast: (state, action) => { state.toasts = state.toasts.filter(t => t.id !== action.payload) },
    setFocusMode: (state, action) => { state.focusMode = action.payload },
  },
})

export const { setTheme, toggleSidebar, setSidebarCollapsed, openModal, closeModal, addToast, removeToast, setFocusMode } = uiSlice.actions
export default uiSlice.reducer
