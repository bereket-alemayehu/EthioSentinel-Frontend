import type { AxiosError } from 'axios';

export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as AxiosError & { code?: string; message?: string };
  if (err.response) return false;
  const msg = typeof err.message === 'string' ? err.message : '';
  return (
    err.code === 'ERR_NETWORK' ||
    err.code === 'ECONNABORTED' ||
    msg === 'Network Error' ||
    msg.includes('Cannot reach the API') ||
    msg.includes('ERR_CONNECTION_REFUSED')
  );
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (isNetworkError(error)) {
    return 'No internet connection or the server is unreachable. Check your network and try again.';
  }
  const err = error as AxiosError<{ message?: string }>;
  if (err.response?.data?.message) {
    return String(err.response.data.message);
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function getApiErrorStatus(error: unknown): number | undefined {
  const err = error as AxiosError;
  return err.response?.status;
}
