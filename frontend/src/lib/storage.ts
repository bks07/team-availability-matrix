import type { AuthResponse } from './api.models';

const STORAGE_KEY = 'availability-matrix.session';
const SELECTED_TEAM_KEY = 'availability-matrix.selectedTeamId';

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
  localStorage.removeItem(SELECTED_TEAM_KEY);
}

export function loadSelectedTeamId(): number | null {
  const raw = localStorage.getItem(SELECTED_TEAM_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function saveSelectedTeamId(teamId: number | null): void {
  if (teamId == null) {
    localStorage.removeItem(SELECTED_TEAM_KEY);
  } else {
    localStorage.setItem(SELECTED_TEAM_KEY, String(teamId));
  }
}

export function currentToken(): string | null {
  return loadSession()?.token ?? null;
}

export function currentPermissions(): string[] {
  return loadSession()?.user?.permissions ?? [];
}
