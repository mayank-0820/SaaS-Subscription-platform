import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: { name?: string; email?: string }) =>
    api.put('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/change-password', data),
};

// Plans
export const plansApi = {
  getAll: () => api.get('/plans'),
  getById: (id: string) => api.get(`/plans/${id}`),
  create: (data: any) => api.post('/plans', data),
  update: (id: string, data: any) => api.put(`/plans/${id}`, data),
  delete: (id: string) => api.delete(`/plans/${id}`),
};

// Subscriptions
export const subscriptionsApi = {
  getMy: () => api.get('/subscriptions/my'),
  subscribe: (data: { planId: string; paymentMethodId?: string }) =>
    api.post('/subscriptions/subscribe', data),
  upgrade: (planId: string) => api.put('/subscriptions/upgrade', { planId }),
  cancel: (immediately?: boolean) => api.post('/subscriptions/cancel', { immediately }),
  reactivate: () => api.post('/subscriptions/reactivate'),
  getAll: (params?: any) => api.get('/subscriptions', { params }),
};

// Billing
export const billingApi = {
  getInvoices: (params?: any) => api.get('/billing/invoices', { params }),
  getInvoice: (id: string) => api.get(`/billing/invoices/${id}`),
  getSummary: () => api.get('/billing/summary'),
  getUsage: (params?: any) => api.get('/billing/usage', { params }),
  recordUsage: (data: { metric: string; value: number }) =>
    api.post('/billing/usage', data),
  getAdminInvoices: (params?: any) => api.get('/billing/admin/all', { params }),
};

// Analytics
export const analyticsApi = {
  getMy: () => api.get('/analytics/my'),
  getAdminOverview: () => api.get('/analytics/admin/overview'),
};

// Admin
export const adminApi = {
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  updateUserRole: (id: string, role: string) => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getAuditLogs: (params?: any) => api.get('/admin/audit-logs', { params }),
  createInvoice: (data: any) => api.post('/admin/invoices', data),
  updateInvoiceStatus: (id: string, status: string) =>
    api.put(`/admin/invoices/${id}/status`, { status }),
};

export default api;
