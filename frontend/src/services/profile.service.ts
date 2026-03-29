import { httpClient } from '../lib/http.client';
import type { User } from '../lib/api.models';

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

export function updateProfile(data: UpdateProfileRequest): Promise<User> {
  return httpClient.put<User, UpdateProfileRequest>('/profile', data);
}

export function changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  return httpClient.put<ChangePasswordResponse, ChangePasswordRequest>('/profile/password', data);
}

export function uploadProfilePhoto(file: File): Promise<User> {
  const formData = new FormData();
  formData.append('photo', file);

  return httpClient.postForm<User>('/profile/photo', formData);
}

export function deleteProfilePhoto(): Promise<void> {
  return httpClient.delete<void>('/profile/photo');
}