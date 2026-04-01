export type AvailabilityValue = 'W' | 'V' | 'A';

export interface User {
  id: number;
  email: string;
  displayName: string;
  title?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  defaultTeamId?: number | null;
  locationId?: number | null;
  locationName?: string | null;
  photoUrl?: string | null;
  permissions: string[];
  permissionProfileName?: string | null;
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
  title?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  locationId?: number | null;
  locationName?: string | null;
  photoUrl?: string | null;
  permissions: string[];
  permissionProfileName?: string | null;
}

export interface CreateUserRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  password: string;
  locationId?: number | null;
  [key: string]: unknown;
}

export interface UpdateUserRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  locationId?: number | null;
  password?: string;
  [key: string]: unknown;
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
  firstName: string;
  lastName: string;
}

// Team Management
export interface Team {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  myRole: string;
}

export interface AdminTeam {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  createdAt: string;
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

export interface PermissionCatalogEntry {
  key: string;
  description: string;
  category: string;
}

export interface PermissionProfile {
  id: number;
  name: string;
  isBuiltIn: boolean;
  permissions: string[];
  userCount: number;
}

export interface UserPermissionProfile {
  userId: number;
  profileId: number | null;
  profileName: string | null;
  permissions: string[];
}

export interface UsageReportEntry {
  userId: number;
  displayName: string;
  email: string;
  profileName: string | null;
  permissions: string[];
}

export interface AuditLogEntry {
  id: number;
  adminName: string;
  eventType: string;
  profileName: string | null;
  targetUserName: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogResponse {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}
