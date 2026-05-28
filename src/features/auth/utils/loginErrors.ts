import { isNetworkError } from '@/shared/lib/apiErrors';

/** User-facing login error text from API responses. */
export function formatLoginErrorMessage(
  rawMessage: string,
  status?: number,
  options?: { offline?: boolean; networkUnreachable?: boolean },
): string {
  if (options?.offline) {
    return 'You are offline. Connect to the internet to sign in, or use an account you have signed in with on this device before.';
  }
  if (options?.networkUnreachable) {
    return 'Cannot reach the server. Check your internet connection and that the backend is running, then try again.';
  }

  const msg = rawMessage.trim();
  if (status === 401) {
    if (
      msg === 'Invalid credentials' ||
      msg.toLowerCase().includes('invalid credentials')
    ) {
      return 'The email/phone or password you entered is incorrect. Please check and try again.';
    }
    return msg || 'Sign-in failed. Please check your email/phone and password.';
  }
  if (status === 400 && msg.toLowerCase().includes('recaptcha')) {
    return 'Security verification failed. Complete the reCAPTCHA checkbox and try again.';
  }
  if (msg.toLowerCase().includes('recaptcha')) {
    return 'Security verification failed. Please complete the reCAPTCHA checkbox and try again.';
  }
  if (msg.includes('Email/Phone and password are required')) {
    return 'Enter both your email/phone and password.';
  }
  if (isNetworkError({ message: msg })) {
    return 'Cannot reach the server. Check your internet connection and try again.';
  }
  return msg || 'Sign-in failed. Please try again.';
}
