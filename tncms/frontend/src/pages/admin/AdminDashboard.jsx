import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { FileText, Users, MapPin, TrendingUp, CheckCircle, Clock, AlertCircle, BarChart2 } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { StatCard, LoadingSpinner, PageHeader } from '../../components/shared/UI'
import { analyticsService, reportService } from '../../services'
import { downloadBlob } from '../../utils/helpers'

const PIE_COLORS = ['#D32F2F', '#FFC107', '#10B981', '#3B82F6', '#F97316', '#8B5CF6', '#EC4899', '#14B8A6', '#6B7280']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function AdminDashboard() {
  const { t } = useTranslation()
  const { user } = useSelector(s => s.auth)
  const [stats, setStats] = useState(null)
  const [categoryData, setCategoryData] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [heatmapData, setHeatmapData] = useState([])
  const [priorityData, setPriorityData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      analyticsService.getDashboard(),
      analyticsService.getCategory(),
      analyticsService.getMonthly(new Date().getFullYear()),
      analyticsService.getWardHeatmap(),
      analyticsService.getPriority(),
    ]).then(([s, cat, monthly, heatmap, priority]) => {
      setStats(s.data.data)
      setCategoryData(cat.data.data.map(d => ({ name: d._id, value: d.count })))
      // Transform monthly
      const monthMap = {}
      monthly.data.data.forEach(({ _id, count }) => {
        const m = MONTHS[_id.month - 1]
        if (!monthMap[m]) monthMap[m] = { month: m }
        monthMap[m][_id.status] = count
      })
      setMonthlyData(Object.values(monthMap))
      setHeatmapData(heatmap.data.data.slice(0, 15))
      setPriorityData(priority.data.data.map(d => ({ name: d._id, value: d.count })))
    }).finally(() => setLoading(false))
  }, [])

  const handleDownload = async (type) => {
    try {
      const res = type === 'pdf' ? await reportService.downloadPDF({}) : await reportService.downloadExcel({})
      downloadBlob(res.data, `complaints.${type === 'pdf' ? 'pdf' : 'xlsx'}`)
    } catch { alert('Download failed') }
  }

  if (loading) return <LoadingSpinner text="Loading analytics..." />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Tamil Nadu Complaint Management Analytics"
        actions={
          <div className="flex items-center gap-2">
            {user?.designation && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#D32F2F]/10 text-[#D32F2F] border border-[#D32F2F]/20">
                {user.designation}
              </span>
            )}
            <button onClick={() => handleDownload('pdf')} className="px-4 py-2 text-sm font-semibold text-[#D32F2F] border border-[#D32F2F] rounded-xl hover:bg-red-50 transition-all">📄 PDF</button>
            <button onClick={() => handleDownload('excel')} className="px-4 py-2 text-sm font-semibold text-white bg-[#D32F2F] rounded-xl hover:bg-red-700 transition-all">📊 Excel</button>
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Complaints" value={stats?.total} icon={FileText} color="#D32F2F" delay={0} />
        <StatCard title="Total Officers" value={stats?.totalOfficers} icon={Users} color="#3B82F6" delay={0.1} />
        <StatCard title="Active Wards" value={stats?.totalWards} icon={MapPin} color="#10B981" delay={0.2} />
        <StatCard title="Resolution Rate" value={`${stats?.resolutionRate || 0}%`} icon={TrendingUp} color="#FFC107" delay={0.3} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Submitted" value={stats?.total - stats?.completed - stats?.rejected} icon={AlertCircle} color="#6B7280" delay={0.1} />
        <StatCard title="Processing" value={stats?.processing} icon={Clock} color="#F97316" delay={0.2} />
        <StatCard title="Completed" value={stats?.completed} icon={CheckCircle} color="#10B981" delay={0.3} />
        <StatCard title="Rejected" value={stats?.rejected} icon={AlertCircle} color="#EF4444" delay={0.4} />
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-5">Monthly Complaint Trend ({new Date().getFullYear()})</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="submitted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D32F2F" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#D32F2F" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="completed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="submitted" stroke="#D32F2F" fill="url(#submitted)" strokeWidth={2} />
            <Area type="monotone" dataKey="completed" stroke="#10B981" fill="url(#completed)" strokeWidth={2} />
            <Area type="monotone" dataKey="processing" stroke="#F97316" fill="none" strokeWidth={2} strokeDasharray="4 4" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Pie */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4">Complaints by Category</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}>
                  {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {categoryData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-gray-600 capitalize">{d.name}</span>
                  </div>
                  <span className="font-semibold text-gray-800">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Priority Bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4">Complaints by Priority</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#D32F2F" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ward Heatmap */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-5">Ward-wise Complaint Heatmap (Top 15)</h3>
        <div className="space-y-3">
          {heatmapData.map((w) => {
            const pct = w.total > 0 ? (w.completed / w.total) * 100 : 0
            const intensity = Math.min(1, w.total / 50)
            return (
              <div key={w._id} className="flex items-center gap-4">
                <span className="text-xs font-semibold text-gray-500 w-16 flex-shrink-0">Ward {w._id}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(w.total / (heatmapData[0]?.total || 1)) * 100}%`, backgroundColor: `rgba(211,47,47,${0.3 + intensity * 0.7})` }} />
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 w-32 flex-shrink-0">
                  <span>{w.total} total</span>
                  <span className="text-green-600">{w.completed} done</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
