import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // Don't retry for client errors (4xx except 401)
    if (error.response?.status >= 400 && error.response?.status < 500) {
      return Promise.reject(error);
    }
    
    // Retry logic for network errors or 5xx errors
    if (
      !originalRequest._retry && 
      (error.code === 'ECONNABORTED' || 
       error.code === 'ERR_NETWORK' ||
       !error.response ||
       (error.response?.status >= 500 && error.response?.status < 600))
    ) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      
      // Max 3 retries
      if (originalRequest._retryCount <= 3) {
        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, originalRequest._retryCount - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.log(`Retrying request (attempt ${originalRequest._retryCount})...`);
        return api(originalRequest);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;