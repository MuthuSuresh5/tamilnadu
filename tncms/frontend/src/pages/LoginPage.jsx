import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Shield, Eye, EyeOff, Phone, Lock, CreditCard } from 'lucide-react'
import { loginUser, clearError } from '../store/slices/authSlice'

export default function LoginPage() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector(s => s.auth)
  const [showPass, setShowPass] = useState(false)
  const { register, handleSubmit, formState: { errors }, watch } = useForm()

  const onSubmit = async (data) => {
    const result = await dispatch(loginUser(data))
    if (result.meta.requestStatus === 'fulfilled') {
      const role = result.payload.data.role
      navigate(role === 'admin' ? '/admin' : role === 'officer' ? '/officer' : '/citizen')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-[#D32F2F] to-red-700 p-8 text-white text-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold">TN Citizen Portal</h1>
          <p className="text-red-100 text-sm mt-1">{t('auth.loginTitle')}</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number *</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  {...register('phone', { required: true, pattern: /^[6-9]\d{9}$/ })}
                  type="tel" placeholder="9876543210"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 ${errors.phone ? 'border-red-400' : 'border-gray-200'}`}
                  onChange={() => dispatch(clearError())}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Voter ID *</label>
              <div className="relative">
                <CreditCard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  {...register('voterId', { required: true })}
                  type="text" placeholder="ABC1234567"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 uppercase ${errors.voterId ? 'border-red-400' : 'border-gray-200'}`}
                  onChange={() => dispatch(clearError())}
                />
              </div>
            </div>

            <input type="hidden" {...register('password')} value={watch('voterId') || ''} />

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#D32F2F] text-white font-bold rounded-xl hover:bg-red-700 transition-all disabled:opacity-60 shadow-md mt-2">
              {loading ? 'Logging in...' : t('auth.loginTitle')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-[#D32F2F] font-semibold hover:underline">{t('nav.register')}</Link>
          </p>
          <p className="text-center mt-3">
            <Link to="/" className="text-xs text-gray-400 hover:text-gray-600">← Back to Home</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
