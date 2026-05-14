export const NOTIFICATIONS_ENABLED_KEY = 'ethio-notifications-enabled';
export const NOTIFICATIONS_LAST_READ_KEY = 'ethio-notifications-last-read-at';

export function areNotificationsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const v = window.localStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
  if (v === null) return true;
  return v === 'true';
}

export function setNotificationsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? 'true' : 'false');
}

export function getLastReadAt(): number {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(NOTIFICATIONS_LAST_READ_KEY);
  if (!raw) return 0;
  const t = Date.parse(raw);
  return Number.isNaN(t) ? 0 : t;
}

export const NOTIFICATIONS_MARKED_READ_EVENT = 'ethio-notifications-marked-read';

export function markNotificationsReadNow(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    NOTIFICATIONS_LAST_READ_KEY,
    new Date().toISOString(),
  );
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_MARKED_READ_EVENT));
}
