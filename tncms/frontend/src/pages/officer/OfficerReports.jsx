import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { FileText, Table, Download, Filter } from 'lucide-react'
import { PageHeader } from '../../components/shared/UI'
import { reportService } from '../../services'
import { downloadBlob } from '../../utils/helpers'

const STATUSES = ['', 'submitted', 'accepted', 'processing', 'completed', 'rejected']

export default function OfficerReports() {
  const { user } = useSelector(s => s.auth)
  const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '' })
  const [loading, setLoading] = useState({ pdf: false, excel: false })

  const handleDownload = async (type) => {
    setLoading(l => ({ ...l, [type]: true }))
    try {
      const params = { ward: user?.wardNumber }
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
      const res = type === 'pdf'
        ? await reportService.downloadPDF(params)
        : await reportService.downloadExcel(params)
      downloadBlob(res.data, `ward${user?.wardNumber}-report.${type === 'pdf' ? 'pdf' : 'xlsx'}`)
    } catch { alert('Download failed') }
    setLoading(l => ({ ...l, [type]: false }))
  }

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader title="Ward Reports" subtitle={`Generate reports for Ward ${user?.wardNumber}`} />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Filter size={16} className="text-[#D32F2F]" />
          <h3 className="font-semibold text-gray-800">Filter</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
            <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30">
              {STATUSES.map(s => <option key={s} value={s}>{s || 'All'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">From</label>
            <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">To</label>
            <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none" />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { type: 'pdf', label: 'PDF Report', sub: 'Formatted document', icon: FileText, color: 'red' },
          { type: 'excel', label: 'Excel Report', sub: 'Spreadsheet data', icon: Table, color: 'green' },
        ].map(({ type, label, sub, icon: Icon, color }) => (
          <motion.button key={type}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => handleDownload(type)} disabled={loading[type]}
            className={`flex items-center gap-3 p-5 bg-white border-2 rounded-2xl transition-all disabled:opacity-60
              ${color === 'red' ? 'border-red-100 hover:border-[#D32F2F] hover:bg-red-50/30' : 'border-green-100 hover:border-green-500 hover:bg-green-50/30'}`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color === 'red' ? 'bg-red-50' : 'bg-green-50'}`}>
              <Icon size={22} className={color === 'red' ? 'text-[#D32F2F]' : 'text-green-600'} />
            </div>
            <div className="text-left flex-1">
              <p className="font-bold text-gray-800 text-sm">{loading[type] ? 'Generating...' : label}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
            {!loading[type] && <Download size={16} className="text-gray-400" />}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
