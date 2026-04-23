import { useQuery, useMutation } from '@tanstack/react-query';
import { getRegions, getAdvisories, checkSymptoms } from '../api';

export const advisoryKeys = {
  all: ['advisory'] as const,
  regions: () => [...advisoryKeys.all, 'regions'] as const,
  list: () => [...advisoryKeys.all, 'list'] as const,
};

export const useRegions = () => {
  return useQuery({
    queryKey: advisoryKeys.regions(),
    queryFn: getRegions,
    staleTime: 1000 * 60 * 30, // 30 mins
  });
};

export const useAdvisories = () => {
  return useQuery({
    queryKey: advisoryKeys.list(),
    queryFn: getAdvisories,
    staleTime: 1000 * 60 * 5, // 5 mins
  });
};

export const useSymptomCheckMutation = () => {
  return useMutation({
    mutationFn: (args: { symptoms: string[]; language?: 'ENGLISH' | 'AMHARIC' }) =>
      checkSymptoms(args.symptoms, args.language),
  });
};
