import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAlerts, updateAlertStatus } from '../api';

export const adminKeys = {
  all: ['admin'] as const,
  alerts: () => [...adminKeys.all, 'alerts'] as const,
  geoStats: (filters: any) => [...adminKeys.all, 'geoStats', filters] as const,
};

export const useAlerts = () => {
  return useQuery({
    queryKey: adminKeys.alerts(),
    queryFn: getAlerts,
  });
};

export const useUpdateAlertStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: number; action: 'approve' | 'reject' }) =>
      updateAlertStatus(args.id, args.action),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.alerts() });
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
