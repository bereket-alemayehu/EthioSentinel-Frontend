import { useState, useEffect } from 'react';

/**
 * Tracks real-time network connectivity.
 * Returns `true` when the browser believes it has internet access,
 * and `false` when the `offline` event fires.
 *
 * NOTE: `navigator.onLine` can be `true` on a captive-portal / LAN with
 * no real internet – but for our CAPTCHA bypass use-case that is fine,
 * because Google reCAPTCHA will simply fail to load in that scenario and
 * the offline badge will be shown anyway via the widget's `onErrored` callback.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
