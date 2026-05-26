import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAlerts,
  getAlertById,
  updateAlertStatus,
  getAnomalies,
  getAnomalyTimeseries,
  runAnomaly,
  runPrediction,
  type AnomalyClassification,
} from '../api';

export const adminKeys = {
  all: ['admin'] as const,
  alerts: () => [...adminKeys.all, 'alerts'] as const,
  alertDetail: (id: string) => [...adminKeys.all, 'alert', id] as const,
  geoStats: (filters: any) => [...adminKeys.all, 'geoStats', filters] as const,
  anomalies: (filters: any) =>
    [...adminKeys.all, 'anomalies', filters] as const,
  anomalyTimeseries: (params: any) =>
    [...adminKeys.all, 'anomalyTimeseries', params] as const,
};

export const useAlerts = () => {
  return useQuery({
    queryKey: adminKeys.alerts(),
    queryFn: getAlerts,
  });
};

export const useAlertDetail = (id: string | undefined) => {
  return useQuery({
    queryKey: adminKeys.alertDetail(id ?? ''),
    queryFn: () => getAlertById(id!),
    enabled: Boolean(id),
  });
};

export const useUpdateAlertStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: number | string; action: 'approve' | 'reject' }) =>
      updateAlertStatus(args.id, args.action),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.alerts() });
      void queryClient.invalidateQueries({
        queryKey: adminKeys.alertDetail(String(variables.id)),
      });
    },
  });
};

export const useGeoStats = (filters: {
  startDate?: string;
  endDate?: string;
  diseaseType?: string;
} = {}) => {
  return useQuery({
    queryKey: adminKeys.geoStats(filters),
    queryFn: () => import('../api').then((api) => api.getGeoStats(filters)),
  });
};

export const useAnomalies = (filters: {
  startDate?: string;
  endDate?: string;
  district?: string;
  diseaseType?: string;
  classification?: AnomalyClassification;
  page?: number;
  limit?: number;
} = {}) => {
  return useQuery({
    queryKey: adminKeys.anomalies(filters),
    queryFn: () => getAnomalies(filters),
  });
};

export const useAnomalyTimeseries = (
  params: { district: string; diseaseType: string; days?: number } | null,
) => {
  return useQuery({
    queryKey: adminKeys.anomalyTimeseries(params),
    queryFn: () => getAnomalyTimeseries(params!),
    enabled: Boolean(params?.district && params?.diseaseType),
  });
};

export const useRunAnomalyMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: runAnomaly,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.all });
      if (variables?.district && variables?.diseaseType) {
        void queryClient.invalidateQueries({
          queryKey: adminKeys.anomalyTimeseries({
            district: variables.district,
            diseaseType: variables.diseaseType,
            days: 30,
          }),
        });
      }
    },
  });
};

export const useRunPredictionMutation = () => {
  return useMutation({
    mutationFn: runPrediction,
  });
};
