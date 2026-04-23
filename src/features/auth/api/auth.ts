export type UserRole = "citizen" | "hew" | "admin";

const AUTH_ROLE_KEY = "ethio-role";

export const privilegedRoles: UserRole[] = ["hew", "admin"];

export function getStoredRole(): UserRole | null {
  if (typeof window === "undefined") {
    return null;
  }

  const role = window.localStorage.getItem(AUTH_ROLE_KEY);
  if (role === "admin" || role === "hew" || role === "citizen") {
    return role;
  }

  return null;
}

export function setStoredRole(role: UserRole) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_ROLE_KEY, role);
}

export function clearStoredRole() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_ROLE_KEY);
}
