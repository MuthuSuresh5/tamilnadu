import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Menu, X, Shield, ChevronDown, User, LogOut, Settings } from 'lucide-react'
import { logout } from '../../store/slices/authSlice'

export default function Navbar({ onMenuToggle }) {
  const { t, i18n } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector(s => s.auth)
  const { unreadCount } = useSelector(s => s.notifications)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const toggleLang = () => {
    const lang = i18n.language === 'ta' ? 'en' : 'ta'
    i18n.changeLanguage(lang)
    localStorage.setItem('lang', lang)
    document.documentElement.lang = lang
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  const dashPath = user?.role === 'admin' ? '/admin' : user?.role === 'officer' ? '/officer' : '/citizen'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-[#D32F2F] rounded-lg flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-[#D32F2F] leading-tight">TN CITIZEN</p>
            <p className="text-[10px] text-gray-500 leading-tight">Complaint System</p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link to="/" className="hover:text-[#D32F2F] transition-colors">{t('nav.home')}</Link>
          <Link to="/track" className="hover:text-[#D32F2F] transition-colors">{t('nav.track')}</Link>
          {user && <Link to={dashPath} className="hover:text-[#D32F2F] transition-colors">{t('nav.dashboard')}</Link>}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={toggleLang}
            className="px-3 py-1 text-xs font-semibold rounded-full border border-[#D32F2F] text-[#D32F2F] hover:bg-[#D32F2F] hover:text-white transition-all"
          >
            {i18n.language === 'ta' ? 'EN' : 'தமிழ்'}
          </button>

          {user ? (
            <>
              {/* Notification Bell */}
              <Link to="/notifications" className="relative p-2 hover:bg-gray-100 rounded-full">
                <Bell size={20} className="text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#D32F2F] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg"
                >
                  {user.profilePhoto
                    ? <img src={user.profilePhoto} alt="" className="w-7 h-7 rounded-full object-cover" />
                    : <div className="w-7 h-7 rounded-full bg-[#D32F2F] flex items-center justify-center text-white text-xs font-bold">{user.name?.[0]}</div>
                  }
                  <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown size={14} className="text-gray-500" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
                    >
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <User size={15} /> {t('nav.profile')}
                      </Link>
                      <Link to="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <Settings size={15} /> {t('nav.settings')}
                      </Link>
                      <hr className="border-gray-100" />
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                        <LogOut size={15} /> {t('nav.logout')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login" className="px-4 py-1.5 text-sm font-medium text-[#D32F2F] border border-[#D32F2F] rounded-lg hover:bg-red-50 transition-colors">{t('nav.login')}</Link>
              <Link to="/register" className="px-4 py-1.5 text-sm font-medium text-white bg-[#D32F2F] rounded-lg hover:bg-red-700 transition-colors">{t('nav.register')}</Link>
            </div>
          )}

          {/* Mobile menu */}
          <button onClick={onMenuToggle} className="md:hidden p-2 hover:bg-gray-100 rounded-lg">
            <Menu size={20} />
          </button>
        </div>
      </div>
    </nav>
  )
}
