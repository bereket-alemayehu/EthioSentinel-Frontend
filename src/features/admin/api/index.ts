import { api } from '@/shared/lib/axios';
import type { AlertItem, AdminAdvisoryItem } from '../types';

export const getAlerts = async (): Promise<AlertItem[]> => {
  const response = await api.get<{ data: AlertItem[] }>('/alerts', {
    params: { pending: true }
  });
  return response.data.data;
};

export const getAlertById = async (id: string): Promise<AlertItem> => {
  const response = await api.get<{ data: AlertItem }>(`/alerts/${id}`);
  return response.data.data;
};

export const getAdvisoryById = async (id: string): Promise<AdminAdvisoryItem> => {
  const response = await api.get<{ data: AdminAdvisoryItem }>(`/advisories/${id}`);
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
  /** When set, map uses API risk level (e.g. citizen district map). */
  riskLevel?: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
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

export type AnomalyClassification = 'ANOMALY' | 'NORMAL';
export type AnomalyMethod = 'ZSCORE' | 'ARIMA';

export interface AnomalySignal {
  id: string;
  reportId: string | null;
  district: string;
  diseaseType: string;
  currentCases: number;
  historicalMean: number;
  stdDev: number;
  zScore: number | null;
  classification: AnomalyClassification;
  method: AnomalyMethod;
  sampleSize: number;
  lookbackStart: string | null;
  lookbackEnd: string | null;
  advisoryId: string | null;
  alertId: string | null;
  manual: boolean;
  notes: string | null;
  createdAt: string;
}

export interface AnomalySignalsPage {
  data: AnomalySignal[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const getAnomalies = async (filters: {
  startDate?: string;
  endDate?: string;
  district?: string;
  diseaseType?: string;
  classification?: AnomalyClassification;
  page?: number;
  limit?: number;
} = {}): Promise<AnomalySignalsPage> => {
  const response = await api.get<{ data: AnomalySignalsPage }>(
    '/analytics/anomalies',
    { params: filters }
  );
  return response.data.data;
};

export interface AnomalyTimeseriesPoint {
  date: string;
  cases: number;
  deaths: number;
  reports: number;
  zScore: number;
  isAnomaly: boolean;
}

export interface AnomalyTimeseries {
  district: string;
  diseaseType: string;
  windowDays: number;
  lookbackStart: string;
  lookbackEnd: string;
  summary: {
    mean: number;
    stdDev: number;
    threshold2Sigma: number;
    threshold3Sigma: number;
    sampleSize: number;
    latestZScore: number;
  };
  series: AnomalyTimeseriesPoint[];
  signals: AnomalySignal[];
}

export const getAnomalyTimeseries = async (params: {
  district: string;
  diseaseType: string;
  days?: number;
}): Promise<AnomalyTimeseries> => {
  const response = await api.get<{ data: AnomalyTimeseries }>(
    '/analytics/anomalies/timeseries',
    { params }
  );
  return response.data.data;
};

export interface AdHocAnomalyResult {
  district: string;
  diseaseType: string;
  currentCases: number;
  currentDeaths: number;
  mortalityRate: number;
  mortalitySignal: boolean;
  historicalMean: number;
  stdDev: number;
  zScore?: number;
  classification: AnomalyClassification;
  sampleSize: number;
  lookbackStart: string;
  lookbackEnd: string;
  thresholdSigma: number;
  signalId?: string;
}

export const runAnomaly = async (payload: {
  district: string;
  diseaseType: string;
  lookbackDays?: number;
  persist?: boolean;
  notes?: string;
}): Promise<AdHocAnomalyResult> => {
  const response = await api.post<{ data: AdHocAnomalyResult }>(
    '/analytics/anomalies/run',
    payload
  );
  return response.data.data;
};

export interface AdHocPredictionResult {
  district: string;
  diseaseType: string;
  currentCases: number;
  forecastNext: number;
  residualStd: number;
  zScore?: number;
  classification: AnomalyClassification;
  sampleSize: number;
  lookbackStart: string;
  lookbackEnd: string;
  thresholdSigma: number;
  arimaOrder: [number, number, number];
}

export const runPrediction = async (payload: {
  district: string;
  diseaseType: string;
  lookbackDays?: number;
  thresholdSigma?: number;
}): Promise<AdHocPredictionResult> => {
  const response = await api.post<{ data: AdHocPredictionResult }>(
    '/analytics/predictions/run',
    payload
  );
  return response.data.data;
};

export const exportAnalyticsBlob = async (
  format: 'csv' | 'excel' | 'pdf'
): Promise<Blob> => {
  const response = await api.get('/analytics/reports', {
    params: { export: format, limit: 200 },
    responseType: 'blob',
  });
  return response.data as Blob;
};

export const exportAnomaliesBlob = async (filters: {
  startDate?: string;
  endDate?: string;
  district?: string;
  diseaseType?: string;
  classification?: AnomalyClassification;
} = {}): Promise<Blob> => {
  const response = await api.get('/analytics/anomalies', {
    params: { ...filters, export: 'csv', limit: 200 },
    responseType: 'blob',
  });
  return response.data as Blob;
};
