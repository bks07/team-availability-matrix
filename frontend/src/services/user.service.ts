import { httpClient } from '../lib/http.client';
import type { BulkAssignLocationRequest, CreateUserRequest, UserWithPermissions, UpdateUserRequest, WorkSchedule } from '../lib/api.models';

export function getUsers(): Promise<UserWithPermissions[]> {
  return httpClient.get<UserWithPermissions[]>('/admin/users');
}

export function createUser(data: CreateUserRequest): Promise<UserWithPermissions> {
  return httpClient.post<UserWithPermissions, CreateUserRequest>('/admin/users', data);
}

export function updateUser(id: number, data: UpdateUserRequest): Promise<UserWithPermissions> {
  return httpClient.put<UserWithPermissions, UpdateUserRequest>(`/admin/users/${id}`, data);
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
