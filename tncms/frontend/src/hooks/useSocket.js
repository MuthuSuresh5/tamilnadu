import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useDispatch } from 'react-redux'
import { addNotification } from '../store/slices/notificationSlice'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? '' : 'http://localhost:5000')

export const useSocket = (user) => {
  const socketRef = useRef(null)
  const dispatch = useDispatch()

  useEffect(() => {
    if (!user) return

    try {
      socketRef.current = io(SOCKET_URL, {
        transports: ['polling', 'websocket'],
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        timeout: 10000,
        path: '/socket.io',
      })

      const socket = socketRef.current

      socket.on('connect', () => {
        socket.emit('join_room', user._id)
        if (user.role === 'admin') socket.emit('join_admin')
        if (user.role === 'officer') socket.emit('join_ward', user.wardNumber)
      })

      socket.on('connect_error', () => {
        // Silent fail — socket is optional, app works without it
      })

      socket.on('status_update', (data) => {
        dispatch(addNotification({
          _id: Date.now().toString(),
          title: 'Status Update',
          message: `Complaint ${data.complaintId} is now ${data.status}`,
          type: 'status_update',
          isRead: false,
          createdAt: new Date().toISOString(),
        }))
      })

      socket.on('new_complaint', (data) => {
        dispatch(addNotification({
          _id: Date.now().toString(),
          title: 'New Complaint',
          message: `New complaint ${data.complaintId} in Ward ${data.wardNumber}`,
          type: 'complaint_submitted',
          isRead: false,
          createdAt: new Date().toISOString(),
        }))
      })
    } catch {
      // Socket connection failed silently
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [user?._id, dispatch])

  return socketRef.current
}
