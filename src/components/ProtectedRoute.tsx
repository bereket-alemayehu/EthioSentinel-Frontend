"use client";

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getStoredRole, type UserRole } from "@/lib/auth";

type RoleGateProps = {
  allowedRoles: UserRole[];
  children: React.ReactNode;
};

export function RoleGate({ allowedRoles, children }: RoleGateProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const role = getStoredRole();
    const allowed = role ? allowedRoles.includes(role) : false;
    setAuthorized(allowed);

    if (!allowed) {
      navigate(`/login?next=${encodeURIComponent(pathname)}`, { replace: true });
    }
  }, [allowedRoles, pathname, navigate]);

  if (!authorized) {
    return (
      <section className="rounded-2xl border border-border bg-background p-4 text-sm text-light-500 shadow-sm">
        Redirecting to role login...
      </section>
    );
  }

  return <>{children}</>;
}
