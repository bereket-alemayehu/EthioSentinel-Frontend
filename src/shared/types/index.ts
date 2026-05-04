export type UserRole = 'admin' | 'hew' | 'citizen' | 'researcher';

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}
