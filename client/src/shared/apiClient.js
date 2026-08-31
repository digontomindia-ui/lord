import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
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
          const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
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
