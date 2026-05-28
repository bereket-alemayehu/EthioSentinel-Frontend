import React, { createContext, useContext, useEffect, useState } from "react";
import {
  loginApi,
  logoutApi,
  getMeApi,
  getStoredUser,
  setStoredUser,
  setStoredRole,
  saveOfflineCredentials,
  verifyOfflineCredentials,
} from "@/features/auth/api/auth";
import type { User, AuthContextType } from "@/features/auth/types";
import type { UserRole } from "@/shared/types";
import { toast } from "sonner";
import { formatLoginErrorMessage } from "@/features/auth/utils/loginErrors";
import { isNetworkError } from "@/shared/lib/apiErrors";
import type { AxiosError } from "axios";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync role on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = getStoredUser();
    if (cached) {
      const normalized = cached.role ? { ...cached, role: String(cached.role).toLowerCase() } : cached;
      setStoredUser(normalized);
      if (normalized.role) setStoredRole(normalized.role);
      setUser(normalized);
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    async function initAuth() {
      if (!navigator.onLine) {
        setIsLoading(false);
        return;
      }
      try {
        const userData = await getMeApi();
        const normalized = userData && userData.role ? { ...userData, role: String(userData.role).toLowerCase() } : userData;
        setUser(normalized);
        setStoredUser(normalized);
      } catch {
        // No session cookie — normal on login/register before sign-in
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (email: string, password: string, recaptchaToken: string) => {
    setIsLoading(true);
    setError(null);

    const tryOfflineLogin = async (reason: string) => {
      console.log(`[Auth] Attempting offline fallback: ${reason}`);
      try {
        const offlineUser = await verifyOfflineCredentials(email, password);
        
        if (offlineUser) {
          console.log(`[Auth] Offline login success for ${offlineUser.username}`);
          
          const normalizedOffline = offlineUser && offlineUser.role ? { ...offlineUser, role: String(offlineUser.role).toLowerCase() } : offlineUser;
          // 1. Update Persistent Storage
          setStoredUser(normalizedOffline);
          if (normalizedOffline.role) setStoredRole(normalizedOffline.role);
          
          // 2. Update React State
          setUser(normalizedOffline);
          setIsLoading(false);
          
          toast.info("Offline Login Successful", {
            description: `Welcome back, ${offlineUser.username}. You are operating in offline mode.`
          });
          return true;
        }
      } catch (e) {
        console.error("[Auth] Offline verify error:", e);
      }
      return false;
    };

    // ── 1. If explicitly offline, go straight to cache ──────────────────────
    if (!navigator.onLine) {
      const success = await tryOfflineLogin("Browser reports offline");
      if (success) return;
      const msg = formatLoginErrorMessage("", undefined, { offline: true });
      setError(msg);
      setIsLoading(false);
      throw new Error(msg);
    }

    // ── 2. Try Online Login ────────────────────────────────────────────────
    try {
      const userData = await loginApi(email, password, recaptchaToken);
      
      // Cache credentials for future offline use
      await saveOfflineCredentials(userData, password);

      // Finalize state
      const normalizedUser = userData && userData.role ? { ...userData, role: String(userData.role).toLowerCase() } : userData;
      setStoredUser(normalizedUser);
      if (normalizedUser.role) setStoredRole(normalizedUser.role);
      setUser(normalizedUser);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const unreachable = isNetworkError(axiosErr);

      if (unreachable) {
        const success = await tryOfflineLogin("Network request failed");
        if (success) return;
        const msg = formatLoginErrorMessage("", undefined, {
          networkUnreachable: true,
        });
        setError(msg);
        throw new Error(msg);
      }

      const rawMessage =
        axiosErr.response?.data?.message ||
        (err instanceof Error ? err.message : null) ||
        "Failed to sign in.";
      const message = formatLoginErrorMessage(
        rawMessage,
        axiosErr.response?.status,
      );
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutApi();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
