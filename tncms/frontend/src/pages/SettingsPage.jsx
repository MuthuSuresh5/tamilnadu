import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Globe, Bell, Shield, Info } from 'lucide-react'
import { PageHeader } from '../components/shared/UI'

const Section = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
      <Icon size={17} className="text-[#D32F2F]" />
      <h3 className="font-bold text-gray-800">{title}</h3>
    </div>
    {children}
  </div>
)

const ToggleRow = ({ label, description, value, onChange }) => (
  <div className="flex items-center justify-between py-1">
    <div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-all duration-200 ${value ? 'bg-[#D32F2F]' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
)

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { user } = useSelector(s => s.auth)

  const [lang, setLang] = useState(i18n.language)
  const [notifSettings, setNotifSettings] = useState({
    statusUpdates: true,
    newComplaints: true,
    completions: true,
    email: false,
    sms: false,
  })

  const changeLang = (l) => {
    i18n.changeLanguage(l)
    localStorage.setItem('lang', l)
    document.documentElement.lang = l
    setLang(l)
  }

  const toggleNotif = (key) => setNotifSettings(s => ({ ...s, [key]: !s[key] }))

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title={t('nav.settings')} subtitle="Manage your preferences" />

      {/* Language */}
      <Section icon={Globe} title="Language / மொழி">
        <div className="grid grid-cols-2 gap-3">
          {[
            { code: 'ta', label: 'தமிழ்', sub: 'Tamil' },
            { code: 'en', label: 'English', sub: 'English' },
          ].map(({ code, label, sub }) => (
            <button key={code} onClick={() => changeLang(code)}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${lang === code ? 'border-[#D32F2F] bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}>
              <span className="text-2xl">{code === 'ta' ? '🇮🇳' : '🇬🇧'}</span>
              <div className="text-left">
                <p className={`text-sm font-bold ${lang === code ? 'text-[#D32F2F]' : 'text-gray-700'}`}>{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
              {lang === code && <div className="ml-auto w-2 h-2 rounded-full bg-[#D32F2F]" />}
            </button>
          ))}
        </div>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Notifications">
        <div className="space-y-3 divide-y divide-gray-50">
          <ToggleRow label="Status Updates" description="Get notified when complaint status changes"
            value={notifSettings.statusUpdates} onChange={() => toggleNotif('statusUpdates')} />
          {(user?.role === 'officer' || user?.role === 'admin') && (
            <div className="pt-3">
              <ToggleRow label="New Complaint Alerts" description="Alert when new complaints are submitted"
                value={notifSettings.newComplaints} onChange={() => toggleNotif('newComplaints')} />
            </div>
          )}
          <div className="pt-3">
            <ToggleRow label="Completion Alerts" description="Notify when complaints are resolved"
              value={notifSettings.completions} onChange={() => toggleNotif('completions')} />
          </div>
          <div className="pt-3">
            <ToggleRow label="Email Notifications" description="Receive updates via email"
              value={notifSettings.email} onChange={() => toggleNotif('email')} />
          </div>
          <div className="pt-3">
            <ToggleRow label="SMS Notifications" description="Receive SMS for critical updates"
              value={notifSettings.sms} onChange={() => toggleNotif('sms')} />
          </div>
        </div>
      </Section>

      {/* Security Info */}
      <Section icon={Shield} title="Security">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-green-700">JWT Authentication</p>
              <p className="text-xs text-green-600 mt-0.5">Your session is secured with JWT tokens</p>
            </div>
            <span className="text-green-500 text-xl">✓</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-green-700">Password Encrypted</p>
              <p className="text-xs text-green-600 mt-0.5">bcrypt with 12 salt rounds</p>
            </div>
            <span className="text-green-500 text-xl">✓</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-blue-700">Role: {user?.role?.toUpperCase()}</p>
              <p className="text-xs text-blue-600 mt-0.5">Role-based access control active</p>
            </div>
            <span className="text-blue-500 text-xl">🛡️</span>
          </div>
        </div>
      </Section>

      {/* App Info */}
      <Section icon={Info} title="About">
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-500">Application</span>
            <span className="font-semibold">TN Smart Complaint System</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-500">Version</span>
            <span className="font-semibold">1.0.0</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <span className="text-gray-500">Government</span>
            <span className="font-semibold">Tamil Nadu</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Support</span>
            <span className="font-semibold text-[#D32F2F]">1800-425-1213</span>
          </div>
        </div>
      </Section>
    </div>
  )
}
