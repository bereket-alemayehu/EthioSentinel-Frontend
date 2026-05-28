import axios, { type AxiosError } from 'axios';
import { toast } from 'sonner';
import { getApiErrorMessage, isNetworkError } from '@/shared/lib/apiErrors';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:5001';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const BACKEND_DOWN_TOAST_MS = 20_000;
let lastBackendDownToastAt = 0;

function backendDownMessage(): string {
  return `Cannot reach the server at ${API_BASE_URL}. Check your internet connection, or start the backend: cd ethiosentinel-backend && npm run dev`;
}

function maybeToastBackendDown(): void {
  const now = Date.now();
  if (now - lastBackendDownToastAt < BACKEND_DOWN_TOAST_MS) return;
  lastBackendDownToastAt = now;
  toast.error(backendDownMessage(), { duration: 8000 });
}

api.interceptors.response.use(
  (response) => {
    if (response.data?.success && response.data?.message && response.config.method !== 'get') {
      const url = response.config.url ?? '';
      const isLogin = url.includes('/auth/login');
      const isWorkflowAction =
        /alerts\/[^/]+\/(approve|reject)/.test(url) ||
        /advisories\/[^/]+\/(approve|reject|withdraw)/.test(url);
      if (!isLogin && !isWorkflowAction) {
        toast.success(response.data.message);
      }
    }
    return response;
  },
  (error: AxiosError<{ message?: string }>) => {
    const isAuthRequest = error.config?.url?.includes('/auth/');
    const isLoginPage =
      window.location.pathname === '/login' ||
      window.location.pathname.startsWith('/auth/login');
    const isLoginAttempt =
      isLoginPage && error.config?.url?.includes('/auth/login');
    const isBackgroundMe = error.config?.url?.includes('/auth/me');
    const unreachable = isNetworkError(error);

    const message = unreachable
      ? backendDownMessage()
      : getApiErrorMessage(error, 'An unexpected error occurred');

    if (error.response?.status === 401) {
      if (!isBackgroundMe) {
        console.warn(`[Axios] 401 on ${error.config?.url}`);
      }
      if (!isAuthRequest && !isLoginPage && navigator.onLine) {
        localStorage.removeItem('ethio-user');
        localStorage.removeItem('ethio-role');
        window.location.href = '/login?expired=true';
      }
    } else if (!isBackgroundMe && !isLoginAttempt) {
      if (unreachable) {
        maybeToastBackendDown();
      } else {
        toast.error(message);
      }
    }

    error.message = message;
    return Promise.reject(error);
  },
);
