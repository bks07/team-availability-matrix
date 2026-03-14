export type AvailabilityStatus = 'W' | 'V' | 'A';

export interface User {
  id: number;
  email: string;
  displayName: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AvailabilityEntry {
  userId: number;
  date: string;
  status: AvailabilityStatus;
}

export interface MatrixResponse {
  year: number;
  days: string[];
  employees: User[];
  entries: AvailabilityEntry[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  displayName: string;
}
