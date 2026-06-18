import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, MapPin, User } from 'lucide-react'
import { LoadingSpinner, EmptyState, PageHeader, Modal } from '../../components/shared/UI'
import { wardService, officerService } from '../../services'
import { useForm } from 'react-hook-form'

export default function WardManagement() {
  const [wards, setWards] = useState([])
  const [officers, setOfficers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [assignModal, setAssignModal] = useState(false)
  const [assignData, setAssignData] = useState({ wardId: '', officerId: '' })
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const load = async () => {
    setLoading(true)
    try {
      const [w, o] = await Promise.all([wardService.getAll(), officerService.getAll()])
      setWards(w.data.data)
      setOfficers(o.data.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { reset({}); setSelected(null); setModal('form') }
  const openEdit = (w) => { reset({ wardNumber: w.wardNumber, wardName: w.wardName, wardNameTamil: w.wardNameTamil, district: w.district }); setSelected(w); setModal('form') }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      if (selected) await wardService.update(selected._id, data)
      else await wardService.create(data)
      setModal(null)
      load()
    } catch (e) { alert(e.response?.data?.message || 'Failed') }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ward?')) return
    try { await wardService.delete(id); load() } catch { alert('Delete failed') }
  }

  const handleAssign = async () => {
    setSaving(true)
    try {
      await wardService.assignOfficer(assignData)
      setAssignModal(false)
      load()
    } catch (e) { alert(e.response?.data?.message || 'Assign failed') }
    setSaving(false)
  }

  if (loading) return <LoadingSpinner text="Loading wards..." />

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ward Management"
        subtitle={`${wards.length} wards`}
        actions={
          <div className="flex gap-2">
            <button onClick={() => setAssignModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#D32F2F] border border-[#D32F2F] rounded-xl hover:bg-red-50">
              <User size={15} /> Assign Officer
            </button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-[#D32F2F] text-white text-sm font-semibold rounded-xl hover:bg-red-700">
              <Plus size={15} /> Add Ward
            </button>
          </div>
        }
      />

      {wards.length === 0 ? <EmptyState icon={MapPin} title="No wards yet" description="Create wards to manage complaints" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wards.map((w, i) => (
            <motion.div key={w._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-[#D32F2F]/10 rounded-lg flex items-center justify-center">
                      <MapPin size={15} className="text-[#D32F2F]" />
                    </div>
                    <span className="font-bold text-gray-800">Ward {w.wardNumber}</span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">{w.wardName}</p>
                  {w.wardNameTamil && <p className="text-xs text-gray-400">{w.wardNameTamil}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(w)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><Edit size={14} className="text-gray-500" /></button>
                  <button onClick={() => handleDelete(w._id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} className="text-red-500" /></button>
                </div>
              </div>

              {w.officerName ? (
                <div className="bg-green-50 rounded-xl px-3 py-2 mb-3">
                  <p className="text-xs text-green-700 font-semibold">👤 {w.officerName}</p>
                </div>
              ) : (
                <div className="bg-yellow-50 rounded-xl px-3 py-2 mb-3">
                  <p className="text-xs text-yellow-600">No officer assigned</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded-xl py-2">
                  <p className="text-sm font-bold text-gray-800">{w.totalComplaints}</p>
                  <p className="text-[10px] text-gray-400">Total</p>
                </div>
                <div className="bg-green-50 rounded-xl py-2">
                  <p className="text-sm font-bold text-green-700">{w.resolvedComplaints}</p>
                  <p className="text-[10px] text-gray-400">Resolved</p>
                </div>
                <div className="bg-orange-50 rounded-xl py-2">
                  <p className="text-sm font-bold text-orange-700">{w.pendingComplaints}</p>
                  <p className="text-[10px] text-gray-400">Pending</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Ward Form Modal */}
      <Modal isOpen={modal === 'form'} onClose={() => setModal(null)} title={selected ? 'Edit Ward' : 'Create Ward'} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {[
            { name: 'wardNumber', label: 'Ward Number', required: true, type: 'number' },
            { name: 'wardName', label: 'Ward Name (English)', required: true },
            { name: 'wardNameTamil', label: 'Ward Name (Tamil)' },
            { name: 'district', label: 'District' },
          ].map(({ name, label, required, type = 'text' }) => (
            <div key={name}>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
              <input {...register(name, { required })} type={type}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 ${errors[name] ? 'border-red-400' : 'border-gray-200'}`} />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#D32F2F] text-white text-sm font-bold rounded-xl hover:bg-red-700 disabled:opacity-60">
              {saving ? 'Saving...' : selected ? 'Save Changes' : 'Create Ward'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Officer Modal */}
      <Modal isOpen={assignModal} onClose={() => setAssignModal(false)} title="Assign Officer to Ward" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Select Ward</label>
            <select value={assignData.wardId} onChange={e => setAssignData(d => ({ ...d, wardId: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30">
              <option value="">Select Ward</option>
              {wards.map(w => <option key={w._id} value={w._id}>Ward {w.wardNumber} - {w.wardName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Select Officer</label>
            <select value={assignData.officerId} onChange={e => setAssignData(d => ({ ...d, officerId: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30">
              <option value="">Select Officer</option>
              {officers.map(o => <option key={o._id} value={o._id}>{o.name} - {o.phone}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setAssignModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50">Cancel</button>
            <button onClick={handleAssign} disabled={saving || !assignData.wardId || !assignData.officerId}
              className="flex-1 py-2.5 bg-[#D32F2F] text-white text-sm font-bold rounded-xl hover:bg-red-700 disabled:opacity-60">
              {saving ? 'Assigning...' : 'Assign Officer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
