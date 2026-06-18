import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Camera, Save, Lock } from 'lucide-react'
import { PageHeader } from '../components/shared/UI'
import { authService } from '../services'
import { setUser } from '../store/slices/authSlice'
import { resolveUrl } from '../utils/helpers'

export default function ProfilePage() {
  const dispatch = useDispatch()
  const { user } = useSelector(s => s.auth)
  const [saving, setSaving] = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const [preview, setPreview] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [tab, setTab] = useState('profile')

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: { name: user?.name, email: user?.email, address: user?.address, designation: user?.designation }
  })
  const { register: regPw, handleSubmit: handlePw, formState: { errors: pwErrors }, reset: resetPw } = useForm()

  const onSaveProfile = async (data) => {
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => v && fd.append(k, v))
      if (photoFile) fd.append('photo', photoFile)
      const res = await authService.updateProfile(fd)
      dispatch(setUser(res.data.data))
      alert('Profile updated!')
    } catch (e) { alert(e.response?.data?.message || 'Update failed') }
    setSaving(false)
  }

  const onChangePw = async (data) => {
    if (data.newPassword !== data.confirmPassword) { alert('Passwords do not match'); return }
    setChangingPw(true)
    try {
      await authService.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword })
      resetPw()
      alert('Password changed!')
    } catch (e) { alert(e.response?.data?.message || 'Change failed') }
    setChangingPw(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Profile" subtitle="Manage your account information" />

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-5">
        <div className="relative">
          {preview || user?.profilePhoto
            ? <img src={preview || resolveUrl(user.profilePhoto)} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-[#D32F2F]" />
            : <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D32F2F] to-red-400 flex items-center justify-center text-white text-3xl font-bold">{user?.name?.[0]}</div>
          }
          <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#D32F2F] rounded-lg flex items-center justify-center cursor-pointer hover:bg-red-700 transition-colors">
            <Camera size={13} className="text-white" />
            <input type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files[0]
                if (f) { setPhotoFile(f); setPreview(URL.createObjectURL(f)) }
              }} />
          </label>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-800">{user?.name}</p>
          <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
          {user?.designation && <p className="text-xs font-semibold text-[#D32F2F] mt-0.5">{user.designation}</p>}
          {user?.citizenId && <p className="text-xs text-[#D32F2F] font-mono mt-1">{user.citizenId}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {['profile', 'security'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all capitalize ${tab === t ? 'bg-white text-[#D32F2F] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'profile' ? (
        <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit(onSaveProfile)}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'name', label: 'Full Name', required: true },
              { name: 'email', label: 'Email', type: 'email' },
              { name: 'address', label: 'Address' },
            ].map(({ name, label, required, type = 'text' }) => (
              <div key={name} className={name === 'address' ? 'md:col-span-2' : ''}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                <input {...register(name, { required })} type={type}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 ${errors[name] ? 'border-red-400' : 'border-gray-200'}`} />
              </div>
            ))}
            {user?.role === 'admin' && (
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Designation / Title</label>
                <input {...register('designation')} placeholder="e.g. President, Vice President, District Head..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30" />
                <p className="text-xs text-gray-400 mt-1">This will be displayed on your dashboard and sidebar</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Phone</p>
              <p className="text-sm font-semibold text-gray-700">{user?.phone}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Voter ID</p>
              <p className="text-sm font-semibold text-gray-700">{user?.voterId || '—'}</p>
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#D32F2F] text-white font-bold rounded-xl hover:bg-red-700 transition-all disabled:opacity-60">
            <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </motion.form>
      ) : (
        <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handlePw(onChangePw)}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          {[
            { name: 'currentPassword', label: 'Current Password' },
            { name: 'newPassword', label: 'New Password' },
            { name: 'confirmPassword', label: 'Confirm New Password' },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
              <input {...regPw(name, { required: true, minLength: name === 'currentPassword' ? 1 : 6 })} type="password" placeholder="••••••••"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 ${pwErrors[name] ? 'border-red-400' : 'border-gray-200'}`} />
            </div>
          ))}
          <button type="submit" disabled={changingPw}
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#D32F2F] text-white font-bold rounded-xl hover:bg-red-700 transition-all disabled:opacity-60">
            <Lock size={16} /> {changingPw ? 'Changing...' : 'Change Password'}
          </button>
        </motion.form>
      )}
    </div>
  )
}
