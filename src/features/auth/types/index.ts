export type UserRole = "citizen" | "hew" | "admin";

export interface User {
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthContextType {
  user: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
}
