import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fetchMe, setInitialized } from './store/slices/authSlice'
import { fetchNotifications } from './store/slices/notificationSlice'

// Pages — Public
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TrackPage from './pages/TrackPage'

// Pages — Shared Auth
import NotificationsPage from './pages/NotificationsPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'

// Pages — Citizen
import CitizenDashboard from './pages/citizen/CitizenDashboard'
import CitizenComplaints from './pages/citizen/CitizenComplaints'
import NewComplaint from './pages/citizen/NewComplaint'

// Pages — Officer
import OfficerDashboard from './pages/officer/OfficerDashboard'
import OfficerComplaints from './pages/officer/OfficerComplaints'
import OfficerReports from './pages/officer/OfficerReports'

// Pages — Admin
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminComplaints from './pages/admin/AdminComplaints'
import OfficerManagement from './pages/admin/OfficerManagement'
import WardManagement from './pages/admin/WardManagement'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminReports from './pages/admin/AdminReports'

// Layout
import DashboardLayout from './components/layout/DashboardLayout'
import { LoadingSpinner } from './components/shared/UI'

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } })

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <LoadingSpinner size="lg" text="Loading..." />
  </div>
)

function ProtectedRoute({ children, roles }) {
  const { user, initialized } = useSelector(s => s.auth)
  if (!initialized) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) {
    const path = user.role === 'admin' ? '/admin' : user.role === 'officer' ? '/officer' : '/citizen'
    return <Navigate to={path} replace />
  }
  return children
}

function GuestRoute({ children }) {
  const { user, initialized } = useSelector(s => s.auth)
  if (!initialized) return <Spinner />
  if (user) {
    const path = user.role === 'admin' ? '/admin' : user.role === 'officer' ? '/officer' : '/citizen'
    return <Navigate to={path} replace />
  }
  return children
}

function AppInit() {
  const dispatch = useDispatch()
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      dispatch(fetchMe()).then((res) => {
        if (res.meta.requestStatus === 'fulfilled') dispatch(fetchNotifications())
      })
    } else {
      dispatch(setInitialized())
    }
  }, [dispatch])
  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInit />
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/track" element={<TrackPage />} />
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

          {/* Shared Auth */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Citizen */}
          <Route element={<ProtectedRoute roles={['citizen']}><DashboardLayout /></ProtectedRoute>}>
            <Route path="/citizen" element={<CitizenDashboard />} />
            <Route path="/citizen/complaints" element={<CitizenComplaints />} />
            <Route path="/citizen/new" element={<NewComplaint />} />
          </Route>

          {/* Officer */}
          <Route element={<ProtectedRoute roles={['officer']}><DashboardLayout /></ProtectedRoute>}>
            <Route path="/officer" element={<OfficerDashboard />} />
            <Route path="/officer/complaints" element={<OfficerComplaints />} />
            <Route path="/officer/reports" element={<OfficerReports />} />
          </Route>

          {/* Admin */}
          <Route element={<ProtectedRoute roles={['admin']}><DashboardLayout /></ProtectedRoute>}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/complaints" element={<AdminComplaints />} />
            <Route path="/admin/officers" element={<OfficerManagement />} />
            <Route path="/admin/wards" element={<WardManagement />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/reports" element={<AdminReports />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
