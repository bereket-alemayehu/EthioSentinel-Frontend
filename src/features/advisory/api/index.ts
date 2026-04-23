import { api } from '@/lib/axios';
import type { Region, Advisory, SymptomResult } from '@/features/advisory/types';

export const getRegions = async (): Promise<Region[]> => {
  const response = await api.get<{ data: Region[] }>('/regions');
  return response.data.data;
};

export const getAdvisories = async (): Promise<Advisory[]> => {
  const response = await api.get<{ data: Advisory[] }>('/advisories');
  return response.data.data.filter((item) => item.status === 'APPROVED');
};

export const checkSymptoms = async (
  symptoms: string[],
  language: 'ENGLISH' | 'AMHARIC' = 'ENGLISH'
): Promise<SymptomResult> => {
  const response = await api.post<{ data: SymptomResult }>(
    '/advisories/symptom-check',
    { symptoms, language }
  );
  return response.data.data;
};
