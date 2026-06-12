import { useQuery, useMutation } from '@tanstack/react-query';
import { getRegions, getAdvisories, checkSymptoms } from '../api';
import { useTranslation } from 'react-i18next';

export const advisoryKeys = {
  all: ['advisory'] as const,
  regions: () => [...advisoryKeys.all, 'regions'] as const,
  list: (language?: 'ENGLISH' | 'AMHARIC') =>
    [...advisoryKeys.all, 'list', language ?? 'all'] as const,
};

export const useRegions = () => {
  return useQuery({
    queryKey: advisoryKeys.regions(),
    queryFn: getRegions,
    staleTime: 1000 * 60 * 5, // 5 mins
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
};

export const useAdvisories = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').toString();
  // Map common codes to backend expected values
  const apiLang = lang.toLowerCase().startsWith('am') ? 'AMHARIC' : 'ENGLISH';

  return useQuery({
    queryKey: advisoryKeys.list(apiLang),
    queryFn: () => getAdvisories(apiLang),
    staleTime: 1000 * 60 * 5, // 5 mins
  });
};

export const useSymptomCheckMutation = () => {
  return useMutation({
    mutationFn: (args: { symptoms: string[]; language?: 'ENGLISH' | 'AMHARIC' }) =>
      checkSymptoms(args.symptoms, args.language),
  });
};
