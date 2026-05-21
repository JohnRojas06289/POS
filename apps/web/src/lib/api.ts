import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
}

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('nexus_access_token')
      : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: unknown) => {
    const axiosError = error as { response?: { status: number }; config?: AxiosRequestConfig & { _retry?: boolean } };
    const originalRequest = axiosError.config;

    if (axiosError.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (originalRequest) {
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${token}`,
          };
        }
        return api(originalRequest!);
      });
    }

    if (originalRequest) originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken =
        typeof window !== 'undefined'
          ? localStorage.getItem('nexus_refresh_token')
          : null;

      if (!refreshToken) throw new Error('No refresh token');

      const res = await axios.post<{ accessToken: string; refreshToken: string }>(
        `${BASE_URL}/auth/refresh`,
        { refreshToken },
      );

      const { accessToken, refreshToken: newRefresh } = res.data;
      localStorage.setItem('nexus_access_token', accessToken);
      localStorage.setItem('nexus_refresh_token', newRefresh);

      processQueue(null, accessToken);

      if (originalRequest) {
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${accessToken}`,
        };
      }
      return api(originalRequest!);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem('nexus_access_token');
      localStorage.removeItem('nexus_refresh_token');
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ─── Typed API methods ────────────────────────────────────────

export const posApi = {
  getProducts: (params?: Record<string, string>) => api.get('/inventory/products', { params }).then((r) => r.data),
  createOrder: (data: unknown) => api.post('/pos/orders', data).then((r) => r.data),
  getOrders: (params?: Record<string, string>) => api.get('/pos/orders', { params }).then((r) => r.data),
  getOrder: (id: string) => api.get(`/pos/orders/${id}`).then((r) => r.data),
  holdOrder: (id: string) => api.patch(`/pos/orders/${id}/hold`).then((r) => r.data),
  resumeOrder: (id: string) => api.patch(`/pos/orders/${id}/resume`).then((r) => r.data),
  refundOrder: (id: string, data: unknown) => api.post(`/pos/orders/${id}/refund`, data).then((r) => r.data),
};

export const authApi = {
  me: () => api.get('/auth/me').then((r) => r.data),
  requestPasswordReset: (data: { tenantEmail: string; email: string }) =>
    api.post('/auth/request-password-reset', data).then((r) => r.data),
  resetPassword: (data: { token: string; newPassword: string }) =>
    api.post('/auth/reset-password', data).then((r) => r.data),
};

export const inventoryApi = {
  getProducts: (params?: Record<string, string>) => api.get('/inventory/products', { params }).then((r) => r.data),
  updateProduct: (id: string, data: unknown) => api.patch(`/inventory/products/${id}`, data).then((r) => r.data),
  receiveStock: (data: unknown) => api.post('/inventory/stock/receive', data).then((r) => r.data),
  adjustStock: (data: unknown) => api.post('/inventory/stock/adjust', data).then((r) => r.data),
  getKardex: (variantId: string, params?: Record<string, string>) =>
    api.get(`/inventory/stock/${variantId}/kardex`, { params }).then((r) => r.data),
  getLowStock: () => api.get('/inventory/stock/low').then((r) => r.data),
};

export const cashApi = {
  openSession: (data: unknown) => api.post('/cash/sessions/open', data).then((r) => r.data),
  getCurrentSession: (terminalId: string) =>
    api.get('/cash/sessions/current', { params: { terminalId } }).then((r) => r.data),
  closeSession: (id: string, data: unknown) =>
    api.post(`/cash/sessions/${id}/close`, data).then((r) => r.data),
};

export const customersApi = {
  getCustomers: (params?: Record<string, string>) => api.get('/customers', { params }).then((r) => r.data),
  getCustomer: (id: string) => api.get(`/customers/${id}`).then((r) => r.data),
  payCredit: (id: string, data: unknown) =>
    api.post(`/customers/${id}/credit/payment`, data).then((r) => r.data),
};

export const analyticsApi = {
  getSalesSummary: (params: Record<string, string>) =>
    api.get('/analytics/sales/summary', { params }).then((r) => r.data),
  getProductPerformance: () => api.get('/analytics/products/performance').then((r) => r.data),
  getInventoryValuation: () => api.get('/analytics/inventory/valuation').then((r) => r.data),
  getCustomerInsights: () => api.get('/analytics/customers/insights').then((r) => r.data),
};

export const syncApi = {
  push: (data: unknown) => api.post('/sync/push', data).then((r) => r.data),
  pull: (data: unknown) => api.post('/sync/pull', data).then((r) => r.data),
};

export const tenantsApi = {
  getConfig: () => api.get('/tenants/config').then((r) => r.data),
  getBranches: () => api.get('/tenants/branches').then((r) => r.data),
  getUsers: () => api.get('/tenants/users').then((r) => r.data),
  getTerminals: () => api.get('/tenants/terminals').then((r) => r.data),
  updateConfig: (data: unknown) => api.patch('/tenants/config', data).then((r) => r.data),
  createUser: (data: unknown) => api.post('/tenants/users', data).then((r) => r.data),
  createBranch: (data: unknown) => api.post('/tenants/branches', data).then((r) => r.data),
  createTerminal: (data: unknown) => api.post('/tenants/terminals', data).then((r) => r.data),
  blockTerminal: (id: string) => api.patch(`/tenants/terminals/${id}/block`).then((r) => r.data),
  unblockTerminal: (id: string) => api.patch(`/tenants/terminals/${id}/unblock`).then((r) => r.data),
};

export const billingApi = {
  getPlans: () => api.get('/billing/plans').then((r) => r.data),
  getSubscription: () => api.get('/billing/subscription').then((r) => r.data),
};

export const employeesApi = {
  getEmployees: (params?: Record<string, string>) => api.get('/employees', { params }).then((r) => r.data),
  createEmployee: (data: unknown) => api.post('/employees', data).then((r) => r.data),
  recordPayment: (id: string, data: unknown) => api.post(`/employees/${id}/payments`, data).then((r) => r.data),
  getPayrollSummary: (params?: Record<string, string>) =>
    api.get('/employees/payroll/summary', { params }).then((r) => r.data),
};

export const expensesApi = {
  getExpenses: (params?: Record<string, string>) => api.get('/expenses', { params }).then((r) => r.data),
  createExpense: (data: unknown) => api.post('/expenses', data).then((r) => r.data),
  getSummary: (params?: Record<string, string>) => api.get('/expenses/summary', { params }).then((r) => r.data),
};

export const suppliersApi = {
  getSuppliers: () => api.get('/suppliers').then((r) => r.data),
  createSupplier: (data: unknown) => api.post('/suppliers', data).then((r) => r.data),
  getPurchaseOrders: (supplierId: string) =>
    api.get(`/suppliers/${supplierId}/purchase-orders`).then((r) => r.data),
  createPurchaseOrder: (supplierId: string, data: unknown) =>
    api.post(`/suppliers/${supplierId}/purchase-orders`, data).then((r) => r.data),
  receivePurchaseOrder: (supplierId: string, orderId: string, data: unknown) =>
    api.patch(`/suppliers/${supplierId}/purchase-orders/${orderId}/receive`, data).then((r) => r.data),
};
