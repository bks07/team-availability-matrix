import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storageKey = 'availability-matrix.session';

  authHeaders(): HttpHeaders {
    const token = this.currentToken();
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  currentToken(): string | null {
    return this.loadSession()?.token ?? null;
  }

  loadSession(): AuthResponse | null {
    const rawValue = localStorage.getItem(this.storageKey);
    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as AuthResponse;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }

  saveSession(session: AuthResponse): void {
    localStorage.setItem(this.storageKey, JSON.stringify(session));
  }

  clearSession(): void {
    localStorage.removeItem(this.storageKey);
  }

  login(payload: LoginRequest): Promise<AuthResponse> {
    return firstValueFrom(this.http.post<AuthResponse>(`${API_BASE_URL}/auth/login`, payload));
  }

  register(payload: RegisterRequest): Promise<AuthResponse> {
    return firstValueFrom(this.http.post<AuthResponse>(`${API_BASE_URL}/auth/register`, payload));
  }

  me(): Promise<User> {
    return firstValueFrom(
      this.http.get<User>(`${API_BASE_URL}/me`, { headers: this.authHeaders() })
    );
  }
}
