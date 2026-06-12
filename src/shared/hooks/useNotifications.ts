import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/auth/AuthProvider';
import { getNotifications, type NotificationItem } from '@/shared/api/notifications';
import {
  areNotificationsEnabled,
  getDismissedNotificationIds,
  getLastReadAt,
  NOTIFICATIONS_DISMISSED_EVENT,
  NOTIFICATIONS_MARKED_READ_EVENT,
  dismissAllNotifications,
  dismissNotification,
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
  const [dismissedRev, setDismissedRev] = useState(0);

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

  useEffect(() => {
    const onDismissed = () => setDismissedRev((n) => n + 1);
    window.addEventListener(NOTIFICATIONS_DISMISSED_EVENT, onDismissed);
    return () =>
      window.removeEventListener(NOTIFICATIONS_DISMISSED_EVENT, onDismissed);
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

  const dismissedIds = useMemo(() => {
    void dismissedRev;
    return getDismissedNotificationIds();
  }, [dismissedRev]);

  const items: NotificationItem[] = useMemo(
    () => (query.data ?? []).filter((n) => !dismissedIds.has(n.id)),
    [query.data, dismissedIds],
  );

  const unreadCount = items.filter(
    (n) => new Date(n.createdAt).getTime() > lastRead,
  ).length;

  const clearNotification = (id: string) => {
    dismissNotification(id);
    setDismissedRev((n) => n + 1);
  };

  const clearReadNotifications = () => {
    const readIds = items
      .filter((n) => new Date(n.createdAt).getTime() <= lastRead)
      .map((n) => n.id);
    dismissAllNotifications(readIds);
    setDismissedRev((n) => n + 1);
  };

  return {
    ...query,
    items,
    unreadCount,
    enabled,
    lastRead,
    clearNotification,
    clearReadNotifications,
  };
}
