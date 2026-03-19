import type { AuthResponse } from './api.models';

const STORAGE_KEY = 'availability-matrix.session';

export function loadSession(): AuthResponse | null {
  const rawValue = localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AuthResponse;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveSession(session: AuthResponse): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function currentToken(): string | null {
  return loadSession()?.token ?? null;
}
