import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    // Network error / server down
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your connection.'))
    }

    const { status } = error.response
    const isAuthEndpoint =
      original.url?.includes('/auth/login') ||
      original.url?.includes('/auth/register') ||
      original.url?.includes('/auth/refresh')

    const hasToken = !!localStorage.getItem('refreshToken')

    // Attempt token refresh on 401
    if (status === 401 && !original._retry && !isAuthEndpoint && hasToken) {
      original._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`,
          { refreshToken }
        )
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        localStorage.clear()
        const publicPaths = ['/', '/track', '/login', '/register']
        if (!publicPaths.includes(window.location.pathname)) {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    }

    // 403 - forbidden
    if (status === 403) {
      return Promise.reject(new Error(error.response.data?.message || 'You are not authorized to perform this action'))
    }

    // 429 - rate limit
    if (status === 429) {
      return Promise.reject(new Error('Too many requests. Please wait a moment and try again.'))
    }

    // 500+ - server errors
    if (status >= 500) {
      return Promise.reject(new Error('Server error. Please try again later.'))
    }

    return Promise.reject(error)
  }
)

export default api
