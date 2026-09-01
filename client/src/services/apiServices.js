import apiClient from '../shared/apiClient';

// 1. AUTH & USER SERVICE
export const authService = {
  login: (identifier, password) => apiClient.post('/auth/login', { identifier, password }),
  register: (data) => apiClient.post('/auth/register', data),
  refresh: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),
  forgotPassword: (identifier) => apiClient.post('/auth/forgot-password', { identifier }),
  verifyOTP: (identifier, otp) => apiClient.post('/auth/verify-otp', { identifier, otp }),
  resetPassword: (resetToken, newPassword) => apiClient.post('/auth/reset-password', { resetToken, newPassword }),
  logout: () => apiClient.post('/auth/logout'),
  getMe: () => apiClient.get('/auth/me'),
  updateProfile: (data) => apiClient.patch('/profile', data),
  changePassword: (data) => apiClient.patch('/profile/password', data),
  seedAccounts: () => apiClient.post('/auth/seed')
};

// INVOICE SERVICE
export const invoiceService = {
  getInvoices: (params) => apiClient.get('/invoices', { params }),
  getInvoiceById: (id) => apiClient.get(`/invoices/${id}`),
  generateInvoice: (orderId) => apiClient.post('/invoices/generate', { orderId })
};

// 2. ORDER SERVICE
export const orderService = {
  getOrders: (params) => apiClient.get('/orders', { params }),
  getOrderById: (id) => apiClient.get(`/orders/${id}`),
  createOrder: (data) => apiClient.post('/shop/orders', data),
  requestPickup: (orderId, note) => apiClient.post(`/orders/${orderId}/pickup-request`, { note }),
  cancelOrder: (id, reason) => apiClient.post(`/orders/${id}/cancel`, { reason })
};

// 3. CUSTOMER SERVICE
export const customerService = {
  getCustomers: (params) => apiClient.get('/shop/customers', { params }),
  createCustomer: (data) => apiClient.post('/shop/customers', data),
  getCustomerById: (id) => apiClient.get(`/shop/customers/${id}`)
};

// 4. MASTER WORKSHOP SERVICE
export const masterService = {
  getDashboardMetrics: () => apiClient.get('/dashboards/master'),
  getReceivingQueue: () => apiClient.get('/workshop/receiving'),
  acceptReceiving: (orderId, notes) => apiClient.post(`/workshop/receiving/${orderId}/accept`, { notes }),
  submitInspection: (orderId, data) => apiClient.post(`/workshop/inspections/${orderId}`, data),
  getTailors: () => apiClient.get('/workshop/tailors'),
  assignTailor: (orderId, tailorId, instructions) => 
    apiClient.post(`/workshop/orders/${orderId}/assign-tailor`, { tailorId, instructions }),
  getQCQueue: () => apiClient.get('/workshop/qc'),
  approveQC: (orderId, checks) => apiClient.post(`/workshop/qc/${orderId}/approve`, checks || {
    measurementCheck: { passed: true },
    fittingCheck: { passed: true },
    finishingCheck: { passed: true },
    qualityCheck: { passed: true }
  }),
  failQC: (orderId, reason, instructions) => 
    apiClient.post(`/workshop/qc/${orderId}/fail`, { reason, instructions }),
  getReworkQueue: () => apiClient.get('/workshop/rework')
};

// 5. TAILOR SERVICE
export const tailorService = {
  getDashboardMetrics: () => apiClient.get('/dashboards/tailor'),
  getAssignedOrders: () => apiClient.get('/tailor/orders'),
  acceptOrder: (orderId) => apiClient.post(`/tailor/orders/${orderId}/accept`),
  startWork: (orderId) => apiClient.post(`/tailor/orders/${orderId}/start`),
  updateProgress: (orderId, progress, note) => 
    apiClient.post(`/tailor/orders/${orderId}/progress`, { progress, note }),
  completeWork: (orderId, notes, images) => 
    apiClient.post(`/tailor/orders/${orderId}/complete`, { notes, images })
};

// 6. DELIVERY SERVICE
export const deliveryService = {
  getDashboardMetrics: () => apiClient.get('/dashboards/delivery'),
  getTasks: () => apiClient.get('/delivery/tasks'),
  acceptTask: (taskId) => apiClient.post(`/delivery/tasks/${taskId}/accept`),
  markArrived: (taskId) => apiClient.post(`/delivery/tasks/${taskId}/arrived`),
  collectGarments: (taskId) => apiClient.post(`/delivery/tasks/${taskId}/collect`),
  completeDelivery: (taskId, otp, signature, image) => 
    apiClient.post(`/delivery/tasks/${taskId}/complete`, { otp, signature, image })
};

// 7. WALLET SERVICE
export const walletService = {
  getWallet: () => apiClient.get('/wallet'),
  getTransactions: (params) => apiClient.get('/wallet/transactions', { params }),
  requestWithdrawal: (data) => apiClient.post('/wallet/withdrawals', data),
  getWithdrawals: () => apiClient.get('/wallet/withdrawals')
};

// 8. REFERRAL & AFFILIATE SERVICE
export const referralService = {
  getTeamTree: () => apiClient.get('/associate/team'),
  getCommissionIncome: () => apiClient.get('/associate/income')
};

// 9. SUPER ADMIN SERVICE
export const adminService = {
  getDashboardMetrics: () => apiClient.get('/dashboards/admin'),
  getPendingUsers: () => apiClient.get('/admin/users/pending'),
  approveUser: (userId) => apiClient.patch(`/admin/users/${userId}/approve`),
  rejectUser: (userId, reason) => apiClient.patch(`/admin/users/${userId}/reject`, { reason }),
  getUsers: (params) => apiClient.get('/admin/users', { params }),
  getPrices: () => apiClient.get('/prices'),
  savePrice: (data) => apiClient.post('/prices', data),
  updatePrice: (id, data) => apiClient.put(`/prices/${id}`, data),
  deletePrice: (id) => apiClient.delete(`/prices/${id}`),
  getAuditLogs: (params) => apiClient.get('/admin/audit-logs', { params }),
  getSettings: () => apiClient.get('/admin/settings'),
  updateSetting: (key, value) => apiClient.put(`/admin/settings/${key}`, { value })
};
