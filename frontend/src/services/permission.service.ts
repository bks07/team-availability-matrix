import { httpClient } from '../lib/http.client';
import type {
  PermissionCatalogEntry,
  PermissionProfile,
  UsageReportEntry,
  UserPermissionProfile,
  UserWithPermissions,
} from '../lib/api.models';

export function getAdminUsers(): Promise<UserWithPermissions[]> {
  return httpClient.get<UserWithPermissions[]>('/admin/users');
}

export function getPermissionCatalog(): Promise<PermissionCatalogEntry[]> {
  return httpClient.get<PermissionCatalogEntry[]>('/admin/permission-catalog');
}

export function getPermissionProfiles(): Promise<PermissionProfile[]> {
  return httpClient.get<PermissionProfile[]>('/admin/permission-profiles');
}

export function createPermissionProfile(
  name: string,
  permissions: string[]
): Promise<PermissionProfile> {
  return httpClient.post<PermissionProfile, { name: string; permissions: string[] }>(
    '/admin/permission-profiles',
    { name, permissions }
  );
}

export function getPermissionProfile(id: number): Promise<PermissionProfile> {
  return httpClient.get<PermissionProfile>(`/admin/permission-profiles/${id}`);
}

export function updatePermissionProfile(
  id: number,
  name: string,
  permissions: string[]
): Promise<PermissionProfile> {
  return httpClient.put<PermissionProfile, { name: string; permissions: string[] }>(
    `/admin/permission-profiles/${id}`,
    { name, permissions }
  );
}

export function deletePermissionProfile(id: number): Promise<void> {
  return httpClient.delete(`/admin/permission-profiles/${id}`);
}

export function getUserPermissionProfile(userId: number): Promise<UserPermissionProfile> {
  return httpClient.get<UserPermissionProfile>(`/admin/users/${userId}/permission-profile`);
}

export function assignUserProfile(
  userId: number,
  profileId: number | null
): Promise<UserPermissionProfile> {
  return httpClient.put<UserPermissionProfile, { profileId: number | null }>(
    `/admin/users/${userId}/permission-profile`,
    { profileId }
  );
}

export function getUsageReport(params?: {
  profileName?: string;
  userName?: string;
}): Promise<UsageReportEntry[]> {
  return httpClient.get<UsageReportEntry[]>('/admin/permission-usage-report', params);
}

export function getUsageReportCsvUrl(): string {
  return '/admin/permission-usage-report/csv';
}
