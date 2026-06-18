import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { UserCog, Trash2, Plus, X } from 'lucide-react'
import { PageHeader, LoadingSpinner } from '../../components/shared/UI'
import { officerService } from '../../services'

const ADMIN_ROLES = [
  { value: 'super_admin', label: 'Super Admin', desc: 'Full access to all modules' },
  { value: 'complaints_admin', label: 'Complaints Admin', desc: 'Manage complaints, analytics & reports' },
  { value: 'analytics_admin', label: 'Analytics Admin', desc: 'View analytics & download reports' },
  { value: 'officer_admin', label: 'Officer Admin', desc: 'Manage officers & wards' },
]

const ROLE_COLORS = {
  super_admin: 'bg-purple-100 text-purple-700',
  complaints_admin: 'bg-blue-100 text-blue-700',
  analytics_admin: 'bg-green-100 text-green-700',
  officer_admin: 'bg-yellow-100 text-yellow-700',
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const load = () => {
    officerService.getAdmins()
      .then(r => setAdmins(r.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const onSubmit = async (data) => {
    setCreating(true)
    try {
      await officerService.createAdmin(data)
      reset()
      setShowForm(false)
      load()
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to create admin')
    }
    setCreating(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this admin?')) return
    try {
      await officerService.deleteAdmin(id)
      setAdmins(prev => prev.filter(a => a._id !== id))
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete admin')
    }
  }

  if (loading) return <LoadingSpinner text="Loading admins..." />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Management"
        subtitle={`${admins.length} admins registered`}
        actions={
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-[#D32F2F] text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-all">
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'New Admin'}
          </button>
        }
      />

      {/* Role Reference */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ADMIN_ROLES.map(r => (
          <div key={r.value} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[r.value]}`}>{r.label}</span>
            <p className="text-xs text-gray-500 mt-2">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Create Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4">Create New Admin</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Name *</label>
              <input {...register('name', { required: true })} placeholder="Full name"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 ${errors.name ? 'border-red-400' : 'border-gray-200'}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone *</label>
              <input {...register('phone', { required: true })} placeholder="10-digit phone"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 ${errors.phone ? 'border-red-400' : 'border-gray-200'}`} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
              <input {...register('email')} type="email" placeholder="admin@tn.gov.in"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password *</label>
              <input {...register('password', { required: true, minLength: 6 })} type="password" placeholder="Min 6 characters"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 ${errors.password ? 'border-red-400' : 'border-gray-200'}`} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Admin Role *</label>
              <select {...register('adminRole', { required: true })}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 ${errors.adminRole ? 'border-red-400' : 'border-gray-200'}`}>
                <option value="">Select Role</option>
                {ADMIN_ROLES.map(r => <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={creating}
                className="px-6 py-2.5 bg-[#D32F2F] text-white font-semibold rounded-xl hover:bg-red-700 transition-all disabled:opacity-60 text-sm">
                {creating ? 'Creating...' : 'Create Admin'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Admins Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Name', 'Phone', 'Email', 'Role', 'Created', 'Action'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {admins.map((a, i) => (
              <motion.tr key={a._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-semibold text-gray-800">{a.name}</td>
                <td className="px-4 py-3 text-gray-600">{a.phone}</td>
                <td className="px-4 py-3 text-gray-500">{a.email || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[a.adminRole || 'super_admin']}`}>
                    {ADMIN_ROLES.find(r => r.value === (a.adminRole || 'super_admin'))?.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(a.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(a._id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={15} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {admins.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">No admins found</div>
        )}
      </div>
    </div>
  )
}
