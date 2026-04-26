import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdvisoryDrafts, getApprovedAdvisories, updateAdvisoryStatus } from '../api';
import { adminKeys } from './useAdmin';

export const useAdvisoryDrafts = () => {
  return useQuery({
    queryKey: [...adminKeys.all, 'advisoryDrafts'],
    queryFn: () => getAdvisoryDrafts(),
  });
};

export const useApprovedAdvisories = () => {
  return useQuery({
    queryKey: [...adminKeys.all, 'approvedAdvisories'],
    queryFn: () => getApprovedAdvisories(),
  });
};

export const useUpdateAdvisoryStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; action: 'approve' | 'reject' | 'withdraw' }) =>
      updateAdvisoryStatus(args.id, args.action),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'advisoryDrafts'] });
      void queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'approvedAdvisories'] });
      // Also invalidate citizen advisories if they share the same cache key or if we want to be safe
      void queryClient.invalidateQueries({ queryKey: ['advisory', 'list'] });
    },
  });
};
