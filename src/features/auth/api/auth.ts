import { api } from "@/shared/lib/axios";
import { type UserRole } from "@/shared/types";
import type { User } from "../types";
export type { User };


const AUTH_ROLE_KEY = "ethio-role";
const AUTH_USER_KEY = "ethio-user";

export * from "../services/offlineAuth";

export const privilegedRoles: UserRole[] = ["hew", "admin"];

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

export async function loginApi(email: string, password: string): Promise<User> {
  const response = await api.post<AuthResponse>("/auth/login", { email, password });
  const user = response.data.data.user;
  if (user.role) setStoredRole(user.role);
  return user;
}

export async function logoutApi(): Promise<void> {
  await api.post("/auth/logout");
  clearStoredRole();
}

export async function getMeApi(): Promise<User> {
  const response = await api.get<AuthResponse>("/auth/me");
  const user = response.data.data.user;
  if (user.role) setStoredRole(user.role);
  return user;
}

export function getStoredRole(): UserRole | null {
  if (typeof window === "undefined") return null;
  const role = window.localStorage.getItem(AUTH_ROLE_KEY);
  return (role?.toLowerCase() as UserRole) || null;
}

export function setStoredRole(role: UserRole) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_ROLE_KEY, role);
}

export function clearStoredRole() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_ROLE_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const user = window.localStorage.getItem(AUTH_USER_KEY);
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}
