import { useMutation } from '@tanstack/react-query';
import { postReport } from '../api';
import { syncQueuedHewReports } from '../lib/offlineHewReports';

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
