import { api } from '@/shared/lib/axios';
import type { HewDraftReportInput } from '../services/offlineStorage';

export const postReport = async (
  report: HewDraftReportInput,
  reporterId?: string,
): Promise<void> => {
  await api.post('/reports', {
    diseaseType: report.diseaseType,
    district: report.district,
    cases: report.cases,
    deaths: report.deaths,
    date: report.date || new Date().toISOString().split('T')[0],
    reportDate: report.date,
    caseCount: report.cases,
    deathCount: report.deaths,
    healthFacilityId: report.healthFacilityId,
    ...(reporterId ? { reporterId } : {}),
  });
};

export const getReports = async (page: number = 1, limit: number = 10): Promise<{
  reports: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  dailyCount: number;
}> => {
  const response = await api.get(`/reports?page=${page}&limit=${limit}`);
  return response.data.data;
};

export const updateServerReport = async ({ id, ...data }: { id: string; diseaseType?: string; diseaseId?: number; district?: string; cases?: number; deaths?: number; date?: string; healthFacilityId?: number }): Promise<void> => {
  await api.patch(`/reports/${id}`, {
    diseaseType: data.diseaseType,
    diseaseId: data.diseaseId,
    district: data.district,
    caseCount: data.cases,
    deathCount: data.deaths,
    reportDate: data.date,
    healthFacilityId: data.healthFacilityId,
  });
};

export const deleteServerReport = async (id: string): Promise<void> => {
  await api.delete(`/reports/${id}`);
};

export const getDiseases = async (): Promise<any[]> => {
  const response = await api.get('/diseases');
  return response.data.data;
};
