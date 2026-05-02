export type UserRole = 'admin' | 'hew' | 'citizen';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}
