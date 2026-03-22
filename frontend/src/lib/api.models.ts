export type AvailabilityValue = 'W' | 'V' | 'A';

export interface User {
  id: number;
  email: string;
  displayName: string;
  permissions: string[];
}

export interface Location {
  id: number;
  name: string;
}

export interface PublicHoliday {
  id: number;
  holidayDate: string;
  name: string;
  locationId: number;
}

export interface UserWithPermissions {
  id: number;
  email: string;
  displayName: string;
  permissions: string[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AvailabilityStatus {
  userId: number;
  statusDate: string;
  status: AvailabilityValue;
}

export interface MatrixResponse {
  employees: User[];
  entries: AvailabilityStatus[];
  days: string[];
  year: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  displayName: string;
}
