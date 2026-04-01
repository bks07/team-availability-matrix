import { httpClient } from '../lib/http.client';
import type { User } from '../lib/api.models';
import { deriveDisplayName } from '../lib/name.utils';

type ApiUserShape = {
  id?: number;
  email?: string;
  title?: string;
  firstName?: string;
  first_name?: string;
  middleName?: string;
  middle_name?: string;
  lastName?: string;
  last_name?: string;
  displayName?: string;
  display_name?: string;
  locationId?: number | null;
  location_id?: number | null;
  defaultTeamId?: number | null;
  default_team_id?: number | null;
  locationName?: string | null;
  location_name?: string | null;
  photoUrl?: string | null;
  photo_url?: string | null;
  permissions?: string[];
};

interface StructuredUpdateProfileRequest {
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  locationId?: number | null;
  defaultTeamId?: number | null;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface ChangePasswordResponse {
  message: string;
}

function normalizeUser(response: User | ApiUserShape): User {
  const normalized = response as ApiUserShape;
  const firstName = normalized.firstName ?? normalized.first_name ?? '';
  const middleName = normalized.middleName ?? normalized.middle_name ?? '';
  const lastName = normalized.lastName ?? normalized.last_name ?? '';
  const title = normalized.title ?? '';
  const computedDisplayName = deriveDisplayName({ title, firstName, middleName, lastName }).trim();

  return {
    ...(response as User),
    title,
    firstName,
    middleName,
    lastName,
    displayName: normalized.displayName ?? normalized.display_name ?? computedDisplayName,
    locationId: normalized.locationId ?? normalized.location_id ?? null,
    defaultTeamId: normalized.defaultTeamId ?? normalized.default_team_id ?? null,
    locationName: normalized.locationName ?? normalized.location_name ?? null,
    photoUrl: normalized.photoUrl ?? normalized.photo_url ?? null,
    permissions: normalized.permissions ?? (response as User).permissions ?? []
  };
}

export function updateProfile(data: StructuredUpdateProfileRequest): Promise<User> {
  return httpClient
    .put<User | ApiUserShape, StructuredUpdateProfileRequest>('/profile', data)
    .then(normalizeUser);
}

export function changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  return httpClient.put<ChangePasswordResponse, ChangePasswordRequest>('/profile/password', data);
}

export function uploadProfilePhoto(file: File): Promise<User> {
  const formData = new FormData();
  formData.append('photo', file);

  return httpClient.postForm<User | ApiUserShape>('/profile/photo', formData).then(normalizeUser);
}

export function deleteProfilePhoto(): Promise<void> {
  return httpClient.delete<void>('/profile/photo');
}