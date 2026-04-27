import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AppShell } from '@/shared/components/layout/AppShell';
import { RoleGate } from '@/shared/components/auth/RoleGate';

// Lazy load pages
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const CitizenPage = lazy(() => import('@/features/citizen/pages/CitizenPage'));
const HEWPage = lazy(() => import('@/features/hew/pages/HEWPage'));
const AdminPage = lazy(() => import('@/features/admin/pages/AdminPage'));
const AdvisoryPage = lazy(() => import('@/features/advisory/pages/AdvisoryPage'));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <Navigate to="/citizen" replace />,
      },
      {
        path: 'citizen',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CitizenPage />
          </Suspense>
        ),
      },
      {
        path: 'hew',
        element: (
          <RoleGate allowedRoles={['hew', 'admin']}>
            <Suspense fallback={<PageLoader />}>
              <HEWPage />
            </Suspense>
          </RoleGate>
        ),
      },
      {
        path: 'admin',
        element: (
          <RoleGate allowedRoles={['admin']}>
            <Suspense fallback={<PageLoader />}>
              <AdminPage />
            </Suspense>
          </RoleGate>
        ),
      },
      {
        path: 'advisory',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdvisoryPage />
          </Suspense>
        ),
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
