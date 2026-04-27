import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { postReport, getReports, updateServerReport, deleteServerReport, getDiseases } from '../api';
import { syncQueuedHewReports } from '../lib/offlineHewReports';

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

export const useReportMutation = () => {
  return useMutation({
    mutationFn: postReport,
  });
};

export const useSyncReportsMutation = () => {
  return useMutation({
    mutationFn: () => syncQueuedHewReports(postReport),
  });
};

export const useDiseases = () => {
  return useQuery({
    queryKey: ['diseases'],
    queryFn: getDiseases,
    staleTime: 24 * 60 * 60 * 1000, // Master data stays fresh for 24 hours
  });
};
