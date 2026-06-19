import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useInView, animate, useAnimationControls } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Shield, MapPin, CheckCircle, Clock, Camera, Phone, User } from 'lucide-react'
import Navbar from '../components/shared/Navbar'
import { publicService, complaintService } from '../services'
import { categoryIcon, formatDate, resolveUrl } from '../utils/helpers'

function CountUp({ to, duration = 2 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView) return
    const controls = animate(0, to, { duration, onUpdate: (v) => { if (ref.current) ref.current.textContent = Math.round(v).toLocaleString('en-IN') } })
    return controls.stop
  }, [inView, to])
  return <span ref={ref}>0</span>
}

const CATEGORIES = ['road', 'water', 'electricity', 'sanitation', 'drainage', 'streetlight', 'garbage', 'park', 'other']
const PRIORITIES = ['low', 'medium', 'high', 'urgent']

export default function LandingPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState({ total: 0, completed: 0, totalWards: 0, totalOfficers: 0 })
  const [feed, setFeed] = useState([])
  const [team, setTeam] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [successData, setSuccessData] = useState(null)
  const [previews, setPreviews] = useState([])
  const formRef = useRef(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    publicService.getDashboardStats().then(r => setStats(r.data.data)).catch(() => {})
    publicService.getCompletedFeed().then(r => setFeed(r.data.data || [])).catch(() => {})
    publicService.getPublicTeam().then(r => setTeam(r.data.data || [])).catch(() => {})
  }, [])

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => {
        if (k === 'images') return
        if (v !== undefined && v !== null && v !== '') fd.append(k, v)
      })
      if (data.images?.[0]) Array.from(data.images).forEach(f => fd.append('images', f))
      const res = await complaintService.submit(fd)
      setSuccessData(res.data.data)
      reset()
      setPreviews([])
    } catch (e) {
      alert(e.response?.data?.message || 'Submission failed')
    }
    setSubmitting(false)
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-16 mt-16 overflow-hidden bg-gradient-to-br from-[#D32F2F] via-red-700 to-red-900 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative max-w-6xl mx-auto px-4 py-20 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Shield size={14} /> Tamilaga Vettri Kazhagam Official Portal
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">{t('hero.headline')}</h1>
            <p className="text-lg md:text-xl text-red-100 mb-8 max-w-2xl mx-auto">{t('hero.subheadline')}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-3.5 bg-[#FFC107] text-gray-900 font-bold rounded-xl hover:bg-yellow-400 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {t('hero.submitBtn')}
              </button>
              <Link
                to="/track"
                className="px-8 py-3.5 bg-white/20 backdrop-blur text-white font-semibold rounded-xl border border-white/30 hover:bg-white/30 transition-all"
              >
                {t('hero.trackBtn')}
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Stats Bar */}
        <div className="relative bg-black/20 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t('hero.stats.complaints'), value: stats.total },
              { label: t('hero.stats.resolved'), value: stats.completed },
              { label: t('hero.stats.wards'), value: stats.totalWards },
              { label: t('hero.stats.officers'), value: stats.totalOfficers },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold"><CountUp to={value} /></p>
                <p className="text-red-200 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Marquee */}
      {team.length > 0 && (() => {
        const admins = team.filter(m => m.role === 'admin')
        const officers = [...team.filter(m => m.role === 'officer')].sort((a, b) => (a.wardNumber || 0) - (b.wardNumber || 0))
        const MemberCard = ({ m, accent }) => (
          <div className={`flex-shrink-0 w-52 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center text-center gap-3`}>
            <div className={`relative`}>
              <div className={`w-20 h-20 rounded-full ring-4 ${accent === 'admin' ? 'ring-[#D32F2F]/20' : 'ring-blue-100'} overflow-hidden shadow-md`}>
                {m.profilePhoto
                  ? <img src={resolveUrl(m.profilePhoto)} alt={m.name} className="w-full h-full object-cover" />
                  : <div className={`w-full h-full flex items-center justify-center text-2xl font-bold text-white ${accent === 'admin' ? 'bg-gradient-to-br from-[#D32F2F] to-red-400' : 'bg-gradient-to-br from-blue-500 to-blue-400'}`}>
                      {m.name?.[0]}
                    </div>
                }
              </div>
              <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${accent === 'admin' ? 'bg-[#D32F2F]' : 'bg-blue-500'}`}>
                <Shield size={9} className="text-white" />
              </span>
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm truncate w-40">{m.name}</p>
              <p className={`text-xs font-semibold mt-0.5 ${accent === 'admin' ? 'text-[#D32F2F]' : 'text-blue-500'}`}>
                {m.designation || (m.role === 'admin' ? 'Admin' : 'Ward Officer')}
              </p>
              {m.role === 'officer' && m.wardNumber && (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full mt-1">
                  <MapPin size={9} /> Ward {m.wardNumber}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 border-t border-gray-50 pt-2 w-full justify-center">
              <Phone size={10} /> {m.phone}
            </div>
          </div>
        )
        const MarqueeRow = ({ members, accent, dir = 1 }) => {
          const repeated = [...members, ...members, ...members, ...members]
          const controls = useAnimationControls()
          useEffect(() => {
            controls.start({ x: dir === 1 ? ['0%', '-50%'] : ['-50%', '0%'], transition: { duration: members.length * 8, repeat: Infinity, ease: 'linear', repeatType: 'loop' } })
          }, [members.length])
          return (
            <div
              className="overflow-hidden cursor-pointer"
              onMouseEnter={() => controls.stop()}
              onMouseLeave={() => controls.start({ x: dir === 1 ? ['0%', '-50%'] : ['-50%', '0%'], transition: { duration: members.length * 8, repeat: Infinity, ease: 'linear', repeatType: 'loop' } })}
            >
              <motion.div
                className="flex gap-4"
                animate={controls}
                style={{ width: 'max-content' }}
              >
                {repeated.map((m, i) => <MemberCard key={i} m={m} accent={accent} />)}
              </motion.div>
            </div>
          )
        }
        return (
          <section className="py-14 bg-white">
            <div className="max-w-6xl mx-auto px-4 text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Meet Our Team</h2>
              <p className="text-sm text-gray-500 mt-1">Officials serving Tamilaga Vettri Kazhagam</p>
            </div>
            <div className="space-y-4">
              {admins.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-[#D32F2F] uppercase tracking-widest text-center mb-3">Administration</p>
                  <MarqueeRow members={admins} accent="admin" dir={1} />
                </div>
              )}
              {officers.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-blue-500 uppercase tracking-widest text-center mb-3">Ward Officers</p>
                  <MarqueeRow members={officers} accent="officer" dir={-1} />
                </div>
              )}
            </div>
          </section>
        )
      })()}

      {/* Resolved Complaints Ticker */}
      {feed.length > 0 && (
        <section className="py-14 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">{t('feed.title')}</h2>
              <p className="text-sm text-gray-500 mt-1">{t('feed.subtitle')}</p>
            </div>
          </div>
          <div className="overflow-hidden">
            <motion.div
              className="flex gap-5"
              animate={{ x: ['0%', `-${50}%`] }}
              transition={{ duration: feed.length * 5, repeat: Infinity, ease: 'linear' }}
              style={{ width: 'max-content' }}
            >
              {[...feed, ...feed].map((c, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-72 flex-shrink-0">
                  {c.completionPhotos?.length > 0 ? (
                    <img src={resolveUrl(c.completionPhotos[0])} alt="completion" className="w-full h-44 object-cover" />
                  ) : (
                    <div className="w-full h-44 bg-green-50 flex items-center justify-center">
                      <CheckCircle size={40} className="text-green-300" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-[#D32F2F]">{c.complaintId}</span>
                      <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle size={10} /> Resolved
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 mb-1 truncate">{c.title}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{categoryIcon(c.category)} {c.category}</span>
                      <span>Ward {c.wardNumber}</span>
                    </div>
                    {c.assignedOfficerName && (
                      <p className="text-xs text-gray-400 mt-1.5">by {c.assignedOfficerName} · {formatDate(c.completedDate)}</p>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Complaint Form */}
      <section ref={formRef} className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{t('hero.submitBtn')}</h2>
            <p className="text-gray-500 text-sm">No login required to submit a complaint</p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('form.name')} *</label>
                <input {...register('citizenName', { required: true })} placeholder={t('form.namePlaceholder')}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 ${errors.citizenName ? 'border-red-400' : 'border-gray-200'}`} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('form.phone')} *</label>
                <input {...register('phone', { required: true, pattern: /^[6-9]\d{9}$/ })} placeholder={t('form.phonePlaceholder')} type="tel"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 ${errors.phone ? 'border-red-400' : 'border-gray-200'}`} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('form.voterId')}</label>
                <input {...register('voterId')} placeholder="ABC1234567"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 uppercase" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('form.ward')} *</label>
                <input {...register('wardNumber', { required: true, min: 1 })} type="number" placeholder="1-200"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 ${errors.wardNumber ? 'border-red-400' : 'border-gray-200'}`} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('form.category')} *</label>
                <select {...register('category', { required: true })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white ${errors.category ? 'border-red-400' : 'border-gray-200'}`}>
                  <option value="">Select Category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{categoryIcon(c)} {t(`categories.${c}`)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('form.priority')}</label>
                <select {...register('priority')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white">
                  {PRIORITIES.map(p => <option key={p} value={p}>{t(`priority.${p}`)}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('form.title')} *</label>
              <input {...register('title', { required: true, minLength: 5 })} placeholder="Brief complaint title"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 ${errors.title ? 'border-red-400' : 'border-gray-200'}`} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('form.description')} *</label>
              <textarea {...register('description', { required: true, minLength: 20 })} rows={4} placeholder={t('form.descriptionPlaceholder')}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 resize-none ${errors.description ? 'border-red-400' : 'border-gray-200'}`} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('form.location')}</label>
              <input {...register('locationAddress')} placeholder="Street address, landmark"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('form.photo')} (max 5)</label>
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#D32F2F]/50 hover:bg-red-50/30 transition-all">
                <Camera size={22} className="text-gray-400 mb-1" />
                <p className="text-xs text-gray-400">Click to upload images</p>
                <input {...register('images')} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
              </label>
              {previews.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {previews.map((src, i) => <img key={i} src={src} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />)}
                </div>
              )}
            </div>

            <button type="submit" disabled={submitting}
              className="w-full py-3.5 bg-[#D32F2F] text-white font-bold rounded-xl hover:bg-red-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg">
              {submitting ? 'Submitting...' : t('form.submit')}
            </button>
          </motion.form>
        </div>
      </section>



      {/* Success Modal */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
              <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t('success.submitted')}</h3>
            <p className="text-sm text-gray-500 mb-6">{t('success.saveNote')}</p>
            <div className="space-y-3 mb-6">
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">{t('success.complaintId')}</p>
                <p className="text-lg font-bold text-[#D32F2F]">{successData.complaintId}</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">{t('success.citizenId')}</p>
                <p className="text-lg font-bold text-yellow-700">{successData.citizenId}</p>
              </div>
            </div>
            <button onClick={() => setSuccessData(null)} className="w-full py-3 bg-[#D32F2F] text-white font-bold rounded-xl hover:bg-red-700 transition-all">
              Close
            </button>
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={20} className="text-[#D32F2F]" />
              <span className="text-white font-bold">TVK Citizen Portal</span>
            </div>
            <p className="text-sm">Tamilaga Vettri Kazhagam (தமிழக வெற்றிக் கழகம்) Complaint Management System</p>
          </div>
          <div>
            <p className="text-white font-semibold mb-3">Quick Links</p>
            <div className="space-y-2 text-sm">
              <Link to="/track" className="block hover:text-white transition-colors">Track Complaint</Link>
              <Link to="/login" className="block hover:text-white transition-colors">Citizen Login</Link>
            </div>
          </div>
          <div>
            <p className="text-white font-semibold mb-3">Contact</p>
            <div className="space-y-2 text-sm">
              <p>📞 1800-425-1213 (Toll Free)</p>
              <p>✉️ complaints@tn.gov.in</p>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-8 pt-6 border-t border-gray-800 text-center text-xs">
          © {new Date().getFullYear()} Tamilaga Vettri Kazhagam. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
