import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Shield, Eye, EyeOff } from 'lucide-react'
import { registerUser, clearError } from '../store/slices/authSlice'

export default function RegisterPage() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector(s => s.auth)
  const [showPass, setShowPass] = useState(false)
  const { register, handleSubmit, formState: { errors }, watch } = useForm()

  const onSubmit = async (data) => {
    const result = await dispatch(registerUser(data))
    if (result.meta.requestStatus === 'fulfilled') navigate('/citizen')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#D32F2F] to-red-700 p-6 text-white text-center">
          <Shield size={32} className="mx-auto mb-2" />
          <h1 className="text-xl font-bold">Create Account</h1>
          <p className="text-red-100 text-sm">{t('auth.registerTitle')}</p>
        </div>

        <div className="p-6">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('form.name')} *</label>
                <input {...register('name', { required: true, minLength: 3 })} placeholder={t('form.namePlaceholder')}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 ${errors.name ? 'border-red-400' : 'border-gray-200'}`} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('form.phone')} *</label>
                <input {...register('phone', { required: true, pattern: /^[6-9]\d{9}$/ })} type="tel" placeholder="9876543210"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 ${errors.phone ? 'border-red-400' : 'border-gray-200'}`}
                  onChange={() => dispatch(clearError())} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                <input {...register('email', { pattern: /^\S+@\S+\.\S+$/ })} type="email" placeholder="email@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('form.voterId')}</label>
                <input {...register('voterId')} placeholder="ABC1234567"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 uppercase" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('form.ward')}</label>
                <input {...register('wardNumber', { min: 1 })} type="number" placeholder="Ward Number"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('auth.passwordPlaceholder')} *</label>
                <div className="relative">
                  <input {...register('password', { required: true, minLength: 6 })} type={showPass ? 'text' : 'password'} placeholder="Min 6 characters"
                    className={`w-full pr-10 px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 ${errors.password ? 'border-red-400' : 'border-gray-200'}`} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
              <input {...register('address')} placeholder="Street, City, District"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#D32F2F] text-white font-bold rounded-xl hover:bg-red-700 transition-all disabled:opacity-60 shadow-md">
              {loading ? 'Creating Account...' : t('auth.registerTitle')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-[#D32F2F] font-semibold hover:underline">{t('nav.login')}</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
