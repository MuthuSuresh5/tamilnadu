import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { CheckCircle, Camera } from 'lucide-react'
import { PageHeader } from '../../components/shared/UI'
import { complaintService } from '../../services'
import { categoryIcon } from '../../utils/helpers'

const CATEGORIES = ['road', 'water', 'electricity', 'sanitation', 'drainage', 'streetlight', 'garbage', 'park', 'other']
const PRIORITIES = ['low', 'medium', 'high', 'urgent']

export default function NewComplaint() {
  const { t } = useTranslation()
  const { user } = useSelector(s => s.auth)
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [previews, setPreviews] = useState([])
  const [imageFiles, setImageFiles] = useState([])
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { citizenName: user?.name, phone: user?.phone, voterId: user?.voterId, wardNumber: user?.wardNumber }
  })

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => {
        if (k === 'images') return
        if (v !== undefined && v !== null && v !== '') fd.append(k, v)
      })
      imageFiles.forEach(f => fd.append('images', f))
      const res = await complaintService.submit(fd)
      setSuccess(res.data.data)
    } catch (e) {
      alert(e.response?.data?.message || 'Submission failed')
    }
    setSubmitting(false)
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t('success.submitted')}</h2>
          <p className="text-sm text-gray-500 mb-6">{t('success.saveNote')}</p>
          <div className="space-y-3 mb-6">
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">{t('success.complaintId')}</p>
              <p className="text-xl font-bold text-[#D32F2F]">{success.complaintId}</p>
            </div>
          </div>
          <button onClick={() => navigate('/citizen/complaints')} className="w-full py-3 bg-[#D32F2F] text-white font-bold rounded-xl hover:bg-red-700 transition-all">
            View My Complaints
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title={t('dashboard.newComplaint')} subtitle="Fill the form to submit a new complaint" />

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { name: 'citizenName', label: t('form.name'), required: true, placeholder: t('form.namePlaceholder') },
            { name: 'phone', label: t('form.phone'), required: true, type: 'tel', placeholder: '9876543210' },
            { name: 'voterId', label: t('form.voterId'), placeholder: 'ABC1234567' },
            { name: 'wardNumber', label: t('form.ward'), required: true, type: 'number', placeholder: '1-200' },
          ].map(({ name, label, required, type = 'text', placeholder }) => (
            <div key={name}>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label} {required && '*'}</label>
              <input {...register(name, { required })} type={type} placeholder={placeholder}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 ${errors[name] ? 'border-red-400' : 'border-gray-200'}`} />
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('form.category')} *</label>
            <select {...register('category', { required: true })} className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 ${errors.category ? 'border-red-400' : 'border-gray-200'}`}>
              <option value="">Select Category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{categoryIcon(c)} {t(`categories.${c}`)}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('form.priority')}</label>
            <select {...register('priority')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30">
              {PRIORITIES.map(p => <option key={p} value={p}>{t(`priority.${p}`)}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('form.title')} *</label>
          <input {...register('title', { required: true, minLength: 5 })} placeholder="Brief complaint title"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 ${errors.title ? 'border-red-400' : 'border-gray-200'}`} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('form.description')} *</label>
          <textarea {...register('description', { required: true, minLength: 20 })} rows={4} placeholder={t('form.descriptionPlaceholder')}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 ${errors.description ? 'border-red-400' : 'border-gray-200'}`} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('form.location')}</label>
          <input {...register('locationAddress')} placeholder="Street address, landmark"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('form.photo')} (max 5)</label>
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#D32F2F]/50 hover:bg-red-50/30 transition-all">
            <Camera size={20} className="text-gray-400 mb-1" />
            <p className="text-xs text-gray-400">Click to upload</p>
            <input type="file" accept="image/*" multiple className="hidden"
              onChange={e => {
                const files = Array.from(e.target.files)
                setImageFiles(files)
                setPreviews(files.map(f => URL.createObjectURL(f)))
              }} />
          </label>
          {previews.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {previews.map((src, i) => <img key={i} src={src} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />)}
            </div>
          )}
        </div>

        <button type="submit" disabled={submitting}
          className="w-full py-3.5 bg-[#D32F2F] text-white font-bold rounded-xl hover:bg-red-700 transition-all disabled:opacity-60 shadow-md">
          {submitting ? 'Submitting...' : t('form.submit')}
        </button>
      </form>
    </div>
  )
}
