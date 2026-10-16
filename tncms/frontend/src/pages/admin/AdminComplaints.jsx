import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Trash2, Camera, Download } from 'lucide-react'
import { StatusBadge, PriorityBadge, LoadingSpinner, EmptyState, PageHeader, Modal } from '../../components/shared/UI'
import { complaintService, reportService } from '../../services'
import { formatDate, categoryIcon, downloadBlob, resolveUrl } from '../../utils/helpers'
import jsPDF from 'jspdf'

const STATUSES = ['', 'submitted', 'accepted', 'processing', 'completed', 'rejected']
const PRIORITIES = ['', 'low', 'medium', 'high', 'urgent']

export default function AdminComplaints() {
  const { t } = useTranslation()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', ward: '', page: 1 })
  const [total, setTotal] = useState(0)
  const [deleting, setDeleting] = useState(null)
  const [selected, setSelected] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [form, setForm] = useState({ status: '', remarks: '', expectedCompletionDate: '' })
  const [photos, setPhotos] = useState([])
  const [previews, setPreviews] = useState([])
  const [updating, setUpdating] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const params = { ...filters, limit: 25 }
      Object.keys(params).forEach(k => !params[k] && delete params[k])
      const res = await complaintService.getAll(params)
      setComplaints(res.data.data)
      setTotal(res.data.total)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filters.status, filters.priority, filters.ward, filters.page])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this complaint?')) return
    setDeleting(id)
    try { await complaintService.delete(id); load() } catch { alert('Delete failed') }
    setDeleting(null)
  }

  const handleDownload = async (type) => {
    try {
      const params = { status: filters.status, ward: filters.ward }
      const res = type === 'pdf' ? await reportService.downloadPDF(params) : await reportService.downloadExcel(params)
      downloadBlob(res.data, `complaints.${type === 'pdf' ? 'pdf' : 'xlsx'}`)
    } catch { alert('Download failed') }
  }

  const openDetail = async (c) => {
    setSelected(c)
    setForm({ status: c.status, remarks: c.remarks || '', expectedCompletionDate: '' })
    setPhotos([])
    setPreviews([])
    setDetailLoading(true)
    try {
      const res = await complaintService.track(c.complaintId)
      setSelected(res.data.data)
      setForm(f => ({ ...f, status: res.data.data.status, remarks: res.data.data.remarks || '' }))
    } catch { } finally { setDetailLoading(false) }
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
    } catch (e) { alert(e.response?.data?.message || 'Update failed') }
    setUpdating(false)
  }

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }))

  const downloadComplaintPDF = async (c, e) => {
    e.stopPropagation()
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const W = 210, margin = 15, contentW = W - margin * 2
    let y = 0

    // Header bar
    doc.setFillColor(211, 47, 47)
    doc.rect(0, 0, W, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Tamilaga Vettri Kazhagam', W / 2, 10, { align: 'center' })
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Vikramasingapuram — Complaint Report', W / 2, 17, { align: 'center' })
    doc.setFontSize(8)
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, W / 2, 23, { align: 'center' })
    y = 35

    // Complaint ID badge
    doc.setFillColor(255, 245, 245)
    doc.roundedRect(margin, y, contentW, 12, 2, 2, 'F')
    doc.setTextColor(211, 47, 47)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(c.complaintId, margin + 4, y + 8)
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Status: ${c.status?.toUpperCase()}   Priority: ${c.priority?.toUpperCase()}   Category: ${c.category}`, margin + contentW - 4, y + 8, { align: 'right' })
    y += 18

    // Section helper
    const section = (title) => {
      doc.setFillColor(245, 245, 245)
      doc.rect(margin, y, contentW, 7, 'F')
      doc.setTextColor(80, 80, 80)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text(title.toUpperCase(), margin + 3, y + 5)
      y += 10
    }

    const row = (label, value) => {
      doc.setTextColor(120, 120, 120)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(label + ':', margin + 3, y)
      doc.setTextColor(40, 40, 40)
      doc.setFont('helvetica', 'bold')
      const lines = doc.splitTextToSize(String(value || '—'), contentW / 2 - 5)
      doc.text(lines, margin + 45, y)
      y += lines.length * 5 + 1
    }

    const twoCol = (items) => {
      const colW = contentW / 2
      items.forEach(([label, value], i) => {
        const x = margin + (i % 2) * colW
        if (i % 2 === 0 && i > 0) y += 6
        doc.setTextColor(120, 120, 120)
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'normal')
        doc.text(label + ':', x + 3, y)
        doc.setTextColor(40, 40, 40)
        doc.setFont('helvetica', 'bold')
        doc.text(String(value || '—'), x + 3, y + 4)
      })
      y += 10
    }

    // Citizen Info
    section('Citizen Information')
    twoCol([
      ['Name', c.citizenName],
      ['Phone', c.phone],
      ['Voter ID', c.voterId || '—'],
      ['Ward Number', `Ward ${c.wardNumber}`],
      ['Citizen ID', c.citizenId || '—'],
      ['Submitted', formatDate(c.createdAt)],
    ])

    // Complaint Info
    section('Complaint Details')
    row('Title', c.title)
    y += 2
    section('Description')
    doc.setTextColor(40, 40, 40)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    const descLines = doc.splitTextToSize(c.description || '—', contentW - 6)
    doc.text(descLines, margin + 3, y)
    y += descLines.length * 5 + 4

    if (c.location?.address) {
      section('Location')
      doc.setTextColor(40, 40, 40)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(c.location.address, margin + 3, y)
      y += 8
    }

    // Officer Info
    if (c.assignedOfficerName) {
      section('Assigned Officer')
      twoCol([
        ['Officer Name', c.assignedOfficerName],
        ['Expected Completion', formatDate(c.expectedCompletionDate)],
      ])
    }

    if (c.remarks) {
      section('Officer Remarks')
      doc.setTextColor(40, 40, 40)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      const remarkLines = doc.splitTextToSize(c.remarks, contentW - 6)
      doc.text(remarkLines, margin + 3, y)
      y += remarkLines.length * 5 + 4
    }

    // Load and embed complaint photos
    const embedImages = async (urls, title) => {
      const validUrls = (urls || []).filter(Boolean)
      if (!validUrls.length) return
      if (y > 240) { doc.addPage(); y = 20 }
      section(title)
      for (const url of validUrls.slice(0, 4)) {
        try {
          const img = await new Promise((res, rej) => {
            const i = new Image()
            i.crossOrigin = 'anonymous'
            i.onload = () => res(i)
            i.onerror = rej
            i.src = resolveUrl(url)
          })
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          canvas.getContext('2d').drawImage(img, 0, 0)
          const imgData = canvas.toDataURL('image/jpeg', 0.8)
          const imgW = 55, imgH = (img.naturalHeight / img.naturalWidth) * imgW
          if (y + imgH > 280) { doc.addPage(); y = 20 }
          doc.addImage(imgData, 'JPEG', margin, y, imgW, Math.min(imgH, 50))
          y += Math.min(imgH, 50) + 4
        } catch { /* skip failed images */ }
      }
    }

    await embedImages(c.images, 'Complaint Photos')
    await embedImages(c.completionPhotos, 'Completion Photos')

    // Footer on every page
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFillColor(245, 245, 245)
      doc.rect(0, 287, W, 10, 'F')
      doc.setTextColor(150, 150, 150)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text('Tamilaga Vettri Kazhagam — Vikramasingapuram Complaint Management System', margin, 293)
      doc.text(`Page ${i} of ${pageCount}`, W - margin, 293, { align: 'right' })
    }

    doc.save(`${c.complaintId}.pdf`)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="All Complaints"
        subtitle={`${total} total complaints`}
        actions={
          <div className="flex gap-2">
            <button onClick={() => handleDownload('pdf')} className="px-3 py-2 text-xs font-semibold text-[#D32F2F] border border-[#D32F2F] rounded-xl hover:bg-red-50">PDF</button>
            <button onClick={() => handleDownload('excel')} className="px-3 py-2 text-xs font-semibold text-white bg-[#D32F2F] rounded-xl hover:bg-red-700">Excel</button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={filters.search} onChange={e => setFilter('search', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()}
            placeholder="Search ID, name, title..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30" />
        </div>
        <select value={filters.status} onChange={e => setFilter('status', e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none">
          {STATUSES.map(s => <option key={s} value={s}>{s ? t(`status.${s}`) : 'All Status'}</option>)}
        </select>
        <select value={filters.priority} onChange={e => setFilter('priority', e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none">
          {PRIORITIES.map(p => <option key={p} value={p}>{p ? t(`priority.${p}`) : 'All Priority'}</option>)}
        </select>
        <input value={filters.ward} onChange={e => setFilter('ward', e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()} type="number" placeholder="Ward No"
          className="w-28 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none" />
      </div>

      {loading ? <LoadingSpinner /> : complaints.length === 0 ? <EmptyState icon={Search} title="No complaints found" /> : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['ID', 'Citizen', 'Ward', 'Category', 'Title', 'Status', 'Priority', 'Officer', 'Date', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {complaints.map(c => (
                  <tr key={c._id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openDetail(c)}>
                    <td className="px-4 py-3 font-mono text-xs text-[#D32F2F] font-semibold whitespace-nowrap">{c.complaintId}</td>
                    <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
                      <p className="font-medium">{c.citizenName}</p>
                      <p className="text-gray-400">{c.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{c.wardNumber}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{categoryIcon(c.category)} {c.category}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[160px] truncate">{c.title}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{c.assignedOfficerName || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => downloadComplaintPDF(c, e)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Download PDF">
                          <Download size={15} />
                        </button>
                        <button onClick={() => handleDelete(c._id)} disabled={deleting === c._id}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Showing {complaints.length} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setFilter('page', Math.max(1, filters.page - 1))} disabled={filters.page <= 1}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button onClick={() => setFilter('page', filters.page + 1)} disabled={complaints.length < 25}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal - same as officer */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`${selected?.complaintId} — ${selected?.title}`} size="xl"
        actions={
          selected && !detailLoading && (
            <button onClick={(e) => downloadComplaintPDF(selected, e)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-all">
              <Download size={13} /> Download PDF
            </button>
          )
        }
      >
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
                  <div className="flex items-center gap-3 flex-wrap">
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
