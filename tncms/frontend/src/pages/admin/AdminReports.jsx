import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Table, Filter } from 'lucide-react'
import { PageHeader } from '../../components/shared/UI'
import { reportService } from '../../services'
import { downloadBlob } from '../../utils/helpers'

const STATUSES = ['', 'submitted', 'accepted', 'processing', 'completed', 'rejected']

export default function AdminReports() {
  const [filters, setFilters] = useState({ ward: '', status: '', startDate: '', endDate: '' })
  const [loading, setLoading] = useState({ pdf: false, excel: false })

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }))

  const handleDownload = async (type) => {
    setLoading(l => ({ ...l, [type]: true }))
    try {
      const params = {}
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
      const res = type === 'pdf'
        ? await reportService.downloadPDF(params)
        : await reportService.downloadExcel(params)
      downloadBlob(res.data, `tncms-report-${Date.now()}.${type === 'pdf' ? 'pdf' : 'xlsx'}`)
    } catch { alert('Download failed. Please try again.') }
    setLoading(l => ({ ...l, [type]: false }))
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Generate Reports" subtitle="Download complaint reports as PDF or Excel" />

      {/* Filter Panel */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Filter size={16} className="text-[#D32F2F]" />
          <h3 className="font-semibold text-gray-800">Filter Options</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ward Number</label>
            <input
              type="number" value={filters.ward} onChange={e => setFilter('ward', e.target.value)}
              placeholder="All wards"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
            <select value={filters.status} onChange={e => setFilter('status', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30">
              {STATUSES.map(s => <option key={s} value={s}>{s || 'All Status'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">From Date</label>
            <input type="date" value={filters.startDate} onChange={e => setFilter('startDate', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">To Date</label>
            <input type="date" value={filters.endDate} onChange={e => setFilter('endDate', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30" />
          </div>
        </div>

        <button onClick={() => setFilters({ ward: '', status: '', startDate: '', endDate: '' })}
          className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors">
          Clear all filters
        </button>
      </motion.div>

      {/* Download Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          onClick={() => handleDownload('pdf')} disabled={loading.pdf}
          className="flex items-center justify-center gap-3 p-6 bg-white border-2 border-[#D32F2F]/20 rounded-2xl hover:border-[#D32F2F] hover:bg-red-50/30 transition-all group disabled:opacity-60"
        >
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center group-hover:bg-[#D32F2F]/10 transition-colors">
            <FileText size={24} className="text-[#D32F2F]" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-800">{loading.pdf ? 'Generating...' : 'Download PDF'}</p>
            <p className="text-xs text-gray-400 mt-0.5">Formatted complaint report</p>
          </div>
          {!loading.pdf && <Download size={18} className="text-gray-400 ml-auto" />}
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          onClick={() => handleDownload('excel')} disabled={loading.excel}
          className="flex items-center justify-center gap-3 p-6 bg-white border-2 border-green-200 rounded-2xl hover:border-green-500 hover:bg-green-50/30 transition-all group disabled:opacity-60"
        >
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
            <Table size={24} className="text-green-600" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-800">{loading.excel ? 'Generating...' : 'Download Excel'}</p>
            <p className="text-xs text-gray-400 mt-0.5">Spreadsheet with ward summary</p>
          </div>
          {!loading.excel && <Download size={18} className="text-gray-400 ml-auto" />}
        </motion.button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
        <p className="text-sm font-semibold text-blue-700 mb-2">📋 Report Contents</p>
        <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
          <li>All complaint details (ID, citizen, ward, category, status, priority)</li>
          <li>Assigned officer information</li>
          <li>Submitted and completed dates</li>
          <li>Excel includes separate Ward Summary sheet</li>
          <li>Up to 5,000 records per export</li>
        </ul>
      </div>
    </div>
  )
}
