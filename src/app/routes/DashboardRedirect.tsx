import { Navigate } from "react-router-dom";
import { useAuth } from "@/app/providers/auth/AuthProvider";

/**
 * `/dashboard` is used by the navbar for operational roles; citizens use home/citizen routes.
 */
export function DashboardRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user?.role) {
    return <Navigate to="/citizen" replace />;
  }

  const role = String(user.role).toLowerCase();
  if (role === "admin" || role === "super_admin") {
    return <Navigate to="/admin" replace />;
  }
  if (role === "hew") {
    return <Navigate to="/hew" replace />;
  }
  if (role === "researcher") {
    return <Navigate to="/citizen" replace />;
  }
  return <Navigate to="/citizen" replace />;
}
