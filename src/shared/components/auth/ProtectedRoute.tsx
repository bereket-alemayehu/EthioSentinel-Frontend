"use client";

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getStoredRole } from "@/features/auth/api/auth";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

/**
 * ProtectedRoute component ensures the user is authenticated.
 * It does not check for specific roles.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const role = getStoredRole();
    const isAuth = !!role;
    setAuthenticated(isAuth);

    if (!isAuth) {
      navigate(`/login?next=${encodeURIComponent(pathname)}`, { replace: true });
    }
  }, [pathname, navigate]);

  if (authenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return authenticated ? <>{children}</> : null;
}
