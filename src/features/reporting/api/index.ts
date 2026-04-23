import { api } from '@/lib/axios';
import type { HewDraftReportInput } from '../lib/offlineHewReports';

export const postReport = async (report: HewDraftReportInput): Promise<void> => {
  await api.post('/reports', {
    diseaseType: report.diseaseType,
    district: report.district,
    cases: report.cases,
    deaths: report.deaths,
    date: report.date || new Date().toISOString().split('T')[0],
    reportDate: report.date,
    caseCount: report.cases,
    deathCount: report.deaths,
  });
};
