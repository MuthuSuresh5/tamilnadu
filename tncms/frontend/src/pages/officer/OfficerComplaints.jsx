import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, Upload, CheckCircle, X, Camera } from 'lucide-react'
import { StatusBadge, PriorityBadge, LoadingSpinner, EmptyState, PageHeader, Modal } from '../../components/shared/UI'
import { complaintService } from '../../services'
import { formatDate, categoryIcon, resolveUrl } from '../../utils/helpers'

const STATUSES = ['', 'submitted', 'accepted', 'processing', 'completed', 'rejected']

export default function OfficerComplaints() {
  const { t } = useTranslation()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [updating, setUpdating] = useState(false)
  const [selected, setSelected] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [form, setForm] = useState({ status: '', remarks: '', expectedCompletionDate: '' })
  const [photos, setPhotos] = useState([])
  const [previews, setPreviews] = useState([])

  const load = async () => {
    setLoading(true)
    try {
      const res = await complaintService.getAll({ status: statusFilter, search, limit: 50 })
      setComplaints(res.data.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [statusFilter])

  const handleSearch = () => load()

  const openUpdate = async (c) => {
    setSelected(c)
    setForm({ status: c.status, remarks: c.remarks || '', expectedCompletionDate: '' })
    setPhotos([])
    setPreviews([])
    setDetailLoading(true)
    try {
      const res = await complaintService.track(c.complaintId)
      setSelected(res.data.data)
      setForm(f => ({ ...f, status: res.data.data.status, remarks: res.data.data.remarks || '' }))
    } catch { /* keep list data */ } finally { setDetailLoading(false) }
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
      load()
    } catch (e) {
      alert(e.response?.data?.message || 'Update failed')
    }
    setUpdating(false)
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Complaints Management" subtitle="Manage ward complaints" />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search complaints..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 min-w-[150px]">
          {STATUSES.map(s => <option key={s} value={s}>{s ? t(`status.${s}`) : 'All Status'}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : complaints.length === 0 ? <EmptyState icon={Search} title="No complaints found" /> : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['ID', 'Citizen', 'Ward', 'Category', 'Title', 'Status', 'Priority', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {complaints.map(c => (
                  <tr key={c._id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openUpdate(c)}>
                    <td className="px-4 py-3 font-mono text-xs text-[#D32F2F] font-semibold whitespace-nowrap">{c.complaintId}</td>
                    <td className="px-4 py-3 text-gray-700 text-xs whitespace-nowrap">{c.citizenName}<br /><span className="text-gray-400">{c.phone}</span></td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{c.wardNumber}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{categoryIcon(c.category)} {c.category}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[180px] truncate">{c.title}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openUpdate(c)} className="px-3 py-1.5 text-xs font-semibold text-white bg-[#D32F2F] rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap">
                        View / Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`${selected?.complaintId} — ${selected?.title}`} size="xl">
        {selected && (
          detailLoading
            ? <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-gray-200 border-t-[#D32F2F] rounded-full animate-spin" /></div>
            : <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Complaint Details */}
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

                {/* Right: Update Form */}
                <div className="space-y-4 lg:border-l lg:border-gray-100 lg:pl-6">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Update Status</p>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Status *</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30">
                      {['submitted', 'accepted', 'processing', 'completed', 'rejected'].map(s => (
                        <option key={s} value={s}>{t(`status.${s}`)}</option>
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
