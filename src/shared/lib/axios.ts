import axios from 'axios';

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
  (response) => response,
  (error) => {
    // Handle Token Expiration (401 Unauthorized)
    if (error.response?.status === 401) {
      const isAuthRequest = error.config?.url?.includes('/auth/');
      const isLoginPage = window.location.pathname === '/login';
      
      if (!isAuthRequest && !isLoginPage) {
        // Clear local storage and redirect to login
        localStorage.removeItem('ethio-user');
        localStorage.removeItem('ethio-role');
        // Use window.location to force a hard reload and clear all React state
        window.location.href = '/login?expired=true';
      }
    }

    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);
