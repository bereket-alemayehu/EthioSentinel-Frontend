export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  alerts: () => [...adminKeys.all, 'alerts'] as const,
};
