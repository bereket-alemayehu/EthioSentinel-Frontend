"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getStoredRole, UserRole } from "@/lib/auth";

type RoleGateProps = {
  allowedRoles: UserRole[];
  children: React.ReactNode;
};

export function RoleGate({ allowedRoles, children }: RoleGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const role = getStoredRole();
    const allowed = role ? allowedRoles.includes(role) : false;
    setAuthorized(allowed);

    if (!allowed) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [allowedRoles, pathname, router]);

  if (!authorized) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        Redirecting to role login...
      </section>
    );
  }

  return <>{children}</>;
}
