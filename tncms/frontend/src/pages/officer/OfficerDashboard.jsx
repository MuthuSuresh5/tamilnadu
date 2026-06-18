import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { FileText, CheckCircle, Clock, TrendingUp, Camera } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { StatCard, StatusBadge, PriorityBadge, LoadingSpinner, PageHeader, Modal } from '../../components/shared/UI'
import { analyticsService, complaintService } from '../../services'
import { formatDate, categoryIcon, resolveUrl } from '../../utils/helpers'

export default function OfficerDashboard() {
  const { t } = useTranslation()
  const { user } = useSelector(s => s.auth)
  const [stats, setStats] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ status: '', remarks: '', expectedCompletionDate: '' })
  const [photos, setPhotos] = useState([])
  const [previews, setPreviews] = useState([])
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const wardNumbers = user?.wardNumbers?.length ? user.wardNumbers : user?.wardNumber ? [user.wardNumber] : []
    if (!wardNumbers.length) { setLoading(false); return }

    // Fetch complaints for all assigned wards
    Promise.all(
      wardNumbers.map(w => complaintService.getAll({ ward: w, limit: 100 }))
    ).then(results => {
      const allComplaints = results.flatMap(r => r.data.data || [])
      // Deduplicate by _id
      const seen = new Set()
      const list = allComplaints.filter(c => seen.has(c._id) ? false : seen.add(c._id))
      setComplaints(list)
      setStats({
        total: list.length,
        accepted: list.filter(x => x.status === 'accepted').length,
        processing: list.filter(x => x.status === 'processing').length,
        completed: list.filter(x => x.status === 'completed').length,
        resolutionRate: list.length ? Math.round((list.filter(x => x.status === 'completed').length / list.length) * 100) : 0,
      })
      // Category distribution from this officer's complaints
      const catMap = {}
      list.forEach(c => { catMap[c.category] = (catMap[c.category] || 0) + 1 })
      setCategoryData(Object.entries(catMap).map(([name, count]) => ({ name, count })))
    }).finally(() => setLoading(false))
  }, [user])

  const openDetail = (c) => {
    setSelected(c)
    setForm({ status: c.status, remarks: c.remarks || '', expectedCompletionDate: '' })
    setPhotos([])
    setPreviews([])
  }

  const handleUpdate = async () => {
    if (!selected) return
    setUpdating(true)
    try {
      const fd = new FormData()
      fd.append('status', form.status)
      if (form.remarks) fd.append('remarks', form.remarks)
      if (form.expectedCompletionDate) fd.append('expectedCompletionDate', form.expectedCompletionDate)
      photos.forEach(f => fd.append('completionPhotos', f))
      await complaintService.updateStatus(selected._id, fd)
      setSelected(null)
      const wardNumbers = user?.wardNumbers?.length ? user.wardNumbers : user?.wardNumber ? [user.wardNumber] : []
      const results = await Promise.all(wardNumbers.map(w => complaintService.getAll({ ward: w, limit: 100 })))
      const allComplaints = results.flatMap(r => r.data.data || [])
      const seen = new Set()
      const list = allComplaints.filter(c => seen.has(c._id) ? false : seen.add(c._id))
      setComplaints(list)
      setStats(prev => ({
        ...prev,
        completed: list.filter(x => x.status === 'completed').length,
        resolutionRate: list.length ? Math.round((list.filter(x => x.status === 'completed').length / list.length) * 100) : 0
      }))
    } catch (e) {
      alert(e.response?.data?.message || 'Update failed')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <LoadingSpinner text="Loading dashboard..." />

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.name} 👋`}
        subtitle={`Wards: ${(user?.wardNumbers?.length ? user.wardNumbers : user?.wardNumber ? [user.wardNumber] : []).join(', ') || 'None assigned'}`}
        actions={
          <Link to="/officer/complaints" className="flex items-center gap-2 px-4 py-2 bg-[#D32F2F] text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-all">
            <FileText size={16} /> View All Complaints
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Complaints" value={stats?.total} icon={FileText} color="#D32F2F" delay={0} />
        <StatCard title="Pending" value={(stats?.accepted || 0) + (stats?.processing || 0)} icon={Clock} color="#F97316" delay={0.1} />
        <StatCard title="Completed" value={stats?.completed} icon={CheckCircle} color="#10B981" delay={0.2} />
        <StatCard title="Resolution Rate" value={`${stats?.resolutionRate || 0}%`} icon={TrendingUp} color="#3B82F6" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Recent Complaints</h3>
            <Link to="/officer/complaints" className="text-xs text-[#D32F2F] font-semibold hover:underline">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>{['ID', 'Citizen', 'Category', 'Status', 'Priority'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {complaints.map(c => (
                  <tr key={c._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openDetail(c)}>
                    <td className="px-4 py-3 font-mono text-xs text-[#D32F2F] font-semibold">{c.complaintId}</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{c.citizenName}</td>
                    <td className="px-4 py-3 text-gray-600">{categoryIcon(c.category)} {c.category}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4">Category Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={75} />
              <Tooltip />
              <Bar dataKey="count" fill="#D32F2F" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Complaint Detail + Update Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`${selected?.complaintId} — ${selected?.title}`} size="xl">
        {selected && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Citizen Info</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-400">Name</span><p className="font-semibold text-gray-700">{selected.citizenName}</p></div>
                  <div><span className="text-gray-400">Phone</span><p className="font-semibold text-gray-700">{selected.phone}</p></div>
                  <div><span className="text-gray-400">Ward</span><p className="font-semibold text-gray-700">Ward {selected.wardNumber}</p></div>
                  <div><span className="text-gray-400">Voter ID</span><p className="font-semibold text-gray-700">{selected.voterId || '—'}</p></div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={selected.status} />
                <PriorityBadge priority={selected.priority} />
                <span className="text-xs text-gray-400">{categoryIcon(selected.category)} {selected.category}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed">{selected.description}</p>
              </div>
              {selected.location?.address && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Location</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{selected.location.address}</p>
                </div>
              )}
              {selected.images?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Complaint Photos</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.images.map((src, i) => (
                      <a key={i} href={resolveUrl(src)} target="_blank" rel="noreferrer">
                        <img src={resolveUrl(src)} alt={`photo-${i}`} className="w-20 h-20 rounded-xl object-cover border border-gray-100 hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {selected.completionPhotos?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Completion Photos</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.completionPhotos.map((src, i) => (
                      <a key={i} href={resolveUrl(src)} target="_blank" rel="noreferrer">
                        <img src={resolveUrl(src)} alt={`completion-${i}`} className="w-20 h-20 rounded-xl object-cover border border-gray-100 hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {selected.timeline?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Timeline</p>
                  <div className="space-y-2">
                    {selected.timeline.map((t, i) => (
                      <div key={i} className="flex gap-3 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D32F2F] mt-1.5 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-gray-700 capitalize">{t.status}</span>
                          {t.message && <span className="text-gray-400"> — {t.message}</span>}
                          <p className="text-gray-400">{formatDate(t.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-4 lg:border-l lg:border-gray-100 lg:pl-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Update Status</p>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Status *</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30">
                  {['submitted', 'accepted', 'processing', 'completed', 'rejected'].map(s => (
                    <option key={s} value={s}>{t(`status.${s}`, s)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Remarks</label>
                <textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} rows={3}
                  placeholder="Add remarks or update notes..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Expected Completion Date</label>
                <input type="date" value={form.expectedCompletionDate} onChange={e => setForm(f => ({ ...f, expectedCompletionDate: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30" />
              </div>
              {form.status === 'completed' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Upload Completion Photos</label>
                  <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#D32F2F]/50 transition-all">
                    <Camera size={18} className="text-gray-400 mb-1" />
                    <p className="text-xs text-gray-400">Upload photos</p>
                    <input type="file" accept="image/*" multiple className="hidden"
                      onChange={e => {
                        const files = Array.from(e.target.files)
                        setPhotos(files)
                        setPreviews(files.map(f => URL.createObjectURL(f)))
                      }} />
                  </label>
                  {previews.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {previews.map((src, i) => <img key={i} src={src} alt="" className="w-14 h-14 rounded-lg object-cover border border-gray-100" />)}
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setSelected(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50">Cancel</button>
                <button onClick={handleUpdate} disabled={updating}
                  className="flex-1 py-2.5 bg-[#D32F2F] text-white text-sm font-bold rounded-xl hover:bg-red-700 disabled:opacity-60">
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
