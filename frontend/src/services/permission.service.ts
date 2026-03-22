import { httpClient } from '../lib/http.client';
import type { UserWithPermissions } from '../lib/api.models';

interface UserPermissionsResponse {
  userId: number;
  permissions: string[];
}

export function getAdminUsers(): Promise<UserWithPermissions[]> {
  return httpClient.get<UserWithPermissions[]>('/admin/users');
}

export function getUserPermissions(userId: number): Promise<UserPermissionsResponse> {
  return httpClient.get<UserPermissionsResponse>(`/admin/users/${userId}/permissions`);
}

export function updateUserPermissions(userId: number, permissions: string[]): Promise<UserPermissionsResponse> {
  return httpClient.put<UserPermissionsResponse, { permissions: string[] }>(`/admin/users/${userId}/permissions`, {
    permissions
  });
}
