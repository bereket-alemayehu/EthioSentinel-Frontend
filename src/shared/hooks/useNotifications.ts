import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/auth/AuthProvider';
import { getNotifications, type NotificationItem } from '@/shared/api/notifications';
import {
  areNotificationsEnabled,
  getLastReadAt,
  NOTIFICATIONS_MARKED_READ_EVENT,
} from '@/shared/lib/notificationsPrefs';

export const notificationQueryKey = ['notifications', 'list'] as const;

const PREF_EVENT = 'ethio-notifications-pref-changed';

export function dispatchNotificationsPrefChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PREF_EVENT));
}

export function useNotifications() {
  const { user } = useAuth();
  const [prefsRev, setPrefsRev] = useState(0);
  const [readRev, setReadRev] = useState(0);

  useEffect(() => {
    const onPref = () => setPrefsRev((n) => n + 1);
    window.addEventListener(PREF_EVENT, onPref);
    return () => window.removeEventListener(PREF_EVENT, onPref);
  }, []);

  useEffect(() => {
    const onMarkedRead = () => setReadRev((n) => n + 1);
    window.addEventListener(NOTIFICATIONS_MARKED_READ_EVENT, onMarkedRead);
    return () =>
      window.removeEventListener(NOTIFICATIONS_MARKED_READ_EVENT, onMarkedRead);
  }, []);

  const enabled = useMemo(() => {
    void prefsRev;
    return areNotificationsEnabled();
  }, [prefsRev]);

  const query = useQuery({
    queryKey: [...notificationQueryKey, user?.id ?? 'anon', enabled],
    queryFn: () => getNotifications(20),
    enabled: Boolean(user && enabled),
    refetchInterval: enabled && user ? 30_000 : false,
    staleTime: 10_000,
  });

  const lastRead = useMemo(() => {
    void readRev;
    return getLastReadAt();
  }, [readRev]);
  const items: NotificationItem[] = query.data ?? [];
  const unreadCount = items.filter(
    (n) => new Date(n.createdAt).getTime() > lastRead,
  ).length;

  return {
    ...query,
    items,
    unreadCount,
    enabled,
  };
}
