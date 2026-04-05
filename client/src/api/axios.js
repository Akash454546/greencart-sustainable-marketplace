import axios from 'axios';
import useAuthStore from '../store/authStore.js';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  // Try multiple ways to get the token
  let token = null;
  
  // First, try to get from Zustand store directly
  const store = useAuthStore.getState();
  if (store?.accessToken) {
    token = store.accessToken;
  } else {
    // Fall back to localStorage
    const auth = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    token = auth?.state?.accessToken;
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: auto refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    
    // Prevent infinite retry loops
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        // Get refresh token
        const store = useAuthStore.getState();
        let refreshToken = store?.refreshToken;
        
        if (!refreshToken) {
          const auth = JSON.parse(localStorage.getItem('auth-storage') || '{}');
          refreshToken = auth?.state?.refreshToken;
        }

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Attempt refresh
        const { data } = await axios.post('/api/auth/refresh-token', { refreshToken });
        
        // Update Zustand store
        useAuthStore.setState({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });

        // Also update localStorage
        const auth = JSON.parse(localStorage.getItem('auth-storage') || '{}');
        auth.state = {
          ...auth.state,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        };
        localStorage.setItem('auth-storage', JSON.stringify(auth));

        // Retry original request
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError.message);
        // Clear auth and redirect to login
        useAuthStore.setState({ user: null, accessToken: null, refreshToken: null });
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
