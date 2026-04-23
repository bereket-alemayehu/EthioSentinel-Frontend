import { api } from '@/lib/axios';
import type { AlertItem } from '../types';

export const getAlerts = async (): Promise<AlertItem[]> => {
  const response = await api.get<{ data: AlertItem[] }>('/alerts');
  return response.data.data;
};

export const updateAlertStatus = async (
  id: number,
  action: 'approve' | 'reject'
): Promise<void> => {
  await api.put(`/alerts/${id}/${action}`);
};
