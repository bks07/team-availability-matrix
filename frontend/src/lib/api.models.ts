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

export interface BulkStatusRequest {
  dates: string[];
  status: AvailabilityValue | null;
  skipWeekends: boolean;
  skipPublicHolidays: boolean;
}

export interface BulkStatusResponse {
  updatedCount: number;
}

export interface SelfRegistrationSettings {
  enabled: boolean;
}

export interface WorkSchedule {
  userId: number;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  hoursPerWeek: number | null;
  ignoreWeekends: boolean;
  ignorePublicHolidays: boolean;
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
  workSchedules: WorkSchedule[];
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

// Team Management
export interface Team {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  myRole: string;
}

export interface TeamDetail {
  id: number;
  name: string;
  description: string;
  members: TeamMember[];
}

export interface TeamMember {
  userId: number;
  displayName: string;
  email: string;
  photoUrl?: string;
  role: string;
  joinedAt: string;
}

export interface TeamInvitation {
  id: number;
  teamId: number;
  teamName: string;
  inviterName: string;
  status: string;
  createdAt: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface UpdateTeamRequest {
  name: string;
  description?: string;
}

export interface UserSearchResult {
  id: number;
  displayName: string;
  email: string;
  photoUrl?: string;
}
