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

export interface GeoStat {
  district: string;
  totalCases: number;
  totalDeaths: number;
  reportCount: number;
  latitude: number | null;
  longitude: number | null;
}

export const getGeoStats = async (filters: {
  startDate?: string;
  endDate?: string;
  diseaseType?: string;
} = {}): Promise<GeoStat[]> => {
  const response = await api.get<{ data: GeoStat[] }>('/analytics/geo-stats', {
    params: filters,
  });
  return response.data.data;
};
