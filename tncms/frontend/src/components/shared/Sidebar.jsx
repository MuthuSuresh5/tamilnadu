import { NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, FileText, Bell, User, LogOut, Settings, BarChart,
  Shield, Users, MapPin, Plus, Eye, X
} from 'lucide-react'
import { logout } from '../../store/slices/authSlice'
import { useNavigate } from 'react-router-dom'

const citizenLinks = [
  { to: '/citizen', icon: Home, label: 'nav.dashboard' },
  { to: '/citizen/complaints', icon: FileText, label: 'nav.complaints' },
  { to: '/citizen/new', icon: Plus, label: 'dashboard.newComplaint' },
  { to: '/notifications', icon: Bell, label: 'nav.notifications' },
  { to: '/profile', icon: User, label: 'nav.profile' },
]

const officerLinks = [
  { to: '/officer', icon: Home, label: 'nav.dashboard' },
  { to: '/officer/complaints', icon: FileText, label: 'nav.complaints' },
  { to: '/officer/reports', icon: BarChart, label: 'Reports' },
  { to: '/notifications', icon: Bell, label: 'nav.notifications' },
  { to: '/profile', icon: User, label: 'nav.profile' },
]

const adminLinks = [
  { to: '/admin', icon: Home, label: 'nav.dashboard' },
  { to: '/admin/complaints', icon: FileText, label: 'nav.complaints' },
  { to: '/admin/officers', icon: Users, label: 'Officers' },
  { to: '/admin/wards', icon: MapPin, label: 'Wards' },
  { to: '/admin/analytics', icon: BarChart, label: 'Analytics' },
  { to: '/admin/reports', icon: Eye, label: 'Reports' },
  { to: '/notifications', icon: Bell, label: 'nav.notifications' },
  { to: '/profile', icon: User, label: 'nav.profile' },
  { to: '/settings', icon: Settings, label: 'nav.settings' },
]

export default function Sidebar({ isOpen, onClose }) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector(s => s.auth)

  const links = user?.role === 'admin' ? adminLinks : user?.role === 'officer' ? officerLinks : citizenLinks

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
    onClose?.()
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#D32F2F] rounded-lg flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#D32F2F]">TVK CITIZEN</p>
            <p className="text-[9px] text-gray-400 capitalize">{user?.role} Portal</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-gray-100 rounded"><X size={16} /></button>
        )}
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {user?.profilePhoto
            ? <img src={user.profilePhoto} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-[#D32F2F]" />
            : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D32F2F] to-red-400 flex items-center justify-center text-white font-bold">{user?.name?.[0]}</div>
          }
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">
              {user?.role === 'admin' && user?.designation
                ? user.designation
                : user?.citizenId || `Ward ${user?.wardNumber}`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to.split('/').length <= 2}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive ? 'bg-[#D32F2F] text-white shadow-sm' : 'text-gray-600 hover:bg-red-50 hover:text-[#D32F2F]'
              }`
            }
          >
            <Icon size={17} />
            <span>{t(label, label)}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut size={17} /> {t('nav.logout')}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-60 flex-shrink-0 h-[calc(100vh-4rem)] sticky top-0">{sidebarContent}</div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-64 z-50 lg:hidden shadow-xl"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
