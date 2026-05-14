export type UserRole = 'admin' | 'hew' | 'citizen' | 'researcher';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}
