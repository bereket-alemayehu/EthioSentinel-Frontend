import { api } from '@/shared/lib/axios';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  severity: string;
  targetZone: string;
  disease: string | null;
  isDelivered: boolean;
  aiSuggested: boolean;
  createdAt: string;
}

export async function getNotifications(limit = 10): Promise<NotificationItem[]> {
  const response = await api.get<{ data: NotificationItem[] }>(
    '/alerts/notifications',
    { params: { limit } },
  );
  return response.data.data;
}
