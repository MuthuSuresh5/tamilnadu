import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Key, Users } from 'lucide-react'
import { LoadingSpinner, EmptyState, PageHeader, Modal } from '../../components/shared/UI'
import { officerService, wardService } from '../../services'
import { useForm } from 'react-hook-form'

export default function OfficerManagement() {
  const [officers, setOfficers] = useState([])
  const [wards, setWards] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'create' | 'edit' | 'reset'
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const resetForm = useForm()

  const load = async () => {
    setLoading(true)
    try {
      const [o, w] = await Promise.all([officerService.getAll(), wardService.getAll()])
      setOfficers(o.data?.data || [])
      setWards(w.data?.data || [])
    } catch (e) {
      console.error('Failed to load officers/wards:', e)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { reset({}); setSelected(null); setModal('create') }
  const openEdit = (o) => { reset({ name: o.name, phone: o.phone, email: o.email, wardNumber: o.wardNumber }); setSelected(o); setModal('edit') }
  const openReset = (o) => { resetForm.reset({}); setSelected(o); setModal('reset') }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      if (modal === 'create' || modal === 'edit') {
        const fd = new FormData()
        Object.entries(data).forEach(([k, v]) => v !== undefined && v !== '' && fd.append(k, v))
        if (modal === 'create') await officerService.create(fd)
        else await officerService.update(selected._id, fd)
      } else if (modal === 'reset') {
        await officerService.resetPassword(selected._id, { newPassword: data.newPassword })
      }
      setModal(null)
      load()
    } catch (e) {
      alert(e.response?.data?.message || 'Operation failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this officer?')) return
    try { await officerService.delete(id); load() } catch { alert('Delete failed') }
  }

  if (loading) return <LoadingSpinner text="Loading officers..." />

  return (
    <div className="space-y-5">
      <PageHeader
        title="Officer Management"
        subtitle={`${officers.length} officers`}
        actions={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-[#D32F2F] text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-all">
            <Plus size={16} /> Add Officer
          </button>
        }
      />

      {officers.length === 0 ? <EmptyState icon={Users} title="No officers yet" description="Create ward officers to assign complaints" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {officers.map((o, i) => (
            <motion.div key={o._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-4">
                {o.profilePhoto
                  ? <img src={o.profilePhoto} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-100" />
                  : <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D32F2F] to-red-400 flex items-center justify-center text-white font-bold text-lg">{o.name?.[0]}</div>
                }
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{o.name}</p>
                  <p className="text-xs text-gray-500">{o.phone}</p>
                  <p className="text-xs text-gray-400">{o.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-50 px-3 py-1.5 rounded-lg">
                  <p className="text-xs text-blue-600 font-semibold">Ward {o.wardNumber || '—'}</p>
                </div>
                <div className="bg-green-50 px-3 py-1.5 rounded-lg">
                  <p className="text-xs text-green-600 font-semibold">{o.totalResolved} Resolved</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(o)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <Edit size={13} /> Edit
                </button>
                <button onClick={() => openReset(o)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-50 transition-colors">
                  <Key size={13} /> Reset
                </button>
                <button onClick={() => handleDelete(o._id)} className="p-2 text-red-500 border border-red-100 rounded-xl hover:bg-red-50 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal isOpen={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)}
        title={modal === 'create' ? 'Add New Officer' : 'Edit Officer'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'name', label: 'Full Name', required: true },
              { name: 'phone', label: 'Phone', required: modal === 'create', type: 'tel' },
              { name: 'email', label: 'Email', type: 'email' },
              { name: 'wardNumber', label: 'Ward Number', type: 'number' },
            ].map(({ name, label, required, type = 'text' }) => (
              <div key={name}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                <input {...register(name, { required })} type={type}
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 ${errors[name] ? 'border-red-400' : 'border-gray-200'}`} />
              </div>
            ))}
          </div>
          {modal === 'create' && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Password *</label>
              <input {...register('password', { required: true, minLength: 6 })} type="password" placeholder="Min 6 characters"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30" />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#D32F2F] text-white text-sm font-bold rounded-xl hover:bg-red-700 disabled:opacity-60">
              {saving ? 'Saving...' : modal === 'create' ? 'Create Officer' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={modal === 'reset'} onClose={() => setModal(null)} title={`Reset Password: ${selected?.name}`} size="sm">
        <form onSubmit={resetForm.handleSubmit(async (data) => {
          setSaving(true)
          try {
            await officerService.resetPassword(selected._id, { newPassword: data.newPassword })
            setModal(null)
          } catch (e) {
            alert(e.response?.data?.message || 'Reset failed')
          } finally {
            setSaving(false)
          }
        })} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">New Password *</label>
            <input {...resetForm.register('newPassword', { required: true, minLength: 6 })} type="password" placeholder="Min 6 characters"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#D32F2F] text-white text-sm font-bold rounded-xl hover:bg-red-700 disabled:opacity-60">
              {saving ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
