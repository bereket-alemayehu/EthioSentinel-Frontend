import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AppShell } from '@/shared/components/layout/AppShell';
import { RoleGate } from '@/shared/components/auth/RoleGate';
import { RoleHomeRedirect } from '@/app/routes/RoleHomeRedirect';
import { DashboardRedirect } from '@/app/routes/DashboardRedirect';

// Lazy load pages
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const SearchPage = lazy(() => import('@/features/search/pages/SearchPage'));
const CitizenPage = lazy(() => import('@/features/citizen/pages/CitizenPage'));
const HEWPage = lazy(() => import('@/features/hew/pages/HEWPage'));
const AdminPage = lazy(() => import('@/features/admin/pages/AdminPage'));
const SuperAdminPage = lazy(() => import('@/features/super-admin/pages/SuperAdminPage'));
const AdvisoryPage = lazy(() => import('@/features/advisory/pages/AdvisoryPage'));
const ProfilePage = lazy(() => import('@/features/auth/pages/ProfilePage'));
const SettingsPage = lazy(() => import('@/features/auth/pages/SettingsPage'));
const HealthNewsPage = lazy(() => import('@/features/citizen/pages/HealthNews'));

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
    path: '/auth/register',
    element: (
      <Suspense fallback={<PageLoader />}>
        <RegisterPage />
      </Suspense>
    ),
  },
  {
    path: '/register',
    element: <Navigate to="/auth/register" replace />,
  },
  {
    path: '/auth/forgot-password',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ForgotPasswordPage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <RoleHomeRedirect />,
      },
      {
        path: 'dashboard',
        element: <DashboardRedirect />,
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
          <RoleGate allowedRoles={['hew']}>
            <Suspense fallback={<PageLoader />}>
              <HEWPage />
            </Suspense>
          </RoleGate>
        ),
      },
      {
        path: 'admin',
        element: (
          <RoleGate allowedRoles={['admin', 'super_admin']}>
            <Suspense fallback={<PageLoader />}>
              <AdminPage />
            </Suspense>
          </RoleGate>
        ),
      },
      {
        path: 'super-admin',
        element: (
          <RoleGate allowedRoles={['super_admin']}>
            <Suspense fallback={<PageLoader />}>
              <SuperAdminPage />
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
      {
        path: 'profile',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SettingsPage />
          </Suspense>
        ),
      },
      {
        path: 'search',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SearchPage />
          </Suspense>
        ),
      },
      {
        path: 'news',
        element: (
          <Suspense fallback={<PageLoader />}>
            <HealthNewsPage />
          </Suspense>
        ),
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
