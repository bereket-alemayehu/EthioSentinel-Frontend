export const advisoryKeys = {
  all: ['advisory'] as const,
  chat: (userId?: string) => [...advisoryKeys.all, 'chat', userId].filter(Boolean) as const,
};
