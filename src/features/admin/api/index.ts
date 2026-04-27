import { api } from '@/shared/lib/axios';
import type { AlertItem } from '../types';

export const getAlerts = async (): Promise<AlertItem[]> => {
  const response = await api.get<{ data: AlertItem[] }>('/alerts');
  return response.data.data;
};

export const updateAlertStatus = async (
  id: number | string,
  action: 'approve' | 'reject'
): Promise<void> => {
  await api.put(`/alerts/${id}/${action}`);
};

export const getAdvisoryDrafts = async (page = 1, limit = 50): Promise<any> => {
  const response = await api.get('/advisories/drafts', { params: { page, limit } });
  return response.data.data?.data || [];
};

export const getApprovedAdvisories = async (page = 1, limit = 50): Promise<any> => {
  const response = await api.get('/advisories/approved-list', { params: { page, limit } });
  return response.data.data?.data || [];
};

export const updateAdvisoryStatus = async (
  id: string,
  action: 'approve' | 'reject' | 'withdraw'
): Promise<void> => {
  const endpoint = action === 'withdraw' ? 'withdraw' : action;
  await api.patch(`/advisories/${id}/${endpoint}`);
};

export interface GeoStat {
  district: string;
  diseaseType: string;
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
