import { httpClient } from '../lib/http.client';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../lib/api.models';

type LegacyRegisterRequest = {
  displayName: string;
  email: string;
  password: string;
};

function splitDisplayName(displayName: string): { firstName: string; lastName: string } {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? '';
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : firstName;
  return { firstName, lastName };
}

export function login(payload: LoginRequest): Promise<AuthResponse> {
  return httpClient.post<AuthResponse, LoginRequest>('/auth/login', payload);
}

export function register(payload: RegisterRequest | LegacyRegisterRequest): Promise<AuthResponse> {
  const normalizedPayload: RegisterRequest = 'displayName' in payload
    ? {
        ...splitDisplayName(payload.displayName),
        email: payload.email,
        password: payload.password,
      }
    : payload;

  return httpClient.post<AuthResponse, RegisterRequest>('/auth/register', normalizedPayload);
}

export function me(): Promise<User> {
  return httpClient.get<User>('/me');
}
