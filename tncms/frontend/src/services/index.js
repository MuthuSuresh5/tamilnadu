import api from './api'
import axios from 'axios'

// Separate unauthenticated client — never triggers refresh/redirect
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
})

export const publicService = {
  getDashboardStats: () => publicApi.get('/analytics/dashboard/public'),
  getPublicTeam: () => publicApi.get('/analytics/team/public'),
  getCompletedFeed: () => publicApi.get('/complaints/feed'),
  trackComplaint: (id) => publicApi.get(`/complaints/track/${id}`),
  getWards: () => publicApi.get('/wards'),
}

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (data) => api.put('/auth/change-password', data),
}

export const complaintService = {
  submit: (data) => api.post('/complaints', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  track: (id) => api.get(`/complaints/track/${id}`),
  getMyComplaints: () => api.get('/complaints/my'),
  getAll: (params) => api.get('/complaints', { params }),
  updateStatus: (id, data) => api.put(`/complaints/${id}/status`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/complaints/${id}`),
  getFeed: () => api.get('/complaints/feed'),
}

export const wardService = {
  getAll: () => api.get('/wards'),
  getOne: (id) => api.get(`/wards/${id}`),
  getStats: (wardNumber) => api.get(`/wards/stats/${wardNumber}`),
  create: (data) => api.post('/wards', data),
  update: (id, data) => api.put(`/wards/${id}`, data),
  delete: (id) => api.delete(`/wards/${id}`),
  assignOfficer: (data) => api.put('/wards/assign-officer', data),
}

export const officerService = {
  getAll: () => api.get('/officers'),
  getOne: (id) => api.get(`/officers/${id}`),
  getPerformance: () => api.get('/officers/performance'),
  create: (data) => api.post('/officers', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/officers/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/officers/${id}`),
  resetPassword: (id, data) => api.put(`/officers/${id}/reset-password`, data),
  getAdmins: () => api.get('/officers/admins/list'),
  createAdmin: (data) => api.post('/officers/admins/create', data),
  deleteAdmin: (id) => api.delete(`/officers/admins/${id}`),
}

export const analyticsService = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getCategory: () => api.get('/analytics/category'),
  getMonthly: (year) => api.get('/analytics/monthly', { params: { year } }),
  getHeatmap: () => api.get('/analytics/heatmap'),
  getWardHeatmap: () => api.get('/analytics/heatmap'),
  getPriority: () => api.get('/analytics/priority'),
  getPriorityStats: () => api.get('/analytics/priority'),
  getCategoryStats: () => api.get('/analytics/category'),
  getMonthlyTrend: (year) => api.get('/analytics/monthly', { params: { year } }),
  getCitizenStats: () => api.get('/analytics/citizen'),
}

export const notificationService = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
}

export const reportService = {
  downloadPDF: (params) => api.get('/reports/pdf', { params, responseType: 'blob' }),
  downloadExcel: (params) => api.get('/reports/excel', { params, responseType: 'blob' }),
}
