import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import Navbar from '../components/shared/Navbar'
import { LoadingSpinner, EmptyState, PageHeader } from '../components/shared/UI'
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, } from '../store/slices/notificationSlice'
import { notificationService } from '../services'
import { formatDateTime } from '../utils/helpers'

export default function NotificationsPage() {
  const dispatch = useDispatch()
  const { items, loading } = useSelector(s => s.notifications)
  const { user } = useSelector(s => s.auth)

  useEffect(() => { if (user) dispatch(fetchNotifications()) }, [user])

  const handleMarkRead = (id) => dispatch(markNotificationRead(id))
  const handleMarkAll = () => dispatch(markAllNotificationsRead())
  const handleDelete = async (id) => {
    try {
      await notificationService.delete(id)
      dispatch(fetchNotifications())
    } catch {}
  }

  const typeIcon = (type) => ({ complaint_submitted: '📝', status_update: '🔄', completion: '✅', admin: '🛡️', system: '🔔' }[type] || '🔔')

  return (
    <div className="min-h-screen bg-gray-50">
      {!user && <Navbar />}
      <div className={`max-w-2xl mx-auto px-4 py-6 ${!user ? 'pt-24' : ''}`}>
        <PageHeader
          title="Notifications"
          subtitle={`${items.filter(n => !n.isRead).length} unread`}
          actions={
            items.some(n => !n.isRead) && (
              <button onClick={handleMarkAll} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#D32F2F] border border-[#D32F2F] rounded-xl hover:bg-red-50">
                <CheckCheck size={15} /> Mark all read
              </button>
            )
          }
        />

        {loading ? <LoadingSpinner /> : items.length === 0 ? <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" /> : (
          <div className="space-y-3">
            {items.map((n, i) => (
              <motion.div key={n._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className={`bg-white rounded-2xl border shadow-sm p-4 cursor-pointer transition-all hover:shadow-md ${n.isRead ? 'border-gray-100' : 'border-[#D32F2F]/20 bg-red-50/30'}`}
                onClick={() => !n.isRead && handleMarkRead(n._id)}>
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">{typeIcon(n.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold ${n.isRead ? 'text-gray-700' : 'text-gray-800'}`}>{n.title}</p>
                      {!n.isRead && <div className="w-2 h-2 rounded-full bg-[#D32F2F] flex-shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(n._id) }}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                    <Trash2 size={13} className="text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
