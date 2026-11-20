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
  const [teamLoading, setTeamLoading] = useState(true)
  const [feedLoading, setFeedLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successData, setSuccessData] = useState(null)
  const [submittedForm, setSubmittedForm] = useState(null)
  const [errorData, setErrorData] = useState(null)
  const [previews, setPreviews] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const formRef = useRef(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const onInvalid = () => {
    const errorList = [
      errors.citizenName?.message,
      errors.phone?.message,
      errors.wardNumber?.message,
      errors.category?.message,
      errors.title?.message,
      errors.description?.message,
    ].filter(Boolean)
    setErrorData(errorList.join('\n'))
  }

  useEffect(() => {
    publicService.getDashboardStats().then(r => setStats(r.data.data)).catch(() => {})
    publicService.getCompletedFeed().then(r => setFeed(r.data.data || [])).catch(() => {}).finally(() => setFeedLoading(false))
    publicService.getPublicTeam().then(r => setTeam(r.data.data || [])).catch(() => {}).finally(() => setTeamLoading(false))
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
      const msg = e.response?.data?.message || e.message || 'Submission failed. Please try again.'
      setErrorData(msg)
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
      images: submittedForm.images || [],
    }
    const statusColors = { submitted: '#1d4ed8', accepted: '#b45309', processing: '#c2410c', completed: '#15803d', rejected: '#b91c1c' }
    const priorityColors = { low: '#6b7280', medium: '#1d4ed8', high: '#c2410c', urgent: '#b91c1c' }
    const sc = statusColors[c.status] || '#6b7280'
    const pc = priorityColors[c.priority] || '#6b7280'
    const photoHtml = c.images.map(src =>
      `<img src="${resolveUrl(src)}" style="width:320px;height:220px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb;" />`
    ).join('')
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
        ${c.images.length ? `<div style="border-left:3px solid #D32F2F;padding-left:10px;margin-bottom:12px;"><div style="font-weight:700;font-size:11px;color:#6b7280;letter-spacing:.05em;">COMPLAINT PHOTOS</div></div><div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">${photoHtml}</div>` : ''}
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
    const files = Array.from(e.target.files).slice(0, 2)
    if (e.target.files.length > 2) {
      setErrorData('You can upload a maximum of 2 photos.')
    }
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

      {/* Team Section */}
      <section className="py-14 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Meet Our Team</h2>
          <p className="text-sm text-gray-500 mt-1">Officials serving Tamilaga Vettri Kazhagam</p>
        </div>
        {teamLoading ? (
          <div className="space-y-10">
            <div className="flex justify-center gap-3 px-4 flex-wrap">
              {[1,2,3].map(i => (
                <div key={i} className="w-[100px] sm:w-[150px] lg:w-52 rounded-2xl overflow-hidden border-2 border-gray-100 animate-pulse">
                  <div className="w-full h-28 sm:h-36 lg:h-44 bg-gray-200" />
                  <div className="px-2 py-3 space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded-full w-3/4 mx-auto" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-1/2 mx-auto" />
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div className="h-3 bg-gray-200 rounded-full w-24 mx-auto mb-4 animate-pulse" />
              <div className="flex gap-4 px-4 overflow-hidden">
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex-shrink-0 w-52 rounded-2xl border border-gray-100 p-5 animate-pulse">
                    <div className="w-20 h-20 rounded-full bg-gray-200 mx-auto mb-3" />
                    <div className="h-3 bg-gray-200 rounded-full w-3/4 mx-auto mb-2" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-1/2 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (() => {
          const superAdmins = team.filter(m => m.role === 'superadmin').sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999))
          const admins = team.filter(m => m.role === 'admin').sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999))

          const SuperAdminCard = ({ m }) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              whileHover={{ scale: 1.03 }} transition={{ duration: 0.3 }}
              className="flex-shrink-0 w-[100px] sm:w-[150px] lg:w-52 bg-white rounded-2xl border-2 border-[#F5C542] shadow-lg overflow-hidden"
            >
              <div className="relative w-full h-28 sm:h-36 lg:h-44 overflow-hidden">
                {m.profilePhoto
                  ? <img src={resolveUrl(m.profilePhoto)} alt={m.name} className="w-full h-full object-cover object-top" />
                  : <div className="w-full h-full bg-gradient-to-br from-[#D32F2F] to-red-900 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white/80">{m.name?.[0]}</span>
                    </div>
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 px-2 py-2">
                  <p className="text-white font-bold text-[10px] sm:text-xs leading-tight break-words">{m.name}</p>
                </div>
              </div>
              <div className="px-2 py-2 border-t border-[#F5C542]/30 text-center">
                <p className="text-[9px] sm:text-xs font-semibold text-[#D32F2F] break-words leading-tight">{m.designation || 'Administrator'}</p>
              </div>
            </motion.div>
          )

          const MemberCard = ({ m }) => (
            <div className="flex-shrink-0 w-52 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center text-center gap-3">
              <div className="relative">
                <div className="w-20 h-20 rounded-full ring-4 ring-[#D32F2F]/20 overflow-hidden shadow-md">
                  {m.profilePhoto
                    ? <img src={resolveUrl(m.profilePhoto)} alt={m.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white bg-gradient-to-br from-[#D32F2F] to-red-400">{m.name?.[0]}</div>
                  }
                </div>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white bg-[#D32F2F] flex items-center justify-center">
                  <Shield size={9} className="text-white" />
                </span>
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm truncate w-40">{m.name}</p>
                <p className="text-xs font-semibold mt-0.5 text-[#D32F2F]">{m.designation || 'Admin'}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 border-t border-gray-50 pt-2 w-full justify-center">
                <Phone size={10} /> {m.phone}
              </div>
            </div>
          )

          const ScrollRow = ({ members }) => {
            const trackRef = useRef(null)
            const containerRef = useRef(null)
            const animReq = useRef(null)
            const posX = useRef(0)
            const isDragging = useRef(false)
            const lastX = useRef(0)
            const getMaxScroll = () => {
              const el = trackRef.current, container = containerRef.current
              if (!el || !container) return 0
              return -(el.scrollWidth - container.offsetWidth)
            }
            const clamp = (x) => Math.min(0, Math.max(x, getMaxScroll()))
            const startAutoScroll = () => {
              if (animReq.current) cancelAnimationFrame(animReq.current)
              const tick = () => {
                if (isDragging.current) return
                const max = getMaxScroll()
                if (posX.current <= max) return
                posX.current = Math.max(posX.current - 0.5, max)
                if (trackRef.current) trackRef.current.style.transform = `translateX(${posX.current}px)`
                animReq.current = requestAnimationFrame(tick)
              }
              animReq.current = requestAnimationFrame(tick)
            }
            useEffect(() => {
              const t = setTimeout(startAutoScroll, 100)
              return () => { clearTimeout(t); if (animReq.current) cancelAnimationFrame(animReq.current) }
            }, [members.length])
            useEffect(() => {
              const container = containerRef.current
              if (!container) return
              const onTouchStart = (e) => { isDragging.current = true; lastX.current = e.touches[0].clientX; if (animReq.current) cancelAnimationFrame(animReq.current) }
              const onTouchMove = (e) => { if (!isDragging.current) return; e.preventDefault(); const x = e.touches[0].clientX; const delta = x - lastX.current; lastX.current = x; posX.current = clamp(posX.current + delta); if (trackRef.current) trackRef.current.style.transform = `translateX(${posX.current}px)` }
              const onTouchEnd = () => { isDragging.current = false; startAutoScroll() }
              container.addEventListener('touchstart', onTouchStart, { passive: true })
              container.addEventListener('touchmove', onTouchMove, { passive: false })
              container.addEventListener('touchend', onTouchEnd)
              container.addEventListener('touchcancel', onTouchEnd)
              return () => { container.removeEventListener('touchstart', onTouchStart); container.removeEventListener('touchmove', onTouchMove); container.removeEventListener('touchend', onTouchEnd); container.removeEventListener('touchcancel', onTouchEnd) }
            }, [members.length])
            return (
              <div ref={containerRef} className="overflow-hidden cursor-grab active:cursor-grabbing select-none px-4"
                onMouseDown={e => { isDragging.current = true; lastX.current = e.clientX; if (animReq.current) cancelAnimationFrame(animReq.current) }}
                onMouseMove={e => { if (!isDragging.current) return; const delta = e.clientX - lastX.current; lastX.current = e.clientX; posX.current = clamp(posX.current + delta); if (trackRef.current) trackRef.current.style.transform = `translateX(${posX.current}px)` }}
                onMouseUp={() => { if (!isDragging.current) return; isDragging.current = false; startAutoScroll() }}
                onMouseLeave={() => { if (!isDragging.current) return; isDragging.current = false; startAutoScroll() }}
              >
                <div ref={trackRef} className="flex gap-4" style={{ width: 'max-content', willChange: 'transform', transform: 'translateX(0px)' }}>
                  {members.map((m, i) => <MemberCard key={i} m={m} />)}
                </div>
              </div>
            )
          }

          return (
            <div className="space-y-10">
              {superAdmins.length > 0 && (
                <div className="flex justify-center px-4">
                  <div className="flex gap-3 justify-center flex-wrap">
                    {superAdmins.map((m, i) => <SuperAdminCard key={m._id || i} m={m} />)}
                  </div>
                </div>
              )}
              {admins.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-[#D32F2F] uppercase tracking-widest text-center mb-3">Administration</p>
                  <ScrollRow members={admins} />
                </div>
              )}
            </div>
          )
        })()}
      </section>

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
            onSubmit={handleSubmit(onSubmit, onInvalid)}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('form.name')} *</label>
                <input {...register('citizenName', { required: 'Name is required' })} placeholder={t('form.namePlaceholder')}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 ${errors.citizenName ? 'border-red-400' : 'border-gray-200'}`} />
                {errors.citizenName && <p className="text-red-500 text-xs mt-1">{errors.citizenName.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('form.phone')} *</label>
                <input {...register('phone', { required: 'Phone number is required', pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit mobile number starting with 6-9' } })} placeholder={t('form.phonePlaceholder')} type="tel"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 ${errors.phone ? 'border-red-400' : 'border-gray-200'}`} />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('form.voterId')}</label>
                <input {...register('voterId')} placeholder="ABC1234567"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 uppercase" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('form.ward')} *</label>
                <input {...register('wardNumber', { required: 'Ward number is required', min: { value: 1, message: 'Ward number must be at least 1' } })} type="number" placeholder="1-200"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 ${errors.wardNumber ? 'border-red-400' : 'border-gray-200'}`} />
                {errors.wardNumber && <p className="text-red-500 text-xs mt-1">{errors.wardNumber.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('form.category')} *</label>
                <select {...register('category', { required: 'Please select a category' })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 bg-white ${errors.category ? 'border-red-400' : 'border-gray-200'}`}>
                  <option value="">Select Category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{categoryIcon(c)} {t(`categories.${c}`)}</option>)}
                </select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
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
              <input {...register('title', { required: 'Title is required', minLength: { value: 5, message: 'Title must be at least 5 characters' } })} placeholder="Brief complaint title"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 ${errors.title ? 'border-red-400' : 'border-gray-200'}`} />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('form.description')} *</label>
              <textarea {...register('description', { required: 'Description is required', minLength: { value: 20, message: 'Description must be at least 20 characters' } })} rows={4} placeholder={t('form.descriptionPlaceholder')}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 resize-none ${errors.description ? 'border-red-400' : 'border-gray-200'}`} />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('form.location')}</label>
              <input {...register('locationAddress')} placeholder="Street address, landmark"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('form.photo')} (max 2)</label>
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



      {/* Error Modal */}
      {errorData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">Please fix the following</h3>
                <p className="text-xs text-gray-500">Fill all required fields correctly</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-5 space-y-2">
              {errorData.split('\n').map((msg, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{msg}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setErrorData(null)}
              className="w-full py-2.5 bg-[#D32F2F] text-white font-bold rounded-xl hover:bg-red-700 transition-all text-sm"
            >
              OK, Fix It
            </button>
          </motion.div>
        </div>
      )}

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
              <p>✉️ vkpuramtvk@gmail.com</p>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-8 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <span>© {new Date().getFullYear()} Tamilaga Vettri Kazhagam. All rights reserved.</span>
          <a
            href="https://decode-studio-xzq1.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-gray-500 hover:text-white transition-colors"
          >
            Powered by <span className="font-semibold text-[#F5C542] hover:text-yellow-300">Decode Studio</span>
          </a>
        </div>
      </footer>
    </div>
  )
}
