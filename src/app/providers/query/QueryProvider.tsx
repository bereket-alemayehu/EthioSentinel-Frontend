import React from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient } from '@/shared/lib/query-client';
import { get, set, del } from 'idb-keyval';

// Custom IndexedDB persister using idb-keyval
const persister = {
  persistClient: async (persistClient: any) => {
    await set('react-query-cache', persistClient);
  },
  restoreClient: async () => {
    return await get('react-query-cache');
  },
  removeClient: async () => {
    await del('react-query-cache');
  },
};

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <PersistQueryClientProvider 
      client={queryClient} 
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 * 7 }} // 7 days
    >
      {children}
    </PersistQueryClientProvider>
  );
};
