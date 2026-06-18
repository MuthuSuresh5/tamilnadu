import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Trash2, Download } from 'lucide-react'
import { StatusBadge, PriorityBadge, LoadingSpinner, EmptyState, PageHeader } from '../../components/shared/UI'
import { complaintService, reportService } from '../../services'
import { formatDate, categoryIcon, downloadBlob } from '../../utils/helpers'

const STATUSES = ['', 'submitted', 'accepted', 'processing', 'completed', 'rejected']
const PRIORITIES = ['', 'low', 'medium', 'high', 'urgent']

export default function AdminComplaints() {
  const { t } = useTranslation()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', ward: '', page: 1 })
  const [total, setTotal] = useState(0)
  const [deleting, setDeleting] = useState(null)

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

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }))

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
                  <tr key={c._id} className="hover:bg-gray-50 transition-colors">
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
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(c._id)} disabled={deleting === c._id}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
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
    </div>
  )
}
