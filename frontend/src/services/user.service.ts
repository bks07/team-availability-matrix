import { httpClient } from '../lib/http.client';
import type { BulkAssignLocationRequest, CreateUserRequest, UserWithPermissions, UpdateUserRequest, WorkSchedule } from '../lib/api.models';

type LegacyCreateUserRequest = {
  email: string;
  displayName: string;
  password: string;
  locationId?: number | null;
};

type LegacyUpdateUserRequest = {
  email: string;
  displayName: string;
  locationId?: number | null;
  password?: string;
};

function splitDisplayName(displayName: string): { firstName: string; lastName: string } {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? '';
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : firstName;
  return { firstName, lastName };
}

export function getUsers(): Promise<UserWithPermissions[]> {
  return httpClient.get<UserWithPermissions[]>('/admin/users');
}

export function createUser(data: CreateUserRequest | LegacyCreateUserRequest): Promise<UserWithPermissions> {
  const payload: CreateUserRequest = 'displayName' in data
    ? {
        ...splitDisplayName(typeof data.displayName === 'string' ? data.displayName : ''),
        email: data.email,
        password: data.password,
        locationId: data.locationId,
      }
    : data;

  return httpClient.post<UserWithPermissions, CreateUserRequest>('/admin/users', payload);
}

export function updateUser(id: number, data: UpdateUserRequest | LegacyUpdateUserRequest): Promise<UserWithPermissions> {
  const payload: UpdateUserRequest = 'displayName' in data
    ? {
        ...splitDisplayName(typeof data.displayName === 'string' ? data.displayName : ''),
        email: data.email,
        locationId: data.locationId,
        password: data.password,
      }
    : data;

  return httpClient.put<UserWithPermissions, UpdateUserRequest>(`/admin/users/${id}`, payload);
}

export function deleteUser(id: number): Promise<void> {
  return httpClient.delete<void>(`/admin/users/${id}`);
}

export function bulkAssignLocation(data: BulkAssignLocationRequest): Promise<void> {
  return httpClient.put<void, BulkAssignLocationRequest>('/admin/users/bulk-location', data);
}

export function getWorkSchedule(userId: number): Promise<WorkSchedule> {
  return httpClient.get<WorkSchedule>(`/admin/users/${userId}/work-schedule`);
}

export function updateWorkSchedule(userId: number, data: Omit<WorkSchedule, 'userId'>): Promise<WorkSchedule> {
  return httpClient.put<WorkSchedule, Omit<WorkSchedule, 'userId'>>(`/admin/users/${userId}/work-schedule`, data);
}
