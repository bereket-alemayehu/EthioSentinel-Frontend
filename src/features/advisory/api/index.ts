import { api } from '@/shared/lib/axios';
import type { Region, Advisory, SymptomResult, ChatMessage } from '@/features/advisory/types';

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

export const getChatHistoryApi = async (): Promise<ChatMessage[]> => {
  const response = await api.get<{ data: ChatMessage[] }>('/advisories/chat/history');
  return response.data.data;
};

export const sendChatMessageApi = async (
  message: string,
  language: 'ENGLISH' | 'AMHARIC'
): Promise<ChatMessage> => {
  const response = await api.post<{ data: ChatMessage }>('/advisories/chat/message', {
    message,
    language,
  });
  return response.data.data;
};

export const sendPublicChatMessageApi = async (
  message: string,
  language: 'ENGLISH' | 'AMHARIC'
): Promise<ChatMessage> => {
  const response = await api.post<{ data: ChatMessage }>('/advisories/chat/public/message', {
    message,
    language,
  });
  return response.data.data;
};

export const clearChatHistoryApi = async (): Promise<void> => {
  await api.delete('/advisories/chat/history');
};
