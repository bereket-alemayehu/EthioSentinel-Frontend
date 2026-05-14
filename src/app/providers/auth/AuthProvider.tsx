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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync role on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = getStoredUser();
    if (cached?.role && !window.localStorage.getItem("ethio-role")) {
      setStoredRole(String(cached.role).toLowerCase() as UserRole);
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
        setUser(userData);
        setStoredUser(userData);
      } catch (err) {
        console.log("[Auth] Session restoration failed (likely offline or expired)");
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
          
          // 1. Update Persistent Storage
          setStoredUser(offlineUser);
          if (offlineUser.role) setStoredRole(offlineUser.role);
          
          // 2. Update React State
          setUser(offlineUser);
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
      const msg = "No internet connection and no cached credentials found for this account.";
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
      setStoredUser(userData);
      if (userData.role) setStoredRole(userData.role);
      setUser(userData);
    } catch (err: any) {
      // ── 3. Fallback to offline if network is unreachable ─────────────────
      const isNetworkError = !err.response || err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED' || err.message === 'Network Error';
      
      if (isNetworkError) {
        const success = await tryOfflineLogin("Network request failed");
        if (success) return;
        const msg = "Network error and no offline credentials found.";
        setError(msg);
        throw new Error(msg);
      }

      const message = err.response?.data?.message || err.message || "Failed to sign in. Please check your credentials.";
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
