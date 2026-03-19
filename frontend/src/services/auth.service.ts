import { httpClient } from '../lib/http.client';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../lib/api.models';

export function login(payload: LoginRequest): Promise<AuthResponse> {
  return httpClient.post<AuthResponse, LoginRequest>('/auth/login', payload);
}

export function register(payload: RegisterRequest): Promise<AuthResponse> {
  return httpClient.post<AuthResponse, RegisterRequest>('/auth/register', payload);
}

export function me(): Promise<User> {
  return httpClient.get<User>('/me');
}
