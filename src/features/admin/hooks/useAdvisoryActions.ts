import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdvisoryDrafts,
  getApprovedAdvisories,
  getAdvisoryById,
  updateAdvisoryStatus,
} from '../api';
import { adminKeys } from './useAdmin';

export const advisoryKeys = {
  detail: (id: string) => [...adminKeys.all, 'advisory', id] as const,
};

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

export const useAdvisoryDetail = (id: string | undefined) => {
  return useQuery({
    queryKey: advisoryKeys.detail(id ?? ''),
    queryFn: () => getAdvisoryById(id!),
    enabled: Boolean(id),
  });
};

export const useUpdateAdvisoryStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; action: 'approve' | 'reject' | 'withdraw' }) =>
      updateAdvisoryStatus(args.id, args.action),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'advisoryDrafts'] });
      void queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'approvedAdvisories'] });
      void queryClient.invalidateQueries({
        queryKey: advisoryKeys.detail(variables.id),
      });
      void queryClient.invalidateQueries({ queryKey: ['advisory', 'list'] });
    },
  });
};
