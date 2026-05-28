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

function coerceUser(apiUser: User): User {
  const roleRaw = apiUser.role as unknown as string;
  const role =
    typeof roleRaw === "string"
      ? (roleRaw.toLowerCase() as UserRole)
      : apiUser.role;
  return { ...apiUser, role };
}

export type OtpChannel = "email" | "sms";

export type OtpDelivery = {
  email: boolean;
  sms: boolean;
  devConsoleOnly?: boolean;
};

export type RegisterResponse = {
  user: User;
  otpDelivery: OtpDelivery;
  otpChannel: OtpChannel;
  message: string;
  /** Present in development when email/SMS delivery failed — use on the OTP step. */
  devOtpCode?: string;
};

export async function registerApi(input: {
  username: string;
  phoneNumber?: string;
  email?: string;
  password: string;
  region?: string;
  assignedDistrict?: string;
  recaptchaToken: string;
  otpChannel: OtpChannel;
}): Promise<RegisterResponse> {
  const response = await api.post<{
    success: boolean;
    message: string;
    data: {
      user: User;
      otpDelivery: OtpDelivery;
      otpChannel: OtpChannel;
      devOtpCode?: string;
    };
  }>("/auth/register", input);
  return {
    user: coerceUser(response.data.data.user),
    otpDelivery: response.data.data.otpDelivery ?? { email: false, sms: false },
    otpChannel: response.data.data.otpChannel ?? input.otpChannel,
    message: response.data.message,
    devOtpCode: response.data.data.devOtpCode,
  };
}

export async function verifyOtpApi(userId: string, code: string): Promise<User> {
  const response = await api.post<AuthResponse>("/auth/verify-otp", { userId, code });
  const user = coerceUser(response.data.data.user);
  if (user.role) setStoredRole(user.role);
  return user;
}

export async function resendOtpApi(
  userId: string,
  otpChannel: OtpChannel,
): Promise<{ message: string; devOtpCode?: string }> {
  const response = await api.post<{
    success: boolean;
    message: string;
    data?: { devOtpCode?: string };
  }>(
    "/auth/resend-otp",
    { userId, otpChannel },
  );
  return {
    message: response.data.message,
    devOtpCode: response.data.data?.devOtpCode,
  };
}

export async function forgotPasswordApi(input: {
  identifier: string;
  otpChannel: OtpChannel;
}): Promise<{ message: string; devOtpCode?: string }> {
  const response = await api.post<{
    success: boolean;
    message: string;
    data?: { devOtpCode?: string };
  }>("/auth/forgot-password", input);
  return {
    message: response.data.message,
    devOtpCode: response.data.data?.devOtpCode,
  };
}

export async function resetPasswordApi(
  identifier: string,
  otpCode: string,
  newPassword: string,
): Promise<void> {
  await api.post("/auth/reset-password", { identifier, otpCode, newPassword });
}


export async function loginApi(email: string, password: string, recaptchaToken: string): Promise<User> {
  const response = await api.post<AuthResponse>("/auth/login", { email, password, recaptchaToken });
  const user = coerceUser(response.data.data.user);
  if (user.role) setStoredRole(user.role);
  return user;
}

export async function changePasswordApi(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await api.patch("/auth/me/password", { currentPassword, newPassword });
}

export async function logoutApi(): Promise<void> {
  await api.post("/auth/logout");
  clearStoredRole();
}

export async function getMeApi(): Promise<User> {
  const response = await api.get<AuthResponse>("/auth/me");
  const user = coerceUser(response.data.data.user);
  if (user.role) setStoredRole(user.role);
  return user;
}

/** Updates `assignedDistrict` / `region` on the server from device GPS (nearest configured district). */
export async function syncGeolocationFromDeviceApi(
  latitude: number,
  longitude: number,
): Promise<User> {
  const response = await api.patch<AuthResponse>("/auth/me/geolocation", {
    latitude,
    longitude,
  });
  const user = coerceUser(response.data.data.user);
  if (user.role) setStoredRole(user.role);
  return user;
}

export function getStoredRole(): UserRole | null {
  if (typeof window === "undefined") return null;
  const role = window.localStorage.getItem(AUTH_ROLE_KEY);
  return (role?.toLowerCase() as UserRole) || null;
}

export function setStoredRole(role: UserRole | string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    AUTH_ROLE_KEY,
    String(role).toLowerCase(),
  );
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
