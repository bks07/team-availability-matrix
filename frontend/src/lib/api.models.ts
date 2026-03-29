export type AvailabilityValue = 'W' | 'V' | 'A';

export interface User {
  id: number;
  email: string;
  displayName: string;
  locationId?: number | null;
  photoUrl?: string | null;
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
  locationId?: number | null;
  photoUrl?: string | null;
  permissions: string[];
}

export interface CreateUserRequest {
  email: string;
  displayName: string;
  password: string;
  locationId?: number | null;
}

export interface UpdateUserRequest {
  email: string;
  displayName: string;
  locationId?: number | null;
  password?: string;
}

export interface BulkAssignLocationRequest {
  userIds: number[];
  locationId: number | null;
}

export interface SelfRegistrationSettings {
  enabled: boolean;
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
  publicHolidays: PublicHoliday[];
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
