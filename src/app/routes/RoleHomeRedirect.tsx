import { Navigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/auth/AuthProvider';

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
  </div>
);

/** Sends `/` visitors to the right home for their role (not always citizen). */
export function RoleHomeRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user?.role) {
    return <Navigate to="/citizen" replace />;
  }

  const role = String(user.role).toLowerCase();
  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'hew') return <Navigate to="/hew" replace />;
  return <Navigate to="/citizen" replace />;
}
