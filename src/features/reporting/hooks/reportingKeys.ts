export const reportingKeys = {
  all: ['reporting'] as const,
  reports: () => [...reportingKeys.all, 'reports'] as const,
  diseases: () => [...reportingKeys.all, 'diseases'] as const,
  history: (params?: any) => [...reportingKeys.reports(), { params }] as const,
};
