import React from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
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

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <BrowserRouter>
      <PersistQueryClientProvider 
        client={queryClient} 
        persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 * 7 }} // 7 days
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
          </AuthProvider>
        </ThemeProvider>
      </PersistQueryClientProvider>
    </BrowserRouter>
  );
};
