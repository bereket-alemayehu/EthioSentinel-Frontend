import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error handling and automatic logout
api.interceptors.response.use(
  (response) => {
    // Show success toasts for mutations (POST, PUT, DELETE, etc.)
    if (response.data?.success && response.data?.message && response.config.method !== 'get') {
      toast.success(response.data.message);
    }
    return response;
  },
  (error) => {
    const isAuthRequest = error.config?.url?.includes('/auth/');
    const isLoginPage = window.location.pathname === '/login';
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';

    // Handle Token Expiration (401 Unauthorized)
    if (error.response?.status === 401) {
      console.warn(`[Axios] 401 Unauthorized detected on ${error.config?.url}.`);
      
      const isAuthRequest = error.config?.url?.includes('/auth/');
      const isLoginPage = window.location.pathname === '/login';

      if (!isAuthRequest && !isLoginPage && navigator.onLine) {
        console.error("[Axios] Session expired. Redirecting to login.");
        localStorage.removeItem('ethio-user');
        localStorage.removeItem('ethio-role');
        window.location.href = '/login?expired=true';
      } else {
        console.log("[Axios] 401 ignored (Offline, Auth request, or already on Login page)");
      }
    } else {
      // Show error toast for everything except 401s and background me checks
      if (!error.config?.url?.includes('/auth/me')) {
        console.log(`[Axios] API Error: ${message} (Status: ${error.response?.status})`);
        toast.error(message);
      }
    }

    return Promise.reject(new Error(message));
  }
);
