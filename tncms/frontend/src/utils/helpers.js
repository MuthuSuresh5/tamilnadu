export const resolveUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return path
}

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

export const statusColor = (status) => ({
  submitted: 'bg-blue-100 text-blue-700',
  accepted: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}[status] || 'bg-gray-100 text-gray-700')

export const priorityColor = (priority) => ({
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
}[priority] || 'bg-gray-100 text-gray-600')

export const categoryIcon = (category) => ({
  road: '🛣️', water: '💧', electricity: '⚡', sanitation: '🧹',
  drainage: '🌊', streetlight: '💡', garbage: '🗑️', park: '🌳', other: '📋',
}[category] || '📋')

export const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export const formatDateTime = (date) =>
  date ? new Date(date).toLocaleString('en-IN') : '—'
