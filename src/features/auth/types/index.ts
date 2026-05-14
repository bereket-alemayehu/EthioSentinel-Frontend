import { type UserRole } from "@/shared/types";

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  region: string;
  assignedDistrict?: string;
  phoneNumber?: string | null;
  clearanceLevel?: number | null;
  isActive?: boolean;
  createdAt?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, recaptchaToken: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}
