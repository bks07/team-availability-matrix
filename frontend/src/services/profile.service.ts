import { httpClient } from '../lib/http.client';
import type { User } from '../lib/api.models';

type ApiUserShape = {
  id?: number;
  email?: string;
  displayName?: string;
  display_name?: string;
  locationId?: number | null;
  location_id?: number | null;
  photoUrl?: string | null;
  photo_url?: string | null;
  permissions?: string[];
};

interface UpdateProfileRequest {
  email: string;
  displayName: string;
  locationId?: number | null;
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

  return {
    ...(response as User),
    displayName: normalized.displayName ?? normalized.display_name ?? '',
    locationId: normalized.locationId ?? normalized.location_id ?? null,
    photoUrl: normalized.photoUrl ?? normalized.photo_url ?? null,
    permissions: normalized.permissions ?? (response as User).permissions ?? []
  };
}

export function updateProfile(data: UpdateProfileRequest): Promise<User> {
  return httpClient
    .put<User | ApiUserShape, UpdateProfileRequest>('/profile', data)
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