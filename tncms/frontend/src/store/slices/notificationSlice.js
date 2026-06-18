import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { notificationService } from '../../services'

export const fetchNotifications = createAsyncThunk('notifications/fetch', async () => {
  const res = await notificationService.getAll()
  return res.data
})

export const markNotificationRead = createAsyncThunk('notifications/markRead', async (id) => {
  await notificationService.markRead(id)
  return id
})

export const markAllNotificationsRead = createAsyncThunk('notifications/markAllRead', async () => {
  await notificationService.markAllRead()
})

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], unreadCount: 0, loading: false },
  reducers: {
    addNotification(state, action) {
      state.items.unshift(action.payload)
      state.unreadCount += 1
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.data
        state.unreadCount = action.payload.unreadCount
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const n = state.items.find(i => i._id === action.payload)
        if (n && !n.isRead) { n.isRead = true; state.unreadCount = Math.max(0, state.unreadCount - 1) }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach(i => { i.isRead = true })
        state.unreadCount = 0
      })
  },
})

export const { addNotification } = notificationSlice.actions
export default notificationSlice.reducer
