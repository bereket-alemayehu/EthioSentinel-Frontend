export type UserRole = "ADMIN" | "HEW" | "CITIZEN";

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  region: string;
  assignedDistrict?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}
