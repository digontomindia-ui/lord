import axios from 'axios';

const getBaseUrl = () => {
  // 1. Explicit env variable (if provided and not just default relative)
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== '/api' && import.meta.env.VITE_API_URL !== '/api/v1') {
    return import.meta.env.VITE_API_URL;
  }
  
  // 2. In browser environment, check hostname for Coolify / production domains
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('72.62.192.34.sslip.io') || host.includes('l6yysocwp2ehbvzggvs9xdn1')) {
      return 'http://x12ffct87by2qsgrpdpjp6vt.72.62.192.34.sslip.io/api';
    }
  }

  // 3. Default relative fallback
  return import.meta.env.VITE_API_URL || '/api';
};

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('erp_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401s and auto refresh
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('erp_refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${getBaseUrl()}/auth/refresh`, { refreshToken });
          const newAccessToken = data.data.accessToken;
          localStorage.setItem('erp_access_token', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('erp_access_token');
          localStorage.removeItem('erp_refresh_token');
          localStorage.removeItem('erp_user');
          window.dispatchEvent(new Event('auth:unauthorized'));
        }
      } else {
        localStorage.removeItem('erp_access_token');
        localStorage.removeItem('erp_user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error.response?.data || { message: error.message });
  }
);

export default apiClient;
