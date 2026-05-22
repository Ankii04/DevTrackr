import axios from 'axios';

let apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Auto-normalize base URL to ensure it ends with '/api' when deploying to a custom host
if (apiBaseUrl && !apiBaseUrl.endsWith('/api') && !apiBaseUrl.endsWith('/api/')) {
  apiBaseUrl = apiBaseUrl.replace(/\/$/, '') + '/api';
}

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000, // 30s timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT bearer token if available in localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Redirect or handle expirations on 401 Unauthorized errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('[AXIOS INSTANCE] 401 Unauthorized detected! Clearing local credentials.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // If we are in the browser, redirect to login page (avoiding redirects during active auth attempts)
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
