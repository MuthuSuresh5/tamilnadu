import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, CheckCircle, Clock, AlertCircle, User, MapPin, Calendar } from 'lucide-react'
import Navbar from '../components/shared/Navbar'
import { publicService } from '../services'
import { StatusBadge, PriorityBadge } from '../components/shared/UI'
import { formatDate, categoryIcon, resolveUrl } from '../utils/helpers'

const STEPS = ['submitted', 'accepted', 'processing', 'completed']

export default function TrackPage() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await publicService.trackComplaint(query.trim())
      setComplaint(res.data.data)
    } catch {
      setError('Complaint not found. Please check the ID and try again.')
      setComplaint(null)
    }
    setLoading(false)
  }

  const stepIndex = (status) => STEPS.indexOf(status)
  const currentStep = complaint ? stepIndex(complaint.status) : -1

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 max-w-3xl mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{t('track.title')}</h1>
          <p className="text-gray-500 text-sm">No login required</p>
        </motion.div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={t('track.searchPlaceholder')}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
            />
            <button onClick={handleSearch} disabled={loading}
              className="w-full sm:w-auto px-6 py-3 bg-[#D32F2F] text-white font-semibold rounded-xl hover:bg-red-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              <Search size={16} /> {loading ? 'Searching...' : t('track.search')}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        </div>

        <AnimatePresence>
          {complaint && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* Main Card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-lg flex-shrink-0">{categoryIcon(complaint.category)}</span>
                      <h2 className="text-base md:text-lg font-bold text-gray-800 break-words">{complaint.title}</h2>
                    </div>
                    <p className="text-[#D32F2F] font-mono font-semibold text-xs md:text-sm">{complaint.complaintId}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={complaint.status} />
                    <PriorityBadge priority={complaint.priority} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-5">
                  {[
                    { icon: User, label: t('track.officer'), value: complaint.assignedOfficerName || 'Not assigned' },
                    { icon: MapPin, label: t('track.ward'), value: `Ward ${complaint.wardNumber}` },
                    { icon: Calendar, label: t('track.submitted'), value: formatDate(complaint.submittedDate) },
                    { icon: Clock, label: t('track.expected'), value: formatDate(complaint.expectedCompletionDate) },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon size={12} className="text-gray-400" />
                        <p className="text-xs text-gray-400">{label}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-700 break-words">{value}</p>
                    </div>
                  ))}
                </div>

                {complaint.description && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-xs text-gray-400 mb-1">Description</p>
                    <p className="text-sm text-gray-700">{complaint.description}</p>
                  </div>
                )}

                {complaint.remarks && (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                    <p className="text-xs text-yellow-600 font-semibold mb-1">Officer Remarks</p>
                    <p className="text-sm text-gray-700">{complaint.remarks}</p>
                  </div>
                )}
              </div>

              {/* Progress Stepper */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">
                <h3 className="text-sm font-bold text-gray-700 mb-6">{t('track.timeline')}</h3>
                <div className="relative">
                  <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200" />
                  <div
                    className="absolute top-5 left-5 h-0.5 bg-[#D32F2F] transition-all duration-700"
                    style={{ width: complaint.status === 'rejected' ? '0%' : `${(Math.max(0, currentStep) / (STEPS.length - 1)) * 100}%` }}
                  />
                  <div className="relative grid grid-cols-4 gap-1 md:gap-2">
                    {STEPS.map((step, i) => {
                      const done = currentStep >= i && complaint.status !== 'rejected'
                      const active = currentStep === i
                      return (
                        <div key={step} className="flex flex-col items-center gap-2">
                          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all z-10 ${done ? 'bg-[#D32F2F] border-[#D32F2F]' : 'bg-white border-gray-200'}`}>
                            {done ? <CheckCircle size={16} className="text-white md:w-[18px] md:h-[18px]" /> : <Clock size={16} className="text-gray-300 md:w-[18px] md:h-[18px]" />}
                          </div>
                          <p className={`text-[10px] md:text-xs font-medium text-center capitalize leading-tight ${done ? 'text-[#D32F2F]' : 'text-gray-400'}`}>{t(`status.${step}`)}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {complaint.status === 'rejected' && (
                  <div className="mt-4 p-3 bg-red-50 rounded-xl flex items-center gap-2 text-xs md:text-sm text-red-600">
                    <AlertCircle size={16} /> Complaint has been rejected
                  </div>
                )}
              </div>

              {/* Timeline Events */}
              {complaint.timeline?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-sm font-bold text-gray-700 mb-4">Activity Log</h3>
                  <div className="space-y-3">
                    {complaint.timeline.map((ev, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#D32F2F] mt-1.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-700 font-medium capitalize">{ev.status}</p>
                          <p className="text-xs text-gray-400">{ev.message} · {formatDate(ev.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Complaint Photos */}
              {complaint.images?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-sm font-bold text-gray-700 mb-4">Complaint Photos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {complaint.images.map((src, i) => (
                      <a key={i} href={resolveUrl(src)} target="_blank" rel="noreferrer">
                        <img src={resolveUrl(src)} alt="" className="w-full h-32 object-cover rounded-xl border border-gray-100 hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Completion Photos */}
              {complaint.completionPhotos?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-sm font-bold text-gray-700 mb-4">Completion Photos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {complaint.completionPhotos.map((src, i) => (
                      <a key={i} href={resolveUrl(src)} target="_blank" rel="noreferrer">
                        <img src={resolveUrl(src)} alt="" className="w-full h-32 object-cover rounded-xl border border-gray-100 hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
