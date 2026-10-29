import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useInView, animate, useAnimationControls } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Shield, MapPin, CheckCircle, Clock, Camera, Phone, User, Download } from 'lucide-react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
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
  const [submittedForm, setSubmittedForm] = useState(null)
  const [previews, setPreviews] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
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
      // Use previews source files directly
      if (selectedFiles.length > 0) {
        selectedFiles.forEach(f => fd.append('images', f))
      }
      const res = await complaintService.submit(fd)
      setSuccessData(res.data.data)
      setSubmittedForm({ ...data, images: previews })
      reset()
      setPreviews([])
      setSelectedFiles([])
    } catch (e) {
      alert(e.response?.data?.message || 'Submission failed')
    }
    setSubmitting(false)
  }

  const downloadSubmittedPDF = async () => {
    if (!successData || !submittedForm) return
    const c = {
      ...submittedForm,
      complaintId: successData.complaintId,
      citizenId: successData.citizenId,
      status: 'submitted',
      priority: submittedForm.priority || 'low',
      createdAt: new Date().toISOString(),
      images: previews.length ? [] : [], // previews already cleared, skip photos
    }
    const statusColors = { submitted: '#1d4ed8', accepted: '#b45309', processing: '#c2410c', completed: '#15803d', rejected: '#b91c1c' }
    const priorityColors = { low: '#6b7280', medium: '#1d4ed8', high: '#c2410c', urgent: '#b91c1c' }
    const sc = statusColors[c.status] || '#6b7280'
    const pc = priorityColors[c.priority] || '#6b7280'
    const html = `
      <div style="background:#D32F2F;padding:18px 24px;">
        <div style="color:#fff;font-size:18px;font-weight:700;text-align:center;">Tamilaga Vettri Kazhagam</div>
        <div style="color:#ffcdd2;font-size:11px;text-align:center;margin-top:3px;">Vikramasingapuram | Complaint Report</div>
        <div style="color:#ffcdd2;font-size:10px;text-align:right;margin-top:4px;">Generated: ${new Date().toLocaleString('en-IN')}</div>
      </div>
      <div style="padding:20px 24px;">
        <div style="background:#f9fafb;border-radius:8px;padding:12px 16px;display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
          <span style="color:#D32F2F;font-weight:700;font-size:15px;">${c.complaintId}</span>
          <span style="display:inline-flex;align-items:center;justify-content:center;background:${sc}22;color:${sc};padding:0 12px;height:22px;border-radius:20px;font-size:11px;font-weight:600;text-transform:capitalize;box-sizing:border-box;">${c.status}</span>
          <span style="display:inline-flex;align-items:center;justify-content:center;background:${pc}22;color:${pc};padding:0 12px;height:22px;border-radius:20px;font-size:11px;font-weight:600;text-transform:capitalize;box-sizing:border-box;">${c.priority}</span>
          <span style="color:#6b7280;font-size:11px;">${c.category || ''}</span>
        </div>
        <div style="border-left:3px solid #D32F2F;padding-left:10px;margin-bottom:12px;"><div style="font-weight:700;font-size:11px;color:#6b7280;letter-spacing:.05em;">CITIZEN INFORMATION</div></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
          <div><div style="font-size:10px;color:#9ca3af;">Name</div><div style="font-weight:600;">${c.citizenName || '—'}</div></div>
          <div><div style="font-size:10px;color:#9ca3af;">Phone</div><div style="font-weight:600;">${c.phone || '—'}</div></div>
          <div><div style="font-size:10px;color:#9ca3af;">Voter ID</div><div style="font-weight:600;">${c.voterId || '—'}</div></div>
          <div><div style="font-size:10px;color:#9ca3af;">Ward Number</div><div style="font-weight:600;">Ward ${c.wardNumber || '—'}</div></div>
          <div><div style="font-size:10px;color:#9ca3af;">Citizen ID</div><div style="font-weight:600;">${c.citizenId || '—'}</div></div>
          <div><div style="font-size:10px;color:#9ca3af;">Submitted On</div><div style="font-weight:600;">${formatDate(c.createdAt)}</div></div>
        </div>
        <div style="border-left:3px solid #D32F2F;padding-left:10px;margin-bottom:12px;"><div style="font-weight:700;font-size:11px;color:#6b7280;letter-spacing:.05em;">COMPLAINT DETAILS</div></div>
        <div style="margin-bottom:10px;"><div style="font-size:10px;color:#9ca3af;">Title</div><div style="font-weight:600;">${c.title || '—'}</div></div>
        <div style="margin-bottom:10px;"><div style="font-size:10px;color:#9ca3af;margin-bottom:4px;">Description</div><div style="background:#f9fafb;border-radius:6px;padding:10px;line-height:1.7;white-space:pre-wrap;word-break:break-word;">${(c.description || '—').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div></div>
        ${c.locationAddress ? `<div style="margin-bottom:10px;"><div style="font-size:10px;color:#9ca3af;">Location</div><div style="font-weight:600;">${c.locationAddress}</div></div>` : ''}
        <div style="background:#f9fafb;padding:10px 16px;border-radius:6px;display:flex;justify-content:space-between;font-size:10px;color:#9ca3af;margin-top:20px;">
          <span>Tamilaga Vettri Kazhagam — Vikramasingapuram</span><span>${c.complaintId}</span>
        </div>
      </div>`
    const container = document.createElement('div')
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;font-family:"Noto Sans Tamil","Latha",Arial,sans-serif;font-size:13px;color:#222;'
    container.innerHTML = html
    document.body.appendChild(container)
    try {
      const fullH = container.scrollHeight
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, allowTaint: false, logging: false, height: fullH, windowHeight: fullH })
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const W = 210, H = 297
      const imgH = (canvas.height * W) / canvas.width
      let drawn = 0, remaining = imgH
      while (remaining > 0) {
        const sliceH = Math.min(remaining, H)
        const srcY = (drawn / imgH) * canvas.height
        const sc2 = document.createElement('canvas')
        sc2.width = canvas.width
        sc2.height = (sliceH / imgH) * canvas.height
        sc2.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, sc2.height, 0, 0, canvas.width, sc2.height)
        if (drawn > 0) doc.addPage()
        doc.addImage(sc2.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, W, sliceH)
        drawn += sliceH
        remaining -= sliceH
      }
      doc.save(`${c.complaintId}.pdf`)
    } finally {
      document.body.removeChild(container)
    }
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    setSelectedFiles(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-[72px] overflow-hidden bg-gradient-to-br from-[#D32F2F] via-red-700 to-red-900 text-white min-h-[720px] flex flex-col">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative flex-1 flex items-center justify-center px-4 py-12">
          <div className="flex flex-col-reverse lg:flex-row items-center justify-center gap-6 w-full max-w-5xl mx-auto">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="flex-1 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
                <Shield size={14} /> Tamilaga Vettri Kazhagam Official Portal
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">{t('hero.headline')}</h1>
              <p className="text-lg md:text-xl text-red-100 mb-8">{t('hero.subheadline')}</p>
              <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}
                  onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-3.5 bg-[#FFC107] text-gray-900 font-bold rounded-xl hover:bg-yellow-400 transition-all shadow-lg"
                >
                  {t('hero.submitBtn')}
                </motion.button>
                <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}>
                  <Link to="/track" className="px-8 py-3.5 bg-white/20 backdrop-blur text-white font-semibold rounded-xl border border-white/30 hover:bg-white/30 transition-all block">
                    {t('hero.trackBtn')}
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            {/* Right: CM Photo Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
              className="flex-shrink-0 flex justify-center"
            >
              <motion.div
                whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}
                className="w-[240px] h-[320px] md:w-[280px] md:h-[370px] lg:w-[300px] lg:h-[400px] rounded-[24px] bg-white p-[8px] border-[6px] border-[#F5C542] shadow-2xl overflow-hidden"
              >
                <div className="relative w-full h-full rounded-[18px] overflow-hidden">
                  <img src="/vijay.png" alt="C. Joseph Vijay" className="w-full h-full object-cover object-top" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 py-4">
                    <span className="bg-[#F5C542] text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full">CM</span>
                    <p className="text-white font-bold text-lg leading-tight mt-1">C. Joseph Vijay</p>
                    <p className="text-white/80 text-xs mt-0.5">Chief Minister of Tamil Nadu</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
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
          const trackRef = useRef(null)
          const isDragging = useRef(false)
          const startX = useRef(0)
          const posX = useRef(0)
          const rafId = useRef(null)
          const animReq = useRef(null)

          const halfWidth = () => (trackRef.current?.scrollWidth || 0) / 2

          const wrap = (x) => {
            const hw = halfWidth()
            if (!hw) return x
            if (x > 0) return x - hw
            if (x < -hw) return x + hw
            return x
          }

          const setPos = (x) => {
            if (trackRef.current) trackRef.current.style.transform = `translateX(${x}px)`
          }

          // Pure JS animation loop — no framer-motion during auto-scroll
          const startAutoScroll = () => {
            if (animReq.current) cancelAnimationFrame(animReq.current)
            const hw = halfWidth()
            if (!hw) return
            const speed = dir === 1 ? -0.5 : 0.5 // px per frame
            const tick = () => {
              if (isDragging.current) return
              posX.current = wrap(posX.current + speed)
              setPos(posX.current)
              animReq.current = requestAnimationFrame(tick)
            }
            animReq.current = requestAnimationFrame(tick)
          }

          useEffect(() => {
            // Wait for layout
            const t = setTimeout(startAutoScroll, 100)
            return () => { clearTimeout(t); if (animReq.current) cancelAnimationFrame(animReq.current) }
          }, [members.length])

          const onPointerDown = (e) => {
            isDragging.current = true
            startX.current = e.clientX
            if (animReq.current) cancelAnimationFrame(animReq.current)
          }

          const onPointerMove = (e) => {
            if (!isDragging.current) return
            const multiplier = e.pointerType === 'touch' ? 8 : 1
            const delta = (e.clientX - startX.current) * multiplier
            startX.current = e.clientX
            posX.current = wrap(posX.current + delta)
            if (rafId.current) cancelAnimationFrame(rafId.current)
            rafId.current = requestAnimationFrame(() => {
              setPos(posX.current)
              rafId.current = null
            })
          }

          const onPointerUp = () => {
            if (!isDragging.current) return
            isDragging.current = false
            startAutoScroll()
          }

          return (
            <div
              className="overflow-hidden cursor-grab active:cursor-grabbing select-none"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <div
                ref={trackRef}
                className="flex gap-4"
                style={{ width: 'max-content', willChange: 'transform', transform: 'translateX(0px)' }}
              >
                {repeated.map((m, i) => <MemberCard key={i} m={m} accent={accent} />)}
              </div>
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
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
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
            <button onClick={downloadSubmittedPDF}
              className="w-full py-3 mb-3 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all">
              <Download size={16} /> Download Complaint PDF
            </button>
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
