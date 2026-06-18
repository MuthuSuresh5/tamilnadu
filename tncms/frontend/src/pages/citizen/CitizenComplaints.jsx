import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { FileText, Search } from 'lucide-react'
import { StatusBadge, PriorityBadge, LoadingSpinner, EmptyState, PageHeader } from '../../components/shared/UI'
import { complaintService } from '../../services'
import { formatDate, categoryIcon, resolveUrl } from '../../utils/helpers'

export default function CitizenComplaints() {
  const { t } = useTranslation()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    complaintService.getMyComplaints()
      .then(r => setComplaints(r.data.data))
      .finally(() => setLoading(false))
  }, [])

  const filtered = complaints.filter(c =>
    c.complaintId.includes(search.toUpperCase()) ||
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.includes(search.toLowerCase())
  )

  if (loading) return <LoadingSpinner text="Loading complaints..." />

  return (
    <div className="space-y-6">
      <PageHeader title="My Complaints" subtitle={`${complaints.length} total complaints`} />

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by ID, title or category..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
        />
      </div>

      {filtered.length === 0
        ? <EmptyState icon={FileText} title="No complaints found" />
        : (
          <div className="space-y-3">
            {filtered.map((c, i) => (
              <motion.div key={c._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelected(selected?._id === c._id ? null : c)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-2xl flex-shrink-0">{categoryIcon(c.category)}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{c.title}</p>
                      <p className="text-xs text-[#D32F2F] font-mono font-semibold mt-0.5">{c.complaintId}</p>
                      <p className="text-xs text-gray-500 mt-1">Ward {c.wardNumber} · {formatDate(c.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <StatusBadge status={c.status} />
                    <PriorityBadge priority={c.priority} />
                  </div>
                </div>

                {selected?._id === c._id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    <p className="text-sm text-gray-600">{c.description}</p>
                    {c.assignedOfficerName && (
                      <p className="text-sm text-gray-600"><span className="font-semibold">Officer:</span> {c.assignedOfficerName}</p>
                    )}
                    {c.remarks && (
                      <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
                        <p className="text-xs text-yellow-700 font-semibold mb-1">Officer Remarks</p>
                        <p className="text-sm text-gray-700">{c.remarks}</p>
                      </div>
                    )}
                    {c.images?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2">Complaint Photos</p>
                        <div className="flex gap-2 flex-wrap">
                          {c.images.map((src, idx) => (
                            <a key={idx} href={resolveUrl(src)} target="_blank" rel="noreferrer">
                              <img src={resolveUrl(src)} alt="" className="w-20 h-20 rounded-xl object-cover border border-gray-100 hover:opacity-80 transition-opacity" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {c.completionPhotos?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2">Completion Photos</p>
                        <div className="flex gap-2 flex-wrap">
                          {c.completionPhotos.map((src, idx) => (
                            <a key={idx} href={resolveUrl(src)} target="_blank" rel="noreferrer">
                              <img src={resolveUrl(src)} alt="" className="w-20 h-20 rounded-xl object-cover border border-green-100 hover:opacity-80 transition-opacity" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )
      }
    </div>
  )
}
