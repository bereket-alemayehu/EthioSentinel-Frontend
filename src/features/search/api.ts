import { api } from '@/shared/lib/axios';

export interface AdvisorySearchHit {
  id: string;
  title: string;
  diseaseType: string;
  riskLevel: string;
  content: string;
  language: string;
  status: string;
  region: { name: string; code: string };
  translatedTitle?: string;
  translatedContent?: string;
}

export interface DiseaseSearchHit {
  id: number;
  name: string;
  code: string;
  description: string | null;
}

export interface GlobalSearchResult {
  query: string;
  advisories: AdvisorySearchHit[];
  diseases: DiseaseSearchHit[];
}

export async function globalSearchApi(
  q: string,
  limit = 20,
): Promise<GlobalSearchResult> {
  const response = await api.get<{
    status: string;
    message: string;
    data: GlobalSearchResult;
  }>('/search', { params: { q, limit } });
  return response.data.data;
}
