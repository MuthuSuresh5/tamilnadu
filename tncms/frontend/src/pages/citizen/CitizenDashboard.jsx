import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { FileText, CheckCircle, Clock, Plus, AlertCircle } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { StatCard, StatusBadge, PriorityBadge, LoadingSpinner, EmptyState, PageHeader } from '../../components/shared/UI'
import { analyticsService, complaintService } from '../../services'
import { formatDate, categoryIcon } from '../../utils/helpers'

const COLORS = ['#3B82F6', '#FFC107', '#F97316', '#10B981', '#EF4444']

export default function CitizenDashboard() {
  const { t } = useTranslation()
  const { user } = useSelector(s => s.auth)
  const [stats, setStats] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([analyticsService.getCitizenStats(), complaintService.getMyComplaints()])
      .then(([s, c]) => { setStats(s.data.data); setComplaints(c.data.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner text="Loading dashboard..." />

  const pieData = stats ? [
    { name: t('status.submitted'), value: stats.submitted },
    { name: t('status.accepted'), value: stats.accepted },
    { name: t('status.processing'), value: stats.processing },
    { name: t('status.completed'), value: stats.completed },
    { name: t('status.rejected'), value: stats.rejected },
  ].filter(d => d.value > 0) : []

  return (
    <div className="space-y-6">
      <PageHeader
        title={`வணக்கம், ${user?.name} 👋`}
        subtitle={`Citizen ID: ${user?.citizenId}`}
        actions={
          <Link to="/citizen/new" className="flex items-center gap-2 px-4 py-2 bg-[#D32F2F] text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-all">
            <Plus size={16} /> {t('dashboard.newComplaint')}
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('dashboard.total')} value={stats?.total} icon={FileText} color="#D32F2F" delay={0} />
        <StatCard title={t('dashboard.accepted')} value={stats?.accepted} icon={AlertCircle} color="#FFC107" delay={0.1} />
        <StatCard title={t('dashboard.processing')} value={stats?.processing} icon={Clock} color="#F97316" delay={0.2} />
        <StatCard title={t('dashboard.completed')} value={stats?.completed} icon={CheckCircle} color="#10B981" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">{t('dashboard.recent')}</h3>
            <Link to="/citizen/complaints" className="text-xs text-[#D32F2F] font-semibold hover:underline">View all →</Link>
          </div>
          {complaints.length === 0
            ? <EmptyState icon={FileText} title="No complaints yet" description="Submit your first complaint"
                action={<Link to="/citizen/new" className="px-4 py-2 bg-[#D32F2F] text-white text-sm rounded-xl">Submit Now</Link>} />
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>{['ID', 'Category', 'Status', 'Priority', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {complaints.slice(0, 8).map(c => (
                      <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-[#D32F2F] font-semibold">{c.complaintId}</td>
                        <td className="px-4 py-3 text-gray-600">{categoryIcon(c.category)} {t(`categories.${c.category}`, c.category)}</td>
                        <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                        <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(c.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4">Status Overview</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-gray-600">{d.name}</span>
                    </div>
                    <span className="font-semibold text-gray-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <EmptyState icon={FileText} title="No data yet" />}
        </div>
      </div>
    </div>
  )
}
