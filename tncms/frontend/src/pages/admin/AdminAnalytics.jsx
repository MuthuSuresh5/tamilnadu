import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, BarChart2, PieChart as PieIcon, Activity } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import { LoadingSpinner, PageHeader, StatCard } from '../../components/shared/UI'
import { analyticsService } from '../../services'

const PIE_COLORS = ['#D32F2F', '#FFC107', '#10B981', '#3B82F6', '#F97316', '#8B5CF6', '#EC4899', '#14B8A6', '#6B7280']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null)
  const [categoryData, setCategoryData] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [heatmapData, setHeatmapData] = useState([])
  const [priorityData, setPriorityData] = useState([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [s, cat, monthly, heatmap, priority] = await Promise.all([
        analyticsService.getDashboard(),
        analyticsService.getCategory(),
        analyticsService.getMonthly(year),
        analyticsService.getWardHeatmap(),
        analyticsService.getPriority(),
      ])
      setStats(s.data.data)
      setCategoryData(cat.data.data.map(d => ({ name: d._id, value: d.count })))
      const monthMap = {}
      monthly.data.data.forEach(({ _id, count }) => {
        const m = MONTHS[_id.month - 1]
        if (!monthMap[m]) monthMap[m] = { month: m, submitted: 0, completed: 0, processing: 0 }
        monthMap[m][_id.status] = count
      })
      setMonthlyData(Object.values(monthMap))
      setHeatmapData(heatmap.data.data.slice(0, 20))
      setPriorityData(priority.data.data.map(d => ({ name: d._id, value: d.count })))
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [year])

  const resolutionByWard = heatmapData.map(w => ({
    ward: `W${w._id}`,
    rate: w.total > 0 ? Math.round((w.completed / w.total) * 100) : 0,
    total: w.total,
  }))

  if (loading) return <LoadingSpinner text="Loading analytics..." />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Reports"
        subtitle="Comprehensive complaint data insights"
        actions={
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Complaints" value={stats?.total} icon={Activity} color="#D32F2F" delay={0} />
        <StatCard title="Resolution Rate" value={`${stats?.resolutionRate || 0}%`} icon={TrendingUp} color="#10B981" delay={0.1} />
        <StatCard title="Total Officers" value={stats?.totalOfficers} icon={BarChart2} color="#3B82F6" delay={0.2} />
        <StatCard title="Active Wards" value={stats?.totalWards} icon={PieIcon} color="#FFC107" delay={0.3} />
      </div>

      {/* Monthly Area Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-5">Monthly Trend — {year}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlyData}>
            <defs>
              {[['red', '#D32F2F'], ['green', '#10B981'], ['orange', '#F97316']].map(([id, color]) => (
                <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="submitted" name="Submitted" stroke="#D32F2F" fill="url(#red)" strokeWidth={2} />
            <Area type="monotone" dataKey="completed" name="Completed" stroke="#10B981" fill="url(#green)" strokeWidth={2} />
            <Area type="monotone" dataKey="processing" name="Processing" stroke="#F97316" fill="url(#orange)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Category + Priority Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4">By Category</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {categoryData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-gray-600 capitalize">{d.name}</span>
                  </div>
                  <span className="font-bold text-gray-800">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4">By Priority</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priorityData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#D32F2F" radius={[6, 6, 0, 0]}>
                {priorityData.map((d, i) => {
                  const colors = { low: '#10B981', medium: '#3B82F6', high: '#F97316', urgent: '#D32F2F' }
                  return <Cell key={i} fill={colors[d.name] || '#D32F2F'} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Ward Resolution Rate */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-5">Ward Resolution Rate (%)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={resolutionByWard}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="ward" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
            <Tooltip formatter={(v) => `${v}%`} />
            <Bar dataKey="rate" name="Resolution %" fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Ward Heatmap Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-5">Ward-wise Heatmap</h3>
        <div className="space-y-3">
          {heatmapData.map(w => {
            const pct = w.total > 0 ? (w.completed / w.total) * 100 : 0
            const barPct = (w.total / (heatmapData[0]?.total || 1)) * 100
            const color = pct >= 75 ? '#10B981' : pct >= 40 ? '#FFC107' : '#D32F2F'
            return (
              <div key={w._id} className="flex items-center gap-4">
                <span className="text-xs font-bold text-gray-500 w-16 shrink-0">Ward {w._id}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${barPct}%`, backgroundColor: color }} />
                </div>
                <div className="flex gap-4 text-xs shrink-0">
                  <span className="text-gray-500 w-16">{w.total} total</span>
                  <span className="text-green-600 w-16">{w.completed} done</span>
                  <span className="font-bold w-12" style={{ color }}>{Math.round(pct)}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
