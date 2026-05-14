"use client";
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getStoredRole } from "@/features/auth/api/auth";
import { useAuth } from "@/app/providers/auth/AuthProvider";
import { type UserRole } from "@/shared/types";

type RoleGateProps = {
  allowedRoles: UserRole[];
  children: React.ReactNode;
};

/**
 * RoleGate component restricts access to children based on user roles.
 * If the user is not authenticated, it redirects to login.
 * If the user is authenticated but lacks the required role, it shows an access denied message.
 */
export function RoleGate({ allowedRoles, children }: RoleGateProps) {
  const { pathname } = useLocation();
  const { user, isLoading } = useAuth();
  
  const roleFromUser = user?.role ? (String(user.role).toLowerCase() as UserRole) : null;
  const stored = getStoredRole();
  const role = roleFromUser ?? (stored?.toLowerCase() as UserRole | null);

  console.log(`[RoleGate] Render: path=${pathname}, user=${!!user}, role=${role}, isLoading=${isLoading}`);

  const isAllowed = role ? allowedRoles.some((r) => r.toLowerCase() === role) : false;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  // Final check: if no role is found in state OR storage, then we are definitely out.
  // We prioritize the role from storage if offline to avoid flicker.
  if (!role && !isLoading) {
    console.warn(`[RoleGate] No role found at ${pathname}. Redirecting to login.`);
    return <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />;
  }

  if (!isAllowed) {
    console.error(`[RoleGate] Access Denied: Role '${role}' not in allowed roles: ${allowedRoles.join(",")}`);
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
        <div className="rounded-full bg-red-500/10 p-4 text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <h2 className="text-2xl font-black text-dark-300 dark:text-white tracking-tighter uppercase mb-2">Access Denied</h2>
        <p className="text-sm text-light-500 font-bold uppercase tracking-widest max-w-md">
          You do not have the required permissions to access this administrative context.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
