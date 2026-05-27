import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { postReport, getReports, updateServerReport, deleteServerReport, getDiseases } from '../api';
import { syncQueuedHewReports } from '../services/offlineStorage';

export const useReports = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['hew-reports', page, limit],
    queryFn: () => getReports(page, limit),
  });
};

export const useUpdateReportMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateServerReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hew-reports'] });
    },
  });
};

export const useDeleteReportMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteServerReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hew-reports'] });
    },
  });
};

export const useReportMutation = (reporterId?: string) => {
  return useMutation({
    mutationFn: (report: Parameters<typeof postReport>[0]) =>
      postReport(report, reporterId),
  });
};

export const useSyncReportsMutation = (reporterId?: string) => {
  return useMutation({
    mutationFn: () =>
      syncQueuedHewReports((report) => postReport(report, reporterId)),
  });
};

export const useDiseases = () => {
  return useQuery({
    queryKey: ['diseases'],
    queryFn: getDiseases,
    staleTime: 5 * 1000, // Reduced from 24h to 5s for better responsiveness
  });
};
