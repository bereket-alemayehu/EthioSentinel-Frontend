import React, { createContext, useContext, useEffect, useState } from "react";
import {
  loginApi,
  logoutApi,
  getMeApi,
  getStoredUser,
  setStoredUser,
  setStoredRole,
  syncGeolocationFromDeviceApi,
} from "@/features/auth/api/auth";
import type { User, AuthContextType } from "@/features/auth/types";
import type { UserRole } from "@/shared/types";
import { toast } from "sonner";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      try {
        const userData = await getMeApi();
        setUser(userData);
        setStoredUser(userData);
      } catch (err) {
        console.log("Network auth check failed, relying on cache if available");
        // We don't wipe the user here because we initialized it from getStoredUser()
        // unless we get a specific 401/403 but the getMeApi handles that.
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  // One session attempt: refine assigned district from device GPS when permitted (requires HTTPS or localhost).
  useEffect(() => {
    if (!user?.id || typeof window === "undefined") return;
    if (!navigator.geolocation) return;

    const key = `ethio-geo-synced-session:${user.id}`;
    if (sessionStorage.getItem(key)) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const updated = await syncGeolocationFromDeviceApi(
            pos.coords.latitude,
            pos.coords.longitude,
          );
          setUser(updated);
          setStoredUser(updated);
          sessionStorage.setItem(key, "1");
        } catch (e) {
          console.warn("Geolocation district sync skipped:", e);
        }
      },
      () => {
        sessionStorage.setItem(key, "1");
      },
      { enableHighAccuracy: false, timeout: 20_000, maximumAge: 300_000 },
    );
  }, [user?.id]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    // ── Handle Offline Login ───────────────────────────────────────────────
    if (!navigator.onLine) {
      try {
        const { verifyOfflineCredentials } = await import("@/features/auth/api/auth");
        const offlineUser = await verifyOfflineCredentials(email, password);
        
        if (offlineUser) {
          const { setStoredRole } = await import("@/features/auth/api/auth");
          setUser(offlineUser);
          setStoredUser(offlineUser);
          if (offlineUser.role) setStoredRole(offlineUser.role);
          
          setIsLoading(false);
          toast.info("Offline Login Successful", {
            description: "You are logged in using cached credentials."
          });
          return;
        } else {
          throw new Error("Invalid credentials for offline login. Please log in once while online.");
        }
      } catch (err: any) {
        setError(err.message);
        setIsLoading(false);
        throw err;
      }
    }

    // ── Handle Online Login ────────────────────────────────────────────────
    try {
      const userData = await loginApi(email, password);
      setUser(userData);
      setStoredUser(userData);
      
      // Cache credentials for future offline use
      const { saveOfflineCredentials } = await import("@/features/auth/api/auth");
      await saveOfflineCredentials(userData, password);
    } catch (err: any) {
      const message = err.message || "Failed to sign in. Please check your credentials.";
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
