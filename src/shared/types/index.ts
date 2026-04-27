export type UserRole = 'admin' | 'hew' | 'citizen';

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}
