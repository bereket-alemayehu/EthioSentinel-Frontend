import React, { createContext, useContext, useEffect, useState } from "react";
import { getStoredRole, setStoredRole, clearStoredRole, type UserRole } from "@/lib/auth";

interface User {
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const role = getStoredRole();
    if (role) {
      // Mock user data based on stored role
      setUser({
        name: role.charAt(0).toUpperCase() + role.slice(1),
        email: `${role}@ethiosentinel.health`,
        role: role,
      });
    }
  }, []);

  const login = (role: UserRole) => {
    setStoredRole(role);
    setUser({
      name: role.charAt(0).toUpperCase() + role.slice(1),
      email: `${role}@ethiosentinel.health`,
      role: role,
    });
  };

  const logout = () => {
    clearStoredRole();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
